import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const RouteProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    setProgress(0);
    setIsVisible(true);

    const timer1 = setTimeout(() => setProgress(40), 100);
    const timer2 = setTimeout(() => setProgress(75), 500);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsVisible(false), 300);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname]);

  if (!isVisible && progress < 100) return null;

  const animationClass = prefersReducedMotion ? '' : 'transition-all duration-300 ease-out';

  return (
    <div
      className={`fixed top-0 left-0 h-1 bg-gradient-to-r from-[#2C4BFD] to-[#1E3A8A] z-50 ${animationClass}`}
      style={{
        width: `${progress}%`,
        opacity: isVisible ? 1 : 0,
        visibility: progress === 100 && !isVisible ? 'hidden' : 'visible',
      }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
};

export default RouteProgressBar;
