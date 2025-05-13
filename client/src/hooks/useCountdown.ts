import { useState, useEffect } from "react";
import { formatCountdown, getTimeRemaining } from "@/lib/utils";

interface UseCountdownProps {
  endTime: Date | string | number;
  onComplete?: () => void;
}

export function useCountdown({ endTime, onComplete }: UseCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(getTimeRemaining(endTime));
  const [formattedTime, setFormattedTime] = useState<string>(formatCountdown(timeRemaining));
  const [isComplete, setIsComplete] = useState<boolean>(timeRemaining <= 0);

  useEffect(() => {
    if (isComplete) {
      onComplete?.();
      return;
    }

    const intervalId = setInterval(() => {
      const remaining = getTimeRemaining(endTime);
      setTimeRemaining(remaining);
      setFormattedTime(formatCountdown(remaining));
      
      if (remaining <= 0) {
        setIsComplete(true);
        clearInterval(intervalId);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endTime, isComplete, onComplete]);

  // Calculate percentages for progress displays
  const calculatePercentRemaining = (): number => {
    const totalDuration = new Date(endTime).getTime() - new Date().getTime() + timeRemaining * 1000;
    const percentRemaining = (timeRemaining * 1000) / totalDuration * 100;
    return Math.max(0, Math.min(100, percentRemaining));
  };

  return {
    timeRemaining,
    formattedTime,
    isComplete,
    percentRemaining: calculatePercentRemaining()
  };
}

export default useCountdown;
