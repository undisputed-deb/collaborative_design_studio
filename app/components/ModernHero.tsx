"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Icon } from "@iconify/react";
import GradientButton from "./GradientButton";
import { useAuth } from "cosmic-authentication";

export default function ModernHero() {
  const { signIn } = useAuth();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <motion.section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ y, opacity }}
    >
      {/* Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <Icon icon="mdi:sparkles" className="text-cyan-400" />
            <span className="text-sm text-white/90 font-light">New AI-Powered Features</span>
            <Icon icon="mdi:arrow-right" className="text-white/60" />
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-8xl font-light mb-6"
        >
          <span className="block bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
            Create
          </span>
          <span className="block bg-gradient-to-r from-purple-300 via-pink-300 to-red-300 bg-clip-text text-transparent">
            Without
          </span>
          <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
            Limits
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xl md:text-2xl font-light text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          The most beautiful and intuitive whiteboard experience. 
          <br className="hidden md:block" />
          Where ideas become reality in real-time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12"
        >
          <GradientButton onClick={signIn} variant="primary">
            <Icon icon="mdi:rocket-launch" className="mr-2" />
            Start Creating Free
          </GradientButton>
          <GradientButton variant="outline">
            <Icon icon="mdi:play" className="mr-2" />
            Watch Demo
          </GradientButton>
        </motion.div>

        {/* Floating Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="grid grid-cols-3 gap-6 max-w-2xl mx-auto"
        >
          {[
            { number: "10K+", label: "Creators" },
            { number: "50K+", label: "Projects" },
            { number: "99%", label: "Uptime" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255,255,255,0.1)"
              }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="text-2xl md:text-3xl font-light bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 + index * 0.1 }}
              >
                {stat.number}
              </motion.div>
              <div className="text-white/70 text-sm font-light">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-4 h-4 bg-cyan-400 rounded-full opacity-60"
          animate={{
            y: [0, -20, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-6 h-6 bg-purple-400 rounded-full opacity-50"
          animate={{
            y: [0, 15, 0],
            x: [0, 10, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-8 h-8 bg-pink-400 rounded-full opacity-40"
          animate={{
            y: [0, -10, 0],
            x: [0, -15, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </motion.section>
  );
}