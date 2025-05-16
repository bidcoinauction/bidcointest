import { useState, useEffect } from "react";
import { formatCountdown, getTimeRemaining } from "@/lib/utils";

interface UseCountdownProps {
  endTime: Date | string | number | null;
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
    try {
      if (endTime === null) {
        return 0;
      }
      
      const now = new Date().getTime();
      const end = endTime ? new Date(endTime).getTime() : now + 60000; // Default to 1 minute if null
      const totalDuration = end - now + timeRemaining * 1000;
      
      if (totalDuration <= 0) {
        return 0;
      }
      
      const percentRemaining = (timeRemaining * 1000) / totalDuration * 100;
      return Math.max(0, Math.min(100, percentRemaining));
    } catch (error) {
      console.error("Error calculating percent remaining:", error);
      return 0;
    }
  };

  // Get the seconds part for AuctionBlock timer reset mechanism
  const getSecondsRemaining = (): number => {
    // Calculate seconds for the AuctionBlock timer reset (we need actual seconds, not just formatted time)
    return Math.floor(timeRemaining % 60);
  };

  return {
    timeRemaining,
    formattedTime,
    isComplete,
    percentRemaining: calculatePercentRemaining(),
    secondsRemaining: getSecondsRemaining()
  };
}

export default useCountdown;
