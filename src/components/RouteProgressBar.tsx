import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';

const START_PCT = 15;
const TRICKLE_MS = 150;
const FADE_MS = 200;

export default function RouteProgressBar() {
  const { pathname } = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const { reduced } = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    setVisible(true);
    setProgress(START_PCT);

    const trickle = window.setInterval(() => {
      setProgress((current) => (current < 90 ? Math.min(90, current + Math.random() * 15) : current));
    }, TRICKLE_MS);

    const timer = window.setTimeout(() => {
      setProgress(100);
      window.clearInterval(trickle);
      const fade = window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, FADE_MS);
      return () => window.clearTimeout(fade);
    }, 200);

    return () => {
      window.clearInterval(trickle);
      window.clearTimeout(timer);
    };
  }, [pathname, reduced]);

  if (reduced || !visible) {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px]"
      style={{
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #06b6d4, #2563eb)',
        opacity: visible ? 1 : 0,
        transition: 'width 200ms ease-out, opacity 200ms ease-out',
      }}
    />
  );
}