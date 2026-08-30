import { useState, useRef, useEffect } from 'react';

interface PredictionHelpTooltipProps {
  id?: string;
  className?: string;
}

// TODO: confirm copy with product
export function PredictionHelpTooltip({
  id = 'prediction-help-popover',
  className = '',
}: PredictionHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-label="Help: Legend and Precision rules"
        aria-expanded={isOpen}
        aria-controls={id}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-500 hover:border-gray-300 text-gray-400 hover:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
      >
        ⓘ
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={id}
          role="tooltip"
          className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl bg-gray-900 border border-gray-700 p-4 text-xs text-gray-200 shadow-xl space-y-3"
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span className="font-bold text-sm text-white">Prediction Rules</span>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-white font-bold p-1"
              aria-label="Close prediction help"
            >
              ✕
            </button>
          </div>

          <div>
            <span className="font-semibold text-cyan-400 block mb-0.5">UP/DOWN</span>
            <p className="text-gray-300">
              Predict whether the asset price will go UP or DOWN by the end of the round.
            </p>
          </div>

          <div>
            <span className="font-semibold text-yellow-400 block mb-0.5">Precision</span>
            <p className="text-gray-300">
              Precision specifies the exact target price value with up to 4 decimal places.
            </p>
          </div>

          <div>
            <span className="font-semibold text-purple-400 block mb-0.5">Legend</span>
            <p className="text-gray-300">
              Legend is an optional high-reward mode where you predict the exact target price for a bonus.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionHelpTooltip;
