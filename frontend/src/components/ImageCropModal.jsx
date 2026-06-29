import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Premium Canvas-based image crop modal (Zero dependencies).
 * Shows the image in a circular crop overlay.
 * Supports: Drag to reposition, Wheel Zoom, Pinch-to-zoom (touch), Slider, Reset & Fit buttons.
 * Outputs a cropped 400x400 Blob in high-quality WebP.
 */
export default function ImageCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [maxZoom, setMaxZoom] = useState(4);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  
  // Touch gestures tracking
  const [touchStartDist, setTouchStartDist] = useState(null);
  const [touchStartZoom, setTouchStartZoom] = useState(1);

  const imgRef = useRef(new window.Image());
  const CROP_SIZE = 280; // Displayed crop box dimension

  const resetToFit = useCallback(() => {
    if (!imgSize.w || !imgSize.h) return;
    
    // Fit the image entirely within the crop container
    const scaleX = CROP_SIZE / imgSize.w;
    const scaleY = CROP_SIZE / imgSize.h;
    const fitScale = Math.min(scaleX, scaleY);
    
    setMinZoom(fitScale * 0.8);
    setMaxZoom(fitScale * 5);
    setZoom(fitScale);
    setOffset({ x: 0, y: 0 });
  }, [imgSize]);

  const resetToOriginal = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Load image size and calculate initial fit scale
  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Once size is known, perform default fit
  useEffect(() => {
    if (imgSize.w > 0) {
      resetToFit();
    }
  }, [imgSize, resetToFit]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgSize.w) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    const drawW = imgSize.w * zoom;
    const drawH = imgSize.h * zoom;

    // Center image + current drag offset
    const baseX = (CROP_SIZE - drawW) / 2 + offset.x;
    const baseY = (CROP_SIZE - drawH) / 2 + offset.y;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    
    // 1. Draw blurred/semi-transparent background original image
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(img, baseX, baseY, drawW, drawH);
    ctx.restore();

    // 2. Draw circular crop window with full opacity
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    
    ctx.drawImage(img, baseX, baseY, drawW, drawH);
    ctx.restore();

    // 3. Highlight border overlay
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'var(--primary, #2563eb)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [zoom, offset, imgSize]);

  // Wheel Zoom support
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 0.05;
    const direction = e.deltaY < 0 ? 1 : -1;
    setZoom(prev => Math.min(maxZoom, Math.max(minZoom, prev + direction * zoomFactor)));
  };

  // Drag start
  const startDrag = (clientX, clientY) => {
    setDragging(true);
    setLastPos({ x: clientX, y: clientY });
  };

  const handleMouseDown = (e) => startDrag(e.clientX, e.clientY);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  }, [dragging, lastPos]);

  const handleMouseUp = () => setDragging(false);

  // Touch handlers (Drag & Pinch Zoom)
  const getTouchDistance = (touches) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      setDragging(false); // Stop dragging on pinch
      const dist = getTouchDistance(e.touches);
      setTouchStartDist(dist);
      setTouchStartZoom(zoom);
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - lastPos.x;
      const dy = e.touches[0].clientY - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && touchStartDist) {
      const dist = getTouchDistance(e.touches);
      const ratio = dist / touchStartDist;
      setZoom(Math.min(maxZoom, Math.max(minZoom, touchStartZoom * ratio)));
    }
  }, [dragging, lastPos, touchStartDist, touchStartZoom, minZoom, maxZoom, zoom]);

  const handleTouchEnd = () => {
    setDragging(false);
    setTouchStartDist(null);
  };

  // Compile final crop
  const handleConfirm = () => {
    const output = document.createElement('canvas');
    output.width = 400;
    output.height = 400;
    
    const ratio = 400 / CROP_SIZE;
    const ctx = output.getContext('2d');
    const img = imgRef.current;
    
    const drawW = imgSize.w * zoom * ratio;
    const drawH = imgSize.h * zoom * ratio;
    const baseX = (400 - drawW) / 2 + offset.x * ratio;
    const baseY = (400 - drawH) / 2 + offset.y * ratio;

    // Crop to output circle
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
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 24,
          padding: 30,
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <h5 className="fw-bold mb-1">Position and Size</h5>
        <p className="text-secondary small mb-4">Drag to align · Scroll or pinch to zoom</p>

        {/* Canvas Area */}
        <div 
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            style={{
              borderRadius: '50%',
              cursor: dragging ? 'grabbing' : 'grab',
              boxShadow: '0 0 0 4px rgba(99,102,241,0.25), 0 8px 30px rgba(0,0,0,0.3)',
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Zoom Slider */}
        <div className="d-flex align-items-center gap-3 mb-4 px-2">
          <i className="bi bi-zoom-out text-secondary" style={{ cursor: 'pointer' }} onClick={() => setZoom(prev => Math.max(minZoom, prev - 0.1))}></i>
          <input
            type="range"
            className="form-range"
            min={minZoom}
            max={maxZoom}
            step={(maxZoom - minZoom) / 100}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <i className="bi bi-zoom-in text-secondary" style={{ cursor: 'pointer' }} onClick={() => setZoom(prev => Math.min(maxZoom, prev + 0.1))}></i>
        </div>

        {/* Action Controls */}
        <div className="d-flex gap-2 justify-content-center mb-4">
          <button 
            type="button" 
            className="btn btn-sm btn-glass-secondary d-flex align-items-center gap-1"
            onClick={resetToFit}
            style={{ fontSize: '0.78rem' }}
          >
            <i className="bi bi-arrows-angle-contract"></i> Fit Image
          </button>
          <button 
            type="button" 
            className="btn btn-sm btn-glass-secondary d-flex align-items-center gap-1"
            onClick={resetToOriginal}
            style={{ fontSize: '0.78rem' }}
          >
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
        </div>

        {/* Footer Buttons */}
        <div className="d-flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            className="btn flex-fill py-2"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, fontWeight: 600 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-glass flex-fill py-2"
            onClick={handleConfirm}
            style={{ borderRadius: 12, fontWeight: 600 }}
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}
