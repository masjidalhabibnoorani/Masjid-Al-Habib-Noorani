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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Centered percentage (-0.5 to 0.5)
    const pctX = (x / width) - 0.5;
    const pctY = (y / height) - 0.5;

    // Maximum tilt angle (e.g. 15 degrees)
    const maxTilt = 12;
    // Rotate around Y axis for X mouse moves, and X axis for Y mouse moves
    const rY = pctX * maxTilt;
    const rX = -pctY * maxTilt;

    setRotate({ x: rX, y: rY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
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
