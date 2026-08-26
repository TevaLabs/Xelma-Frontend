import { X, Sparkles } from 'lucide-react';
import { useState, useCallback } from 'react';
import './NewsRibbon.css';

export interface NewsItem {
  id: string;
  text: string;
}

export interface NewsRibbonProps {
  newsItems?: NewsItem[];
  onClose?: () => void;
}

const DEFAULT_NEWS: NewsItem[] = [
  { id: '1', text: 'Stellar (XLM) surges 12% following major protocol upgrade' },
  { id: '2', text: 'Xelma launches community prediction markets for Stellar ecosystem' },
  { id: '3', text: 'Soroban smart contracts reach 1M daily transactions' },
  { id: '4', text: 'Stellar Development Foundation announces $10M innovation fund' },
  { id: '5', text: 'XLM/BTC trading volume hits 6-month high on decentralized exchanges' },
  { id: '6', text: 'New Stellar anchor network expands access to 15 African markets' },
];

export function NewsRibbon({ newsItems = DEFAULT_NEWS, onClose }: NewsRibbonProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onClose?.();
  }, [onClose]);

  if (dismissed || newsItems.length === 0) return null;

  return (
    <div
      className="news-ribbon"
      role="region"
      aria-label="News updates"
      aria-live="polite"
    >
      <div className="news-ribbon__container">
        <span className="news-ribbon__icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div className="news-ribbon__track">
          <div className="news-ribbon__scroll">
            {[...newsItems, ...newsItems].map((item, index) => (
              <span key={`${item.id}-${index}`} className="news-ribbon__message">
                {item.text}
                {index < newsItems.length * 2 - 1 && (
                  <span className="news-ribbon__separator" aria-hidden="true">•</span>
                )}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="news-ribbon__close"
          aria-label="Close news updates"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default NewsRibbon;
