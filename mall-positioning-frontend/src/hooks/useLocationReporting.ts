// hooks/useLocationReporting.ts
import { useEffect, useRef, useState } from 'react';

export function useLocationReporting(options: {
  interval: number;
  onReport: (position: GeolocationPosition) => void;
}) {
  const [isActive, setIsActive] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const watchId = useRef<number>();

  const startTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      position => {
        const { coords } = position;
        setAccuracy(coords.accuracy);
        options.onReport(position);
      },
      error => {
        console.error('定位错误:', error);
        setIsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    setIsActive(true);
  };

  const stopTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      setIsActive(false);
    }
  };

  // 自动重试机制
  useEffect(() => {
    if (isActive) {
      const timer = setInterval(startTracking, options.interval);
      return () => clearInterval(timer);
    }
  }, [isActive]);

  return { accuracy, isActive, start: startTracking, stop: stopTracking };
}
