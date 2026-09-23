/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  glow?: boolean;
  key?: React.Key;
}

export default function TiltCard({
  children,
  className = '',
  onClick,
  id,
  glow = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(hover: none)').matches;
  });

  // Mobile / Touch devices render lightweight, instantaneous native divs
  if (isTouchDevice) {
    return (
      <div
        ref={cardRef}
        id={id}
        onClick={onClick}
        className={`relative glass-panel rounded-2xl p-4 sm:p-6 overflow-hidden border border-pine-border transition-all duration-150 active:scale-[0.99] select-none ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || window.matchMedia('(hover: none)').matches) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const card = cardRef.current;
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = clientX - left;
      const y = clientY - top;

      const pctX = (x / width) - 0.5;
      const pctY = (y / height) - 0.5;

      const maxTilt = 10;
      const rY = pctX * maxTilt;
      const rX = -pctY * maxTilt;

      setRotate({ x: rX, y: rY });
    });
  };

  const handleMouseEnter = () => {
    if (!window.matchMedia('(hover: none)').matches) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      id={id}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative glass-panel rounded-2xl p-6 overflow-hidden border border-pine-border transition-shadow duration-300 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${glow ? 'neon-border-glow' : ''} ${className}`}
      style={{
        transformStyle: 'preserve-3d',
      }}
      animate={{
        rotateX: rotate.x,
        rotateY: rotate.y,
        scale: isHovered ? 1.025 : 1,
        z: isHovered ? 20 : 0,
      }}
      transition={{ type: 'spring', stiffness: 180, damping: 18, mass: 0.2 }}
    >
      {/* Background soft lighting glow */}
      {glow && (
        <div
          className={`absolute inset-0 pointer-events-none bg-radial from-emerald-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : ''
          }`}
          style={{
            transform: 'translateZ(5px)'
          }}
        />
      )}
      
      {/* Inner safe container */}
      <div style={{ transform: 'translateZ(10px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
