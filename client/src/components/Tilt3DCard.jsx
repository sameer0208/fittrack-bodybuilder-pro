import { useRef, useCallback, useState, memo } from 'react';

const DEFAULTS = {
  maxTilt: 8,
  scale: 1.02,
  speed: 400,
  glare: true,
  glareOpacity: 0.12,
  perspective: 800,
};

function Tilt3DCard({
  children,
  className = '',
  style = {},
  maxTilt = DEFAULTS.maxTilt,
  scale = DEFAULTS.scale,
  speed = DEFAULTS.speed,
  glare = DEFAULTS.glare,
  glareOpacity = DEFAULTS.glareOpacity,
  perspective = DEFAULTS.perspective,
  onClick,
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null);
  const [transform, setTransform] = useState('');
  const [glareStyle, setGlareStyle] = useState({});
  const [isHovering, setIsHovering] = useState(false);

  const handleMove = useCallback((clientX, clientY) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    const tiltX = (maxTilt - y * maxTilt * 2).toFixed(2);
    const tiltY = (x * maxTilt * 2 - maxTilt).toFixed(2);

    setTransform(
      `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`
    );

    if (glare) {
      const glareAngle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
      const glareDistance = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);
      setGlareStyle({
        background: `linear-gradient(${glareAngle}deg, rgba(255,255,255,${glareOpacity * glareDistance * 2}) 0%, transparent 60%)`,
        opacity: 1,
      });
    }
  }, [maxTilt, scale, perspective, glare, glareOpacity]);

  const handleEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleLeave = useCallback(() => {
    setIsHovering(false);
    setTransform('');
    setGlareStyle({ opacity: 0 });
  }, []);

  const handleMouseMove = useCallback((e) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e) => {
    const t = e.touches[0];
    if (t) handleMove(t.clientX, t.clientY);
  }, [handleMove]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: isHovering ? transform : '',
        transition: isHovering
          ? `transform ${speed * 0.3}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`
          : `transform ${speed}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      onMouseEnter={handleEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleLeave}
      onClick={onClick}
      {...rest}
    >
      {children}
      {glare && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: glareStyle.opacity ?? 0,
            background: glareStyle.background || 'transparent',
            transition: `opacity ${speed * 0.5}ms ease`,
            zIndex: 2,
          }}
        />
      )}
    </Tag>
  );
}

export default memo(Tilt3DCard);
