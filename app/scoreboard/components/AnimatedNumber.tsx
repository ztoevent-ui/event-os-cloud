"use client";
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 60, damping: 18 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
