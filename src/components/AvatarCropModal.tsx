import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MODAL_CONTENT, MODAL_OVERLAY } from '../utils/motion';
import { useFocusTrap } from '../hooks/useFocusTrap';

type Props = {
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
};

export const AvatarCropModal: React.FC<Props> = ({ imageSrc, onCropComplete, onClose }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const applyButtonRef = useRef<HTMLButtonElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useFocusTrap(modalRef, {
    active: true,
    initialFocusRef: applyButtonRef,
    onEscape: onClose,
  });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
  }, [imageSrc]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Create circular clip path for avatar preview
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, size, size);

    // Calculate position with zoom & offset
    const minDimension = Math.min(img.width, img.height);
    const drawWidth = (img.width / minDimension) * size * scale;
    const drawHeight = (img.height / minDimension) * size * scale;

    const x = (size - drawWidth) / 2 + offsetX;
    const y = (size - drawHeight) / 2 + offsetY;

    ctx.drawImage(img, x, y, drawWidth, drawHeight);
    ctx.restore();
  }, [imageLoaded, scale, offsetX, offsetY]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 256;
    exportCanvas.height = 256;
    const ctx = exportCanvas.getContext('2d');

    if (ctx) {
      const size = 256;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, size, size);

      const minDimension = Math.min(img.width, img.height);
      const drawWidth = (img.width / minDimension) * size * scale;
      const drawHeight = (img.height / minDimension) * size * scale;

      const normOffsetX = (offsetX / 200) * size;
      const normOffsetY = (offsetY / 200) * size;

      const x = (size - drawWidth) / 2 + normOffsetX;
      const y = (size - drawHeight) / 2 + normOffsetY;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      const croppedDataUrl = exportCanvas.toDataURL('image/png');
      onCropComplete(croppedDataUrl);
    }
  };

  const modalMarkup = (
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label="Crop Avatar">
      <div className={`absolute inset-0 bg-black/70 ${MODAL_OVERLAY}`} aria-hidden />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 ${MODAL_CONTENT}`}
        >
          <h2 className="text-base font-bold tracking-wide text-gray-800 dark:text-gray-100">
            CROP YOUR AVATAR
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Drag to position and use slider to scale.
          </p>

          <div className="mt-5 flex flex-col items-center justify-center">
            <div
              className="relative h-52 w-52 overflow-hidden rounded-full border-4 border-[#2C4BFD] bg-gray-950 cursor-grab active:cursor-grabbing shadow-inner"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas ref={canvasRef} width={200} height={200} className="h-full w-full pointer-events-none" />
            </div>

            <div className="mt-5 w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>Zoom</span>
                <span>{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={scale}
                aria-label="Avatar Zoom"
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#2C4BFD]"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              ref={applyButtonRef}
              type="button"
              onClick={handleApply}
              className="rounded-xl bg-[#2C4BFD] px-6 py-2 text-xs font-semibold text-white hover:opacity-95"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
};

export default AvatarCropModal;
