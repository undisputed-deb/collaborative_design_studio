"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export default function GradientButton({ 
  children, 
  onClick, 
  variant = "primary",
  className = "" 
}: GradientButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white border-0",
    secondary: "bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-600 text-white border-0", 
    outline: "bg-transparent border-2 border-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-border text-white"
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative px-8 py-3 rounded-full font-medium text-sm overflow-hidden
        ${variants[variant]}
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="relative z-10">{children}</span>
      {variant !== "outline" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <motion.div
        className="absolute inset-0 bg-white/20 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}