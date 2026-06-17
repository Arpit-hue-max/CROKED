"use client";

import React from "react";

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number;
  disabled?: boolean;
}

export default function ThreeDCard({
  children,
  className = "",
}: ThreeDCardProps) {
  return (
    <div className={`relative rounded-2xl ${className}`}>
      {children}
    </div>
  );
}
