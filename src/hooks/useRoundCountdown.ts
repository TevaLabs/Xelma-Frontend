import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to provide a resilient countdown timer.
 * @param endTime - Target end time as ISO string, timestamp (ms since epoch) or Date object.
 * @returns formattedTime - Human readable string (HH:MM:SS or MM:SS).
 *          isExpired - true when the countdown has reached zero or the endTime is in the past.
 *          timeLeftMs - milliseconds remaining (>=0).
 */
export function useRoundCountdown(
  endTime: string | number | Date
): { formattedTime: string; isExpired: boolean; timeLeftMs: number } {
  // Resolve end time to a timestamp in ms.
  const resolveTimestamp = (t: string | number | Date): number => {
    if (t instanceof Date) return t.getTime();
    if (typeof t === 'string') return new Date(t).getTime();
    return Number(t);
  };

  const targetTimestamp = resolveTimestamp(endTime);

  const [timeLeftMs, setTimeLeftMs] = useState(() => {
    const diff = targetTimestamp - Date.now();
    return diff > 0 ? diff : 0;
  });

  const intervalRef = useRef<number | null>(null);

  const format = (ms: number): string => {
    const totalSec = Math.max(0, Math.floor((ms + 500) / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    // When less than an hour, show a zero-padded minute value.
    return `${pad(m)}:${pad(s)}`;
  };

  useEffect(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    const tick = () => {
      const remaining = targetTimestamp - Date.now();
      setTimeLeftMs(remaining > 0 ? remaining : 0);
    };

    intervalRef.current = window.setInterval(tick, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
    // Re-run effect when the target timestamp changes.
  }, [targetTimestamp]);

  const isExpired = timeLeftMs <= 0;
  const formattedTime = isExpired ? '00:00' : format(timeLeftMs);

  return { formattedTime, isExpired, timeLeftMs };
}
