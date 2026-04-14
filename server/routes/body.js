const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const BodyMeasurement = require('../models/BodyMeasurement');
const ProgressPhoto = require('../models/ProgressPhoto');

const CLOUDINARY_CONFIGURED =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let cloudinary;
if (CLOUDINARY_CONFIGURED) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'photos');
if (!CLOUDINARY_CONFIGURED) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Body Measurements ──────────────────────────────────────────────────────

router.post('/measurements', auth, async (req, res) => {
  try {
    const entry = new BodyMeasurement({ userId: req.user.id, ...req.body });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    console.error('[Body] Save measurement error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/measurements', auth, async (req, res) => {
  try {
    const { from, to, limit = 50 } = req.query;
    const filter = { userId: req.user.id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const entries = await BodyMeasurement.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Progress Photos ────────────────────────────────────────────────────────

router.post('/photos', auth, async (req, res) => {
  try {
    const { image, pose, notes, weekNumber } = req.body;
    if (!image) return res.status(400).json({ message: 'Image data is required' });

    let photoUrl, thumbUrl, publicId;

    if (CLOUDINARY_CONFIGURED) {
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: `fittrack/${req.user.id}`,
        transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
      });
      photoUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
      thumbUrl = cloudinary.url(uploadResult.public_id, {
        width: 300, height: 300, crop: 'fill', quality: 'auto:low', format: 'jpg', secure: true,
      });
      console.log('[Body] Cloudinary upload OK:', { photoUrl, thumbUrl, publicId });
    } else {
      const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ message: 'Invalid image format' });

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `${req.user.id}_${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

      photoUrl = `/uploads/photos/${filename}`;
      thumbUrl = photoUrl;
      publicId = `local_${filename}`;
    }

    const photo = new ProgressPhoto({
      userId: req.user.id,
      pose: pose || 'front',
      cloudinaryUrl: photoUrl,
      cloudinaryPublicId: publicId,
      thumbnailUrl: thumbUrl,
      notes: notes || '',
      weekNumber: weekNumber || 1,
    });
    await photo.save();
    res.status(201).json(photo);
  } catch (err) {
    console.error('[Body] Photo upload error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/photos', auth, async (req, res) => {
  try {
    const { pose, limit = 50 } = req.query;
    const filter = { userId: req.user.id };
    if (pose) filter.pose = pose;
    const photos = await ProgressPhoto.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit))
      .lean();
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/photos/:id', auth, async (req, res) => {
  try {
    const photo = await ProgressPhoto.findOne({ _id: req.params.id, userId: req.user.id });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    if (CLOUDINARY_CONFIGURED && photo.cloudinaryPublicId && !photo.cloudinaryPublicId.startsWith('local_')) {
      await cloudinary.uploader.destroy(photo.cloudinaryPublicId).catch(() => {});
    } else if (photo.cloudinaryPublicId?.startsWith('local_')) {
      const filename = photo.cloudinaryPublicId.replace('local_', '');
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.unlink(filePath, () => {});
    }

    await ProgressPhoto.deleteOne({ _id: photo._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
