import { useState, useRef, useEffect } from "react";

import { useRoundCountdown } from "../hooks/useRoundCountdown";

interface CountdownTimerProps {
  endTime?: string | number | Date;
  className?: string;
  initialSeconds?: number;
  onExpire?: () => void;
}

export default function CountdownTimer({ endTime, className = "", initialSeconds, onExpire }: CountdownTimerProps) {
  const [resolvedEndTime] = useState(() =>
    endTime ?? (initialSeconds !== undefined ? Date.now() + initialSeconds * 1000 : Date.now())
  );
  const { formattedTime, isExpired, timeLeftMs } = useRoundCountdown(resolvedEndTime);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (isExpired && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
    if (!isExpired) {
      expiredRef.current = false;
    }
  }, [isExpired, onExpire]);

  const isUrgent = !isExpired && timeLeftMs > 0 && timeLeftMs < 120_000;

  useEffect(() => {
    if (isExpired && onExpire) {
      onExpire();
    }
  }, [isExpired, onExpire]);

  return (
    <span
      className={`font-mono text-sm font-semibold tabular-nums ${
        isUrgent ? 'text-amber-400' : 'text-cyan-300'
      } ${className}`}
    >
      {isExpired ? 'Ended' : formattedTime}
    </span>
  );
}
