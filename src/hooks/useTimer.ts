import { useState, useEffect, useRef, useCallback } from 'react';

export function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

interface UseTimerOptions {
  initialSeconds: number;
  autoStart?: boolean;
  onExpire?: () => void;
}

export function useTimer({ initialSeconds, autoStart = true, onExpire }: UseTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const onExpireRef = useRef(onExpire);
  const expiredFiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setElapsedSeconds(0);
    setIsRunning(autoStart);
    expiredFiredRef.current = false;
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((e) => e + 1);
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (!expiredFiredRef.current) {
            expiredFiredRef.current = true;
            window.setTimeout(() => onExpireRef.current?.(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const toggle = useCallback(() => setIsRunning((r) => !r), []);
  const reset = useCallback(
    (nextSeconds = initialSeconds) => {
      expiredFiredRef.current = false;
      setSecondsLeft(nextSeconds);
      setElapsedSeconds(0);
      setIsRunning(autoStart);
    },
    [initialSeconds, autoStart]
  );

  return {
    secondsLeft,
    elapsedSeconds,
    isRunning,
    formatted: formatSeconds(secondsLeft),
    pause,
    resume,
    toggle,
    reset,
  };
}
