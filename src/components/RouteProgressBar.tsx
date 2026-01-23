import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const RouteProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    // Start the progress bar when the route changes or on initial load
    setVisible(true);
    setProgress(0);

    // Initial rapid progress
    const startTimeout = setTimeout(() => {
      setProgress(30);
    }, 50);

    // Continue progress to simulate loading
    const middleTimeout = setTimeout(() => {
      setProgress(70);
    }, 300);

    // Finish the progress bar
    const finishTimeout = setTimeout(() => {
      setProgress(100);
    }, 600);

    // Hide the bar after it finishes
    const hideTimeout = setTimeout(() => {
      setVisible(false);
      // Reset progress slightly after hiding to be ready for next time without jumping
      setTimeout(() => setProgress(0), 200);
    }, 1000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(middleTimeout);
      clearTimeout(finishTimeout);
      clearTimeout(hideTimeout);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50 pointer-events-none">
      <div
        className="h-full bg-[#2C4BFD] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default RouteProgressBar;
