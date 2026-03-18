import { useEffect } from 'react';

export default function MapHero({ onAnimationComplete }) {
  useEffect(() => {
    // Call onAnimationComplete after a short delay to show buttons
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return null;
}
