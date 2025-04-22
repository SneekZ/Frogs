import { useEffect, useRef, useState, useCallback } from "react";

export function useNotificationTimer(duration: number, onFinish: () => void) {
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);
  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsPaused(false);
  }, [duration]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [isPaused, timeLeft, onFinish]);

  return { timeLeft, pause, resume, reset };
}
