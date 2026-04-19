const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const BodyMeasurement = require('../models/BodyMeasurement');
const ProgressPhoto = require('../models/ProgressPhoto');

// Re-check env at every request via a getter so a server restart always picks up changes
function isCloudinaryReady() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} catch (e) {
  console.warn('[Body] cloudinary package not available, using local storage');
}

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'photos');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

    const b64SizeKB = Math.round((image.length * 3) / 4 / 1024);
    const isDataUrl = image.startsWith('data:');
    console.log(`[Body] Upload request: ~${b64SizeKB}KB, isDataUrl=${isDataUrl}, cloudinaryReady=${isCloudinaryReady()}`);

    if (isCloudinaryReady() && cloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: `fittrack/${req.user.id}`,
          transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
        });
        photoUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;
        thumbUrl = cloudinary.url(uploadResult.public_id, {
          width: 300, height: 300, crop: 'fill', quality: 'auto:low', format: 'jpg', secure: true,
        });
        console.log('[Body] Cloudinary upload OK:', publicId, '→', photoUrl);
      } catch (cloudErr) {
        console.error('[Body] Cloudinary upload FAILED:', cloudErr.message);
      }
    } else {
      console.log('[Body] Cloudinary not ready, using local storage');
    }

    if (!photoUrl) {
      const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ message: 'Invalid image format' });

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `${req.user.id}_${Date.now()}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(fullPath, buffer);
      const exists = fs.existsSync(fullPath);

      photoUrl = `/uploads/photos/${filename}`;
      thumbUrl = photoUrl;
      publicId = `local_${filename}`;
      console.log(`[Body] Local save: ${filename}, size=${buffer.length}B, verified=${exists}`);
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

// Specific sub-routes MUST come before the parameterized /:id route

router.get('/photos/health', auth, async (req, res) => {
  try {
    const photos = await ProgressPhoto.find({ userId: req.user.id }).lean();
    const results = photos.map((p) => {
      const isLocal = p.cloudinaryPublicId?.startsWith('local_');
      let fileExists = false;
      if (isLocal) {
        const filename = p.cloudinaryPublicId.replace('local_', '');
        fileExists = fs.existsSync(path.join(UPLOADS_DIR, filename));
      }
      return {
        id: p._id,
        pose: p.pose,
        date: p.date,
        isLocal,
        isCloudinary: !isLocal && p.cloudinaryUrl?.includes('cloudinary'),
        fileExists,
        broken: isLocal && !fileExists,
        url: p.cloudinaryUrl,
      };
    });
    res.json({
      total: photos.length,
      broken: results.filter((r) => r.broken).length,
      cloudinary: results.filter((r) => r.isCloudinary).length,
      local: results.filter((r) => r.isLocal && r.fileExists).length,
      photos: results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/photos/cleanup-broken', auth, async (req, res) => {
  try {
    const photos = await ProgressPhoto.find({ userId: req.user.id }).lean();
    const broken = photos.filter((p) => {
      if (!p.cloudinaryPublicId?.startsWith('local_')) return false;
      const filename = p.cloudinaryPublicId.replace('local_', '');
      return !fs.existsSync(path.join(UPLOADS_DIR, filename));
    });

    if (broken.length === 0) return res.json({ message: 'No broken photos found', cleaned: 0 });

    const ids = broken.map((p) => p._id);
    await ProgressPhoto.deleteMany({ _id: { $in: ids } });

    res.json({ message: `Cleaned up ${broken.length} broken photo(s)`, cleaned: broken.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/photos/:id', auth, async (req, res) => {
  try {
    const photo = await ProgressPhoto.findOne({ _id: req.params.id, userId: req.user.id });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    if (isCloudinaryReady() && cloudinary && photo.cloudinaryPublicId && !photo.cloudinaryPublicId.startsWith('local_')) {
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
