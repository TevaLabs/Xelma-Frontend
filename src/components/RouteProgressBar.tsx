import { useEffect, useRef, useState } from 'react';
import { useNavigation } from 'react-router-dom';

const START_PCT = 15;
const TRICKLE_MS = 150;
const COMPLETE_DELAY_MS = 350;
const FADE_MS = 200;

export default function RouteProgressBar() {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const prefersReducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Keep reduced-motion preference in sync if the OS setting changes.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onChange = () => {
      prefersReducedMotion.current = mq.matches;

      // Immediately hide an active progress bar if the preference changes.
      if (mq.matches) {
        setVisible(false);
        setProgress(0);
      }
    };

    mq.addEventListener('change', onChange);

    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion.current) {
      return;
    }

    const isNavigating = navigation.state !== 'idle';

    if (!isNavigating) {
      if (!visible) return;

      setProgress(100);

      const fade = window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, FADE_MS);

      return () => window.clearTimeout(fade);
    }

    // Navigation started.
    setVisible(true);
    setProgress((current) =>
      current > START_PCT ? current : START_PCT
    );

    const trickle = window.setInterval(() => {
      setProgress((current) =>
        current < 90
          ? Math.min(90, current + Math.random() * 10)
          : current
      );
    }, TRICKLE_MS);

    return () => {
      window.clearInterval(trickle);
    };
  }, [navigation.state, visible]);

  if (prefersReducedMotion.current || !visible) {
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