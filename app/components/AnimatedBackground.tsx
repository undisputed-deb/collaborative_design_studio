"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(147, 51, 234, 0.4) 50%, rgba(236, 72, 153, 0.4) 100%)",
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-50 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(147, 51, 234, 0.3) 50%, rgba(56, 189, 248, 0.3) 100%)",
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(168, 85, 247, 0.2) 100%)",
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          x: ["-50%", "-45%", "-50%"],
          y: ["-50%", "-55%", "-50%"],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Interactive mouse-following light */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)",
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        transition={{
          type: "spring",
          stiffness: 50,
          damping: 30,
        }}
      />
      
      {/* Mesh gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
          `
        }}
      />
    </div>
  );
}