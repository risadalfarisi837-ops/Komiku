'use client';

import React from 'react';

interface ScrollingTitleProps {
  text: string;
  className?: string;
}

// Pure CSS truncate — no useEffect, no resize listener, no DOM measurement
// Jauh lebih ringan, ga bikin lag
export function ScrollingTitle({ text, className = '' }: ScrollingTitleProps) {
  return (
    <div className={`overflow-hidden w-full ${className}`}>
      <span className="block truncate w-full">{text}</span>
    </div>
  );
}
