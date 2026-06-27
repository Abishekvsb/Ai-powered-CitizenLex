import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Canvas-based image crop modal.
 * Shows the image in a 1:1 aspect ratio crop frame. User can drag and use a slider to zoom.
 * On confirm, returns a cropped Blob at 400×400 px.
 */
export default function ImageCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef(new window.Image());

  const CROP_SIZE = 280; // displayed crop square px

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw canvas on every state change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgSize.w) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    const scale = zoom;
    const drawW = imgSize.w * scale;
    const drawH = imgSize.h * scale;

    // Center image in crop square
    const baseX = (CROP_SIZE - drawW) / 2 + offset.x;
    const baseY = (CROP_SIZE - drawH) / 2 + offset.y;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.save();

    // Clip to circle
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(img, baseX, baseY, drawW, drawH);
    ctx.restore();

    // Draw circle border overlay
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99,102,241,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [zoom, offset, imgSize]);

  const handleMouseDown = (e) => {
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  }, [dragging, lastPos]);

  const handleMouseUp = () => setDragging(false);

  const handleTouchStart = (e) => {
    setDragging(true);
    setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  const handleTouchMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - lastPos.x;
    const dy = e.touches[0].clientY - lastPos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, [dragging, lastPos]);

  const handleConfirm = () => {
    // Render a high-res 400×400 offscreen canvas for the final image
    const output = document.createElement('canvas');
    output.width = 400;
    output.height = 400;
    const ratio = 400 / CROP_SIZE;
    const ctx = output.getContext('2d');
    const img = imgRef.current;
    const scale = zoom;
    const drawW = imgSize.w * scale * ratio;
    const drawH = imgSize.h * scale * ratio;
    const baseX = (400 - drawW) / 2 + offset.x * ratio;
    const baseY = (400 - drawH) / 2 + offset.y * ratio;

    ctx.beginPath();
    ctx.arc(200, 200, 200, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, baseX, baseY, drawW, drawH);

    output.toBlob((blob) => {
      onConfirm(blob);
    }, 'image/webp', 0.9);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          padding: 32,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <h5 className="fw-bold mb-1">Crop Profile Photo</h5>
        <p className="text-secondary small mb-4">Drag to reposition · Zoom slider to resize</p>

        {/* Canvas crop area */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            style={{
              borderRadius: '50%',
              cursor: dragging ? 'grabbing' : 'grab',
              boxShadow: '0 0 0 4px rgba(99,102,241,0.3)',
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        </div>

        {/* Zoom slider */}
        <div className="d-flex align-items-center gap-3 mb-4 px-2">
          <i className="bi bi-zoom-out text-secondary"></i>
          <input
            type="range"
            className="form-range"
            min={0.5}
            max={3}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <i className="bi bi-zoom-in text-secondary"></i>
        </div>

        {/* Buttons */}
        <div className="d-flex gap-3">
          <button
            className="btn flex-fill"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-glass flex-fill"
            onClick={handleConfirm}
          >
            <i className="bi bi-check-lg me-2"></i>Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
