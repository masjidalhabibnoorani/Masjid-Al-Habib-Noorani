/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';

interface CounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number; // ms
}

export default function Counter({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
}: CounterProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let startTime: number | null = null;
    const endValue = value;

    if (endValue === 0) {
      setCount(0);
      return;
    }

    // Set up observer to initiate animation only when visible or on mount
    const handleAnimate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      
      // Quartic dynamic easeOut formula
      const easeOutRatio = 1 - Math.pow(1 - progressRatio, 4);
      const currentVal = Math.floor(easeOutRatio * endValue);

      setCount(currentVal);
      countRef.current = currentVal;

      if (progress < duration) {
        requestAnimationFrame(handleAnimate);
      } else {
        setCount(endValue);
      }
    };

    let animationId: number;
    let observer: IntersectionObserver;

    if (elementRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animationId = requestAnimationFrame(handleAnimate);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(elementRef.current);
    } else {
      animationId = requestAnimationFrame(handleAnimate);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (observer) observer.disconnect();
    };
  }, [value, duration]);

  // Support local currency or generic format separators
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <span ref={elementRef} className="font-sans font-semibold">
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
