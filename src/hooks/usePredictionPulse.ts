import { useEffect, useRef, useState } from 'react';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from './useConnectionStatus';

export interface PredictionPulseState {
  count: number;
  /** True for one animation frame after a new prediction arrives — used to trigger the flash. */
  flashing: boolean;
  isLive: boolean;
}

const FLASH_DURATION_MS = 600;
/** How often the mock ticker fires when the socket is offline (ms). */
const MOCK_INTERVAL_MS = 4_500;

/**
 * Tracks recent-prediction count from the live socket feed.
 *
 * When the socket is offline the count freezes and `isLive` is false so the
 * caller can render an appropriate offline state without showing stale motion.
 * A mock ticker is intentionally NOT used here — fabricating counts would be
 * misleading in a financial prediction app.
 */
export function usePredictionPulse(): PredictionPulseState {
  const [count, setCount] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isConnected } = useConnectionStatus();

  const triggerFlash = () => {
    setFlashing(true);
    if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
  };

  useEffect(() => {
    const unsub = socketService.onPredictionCreated(() => {
      setCount((c) => c + 1);
      triggerFlash();
    });
    return () => {
      unsub();
      if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
    };
  // triggerFlash is stable (defined outside), eslint is fine with this
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { count, flashing, isLive: isConnected };
}

/**
 * Variant used in offline-safe contexts (e.g. demo/story mode).
 * Simulates activity with a mock ticker so the component remains visually
 * useful when there is no real socket connection.
 */
export function usePredictionPulseMock(): PredictionPulseState {
  const [count, setCount] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFlash = () => {
    setFlashing(true);
    if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
  };

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1);
      triggerFlash();
    }, MOCK_INTERVAL_MS);
    return () => {
      clearInterval(id);
      if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { count, flashing, isLive: true };
}
