import { Sparkles, X } from 'lucide-react';
import { useCallback, useState } from 'react';
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

/**
 * Dismissible market-news ticker.
 *
 * Renders a dark glass ribbon that scrolls the headlines in a seamless marquee.
 * The second copy of the list exists only to make the loop continuous, so it is
 * hidden from assistive technology; a dedicated `aria-live` region announces
 * the current headlines once. Dismissing removes the ribbon and notifies the
 * optional `onClose` callback.
 */
export function NewsRibbon({ newsItems = DEFAULT_NEWS, onClose }: NewsRibbonProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onClose?.();
  }, [onClose]);

  if (dismissed || newsItems.length === 0) return null;

  const announcement = newsItems.map((item) => item.text).join('. ');

  return (
    <div className="news-ribbon" role="region" aria-label="News updates">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="news-ribbon__container">
        <span className="news-ribbon__icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>

        <div className="news-ribbon__track" aria-hidden="true">
          <div className="news-ribbon__scroll">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className={`news-ribbon__group${copy === 1 ? ' news-ribbon__group--duplicate' : ''}`}
              >
                {newsItems.map((item) => (
                  <span key={`${copy}-${item.id}`} className="news-ribbon__message">
                    <span>{item.text}</span>
                    <span className="news-ribbon__separator">•</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="news-ribbon__close"
          aria-label="Close news updates"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default NewsRibbon;
