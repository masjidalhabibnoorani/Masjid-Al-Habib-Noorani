/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function MagneticButton({
  children,
  className = '',
  onClick,
  id,
  type = 'button',
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current || disabled) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Find centers
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Relative offsets
    const offsetX = clientX - centerX;
    const offsetY = clientY - centerY;

    // Control factor (how much displacement is allowed, e.g. max 12px)
    const factor = 0.22;
    setPosition({ x: offsetX * factor, y: offsetY * factor });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      id={id}
      type={type}
      disabled={disabled}
      className={`relative justify-center items-center font-button text-sm tracking-wider uppercase py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform active:scale-95 text-pine-text-heading bg-pine-btn border border-pine-border hover:bg-pine-btn-hover hover:border-pine-btn shadow-lg disabled:opacity-50 disabled:pointer-events-none ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      <span className="relative z-10 pointer-events-none">{children}</span>
    </motion.button>
  );
}
