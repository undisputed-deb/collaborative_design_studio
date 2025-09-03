"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Icon } from "@iconify/react";

export default function ModernFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: "mdi:lightning-bolt",
      title: "Real-time Collaboration",
      description: "Work together seamlessly with live cursors, instant updates, and synchronized changes across all devices.",
      gradient: "from-cyan-400 to-blue-500",
      delay: 0.1
    },
    {
      icon: "mdi:palette",
      title: "Infinite Canvas",
      description: "Never run out of space. Our infinite canvas grows with your ideas, supporting unlimited creativity.",
      gradient: "from-purple-400 to-pink-500",
      delay: 0.2
    },
    {
      icon: "mdi:brain",
      title: "AI-Powered Insights",
      description: "Smart suggestions, auto-organization, and intelligent shape recognition to enhance your workflow.",
      gradient: "from-green-400 to-emerald-500",
      delay: 0.3
    },
    {
      icon: "mdi:cloud-sync",
      title: "Cloud Sync",
      description: "Your work is automatically saved and synchronized across all your devices. Access anywhere, anytime.",
      gradient: "from-blue-400 to-indigo-500",
      delay: 0.4
    },
    {
      icon: "mdi:export",
      title: "Export Anywhere",
      description: "Export your creations in multiple formats: PNG, SVG, PDF, or share directly with custom links.",
      gradient: "from-orange-400 to-red-500",
      delay: 0.5
    },
    {
      icon: "mdi:history",
      title: "Version History",
      description: "Never lose your work. Browse through unlimited version history and restore any previous state.",
      gradient: "from-violet-400 to-purple-500",
      delay: 0.6
    }
  ];

  return (
    <section ref={ref} className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-light mb-6"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-white/70 font-light max-w-3xl mx-auto"
          >
            Everything you need to bring your ideas to life, wrapped in a beautiful and intuitive interface
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ 
                duration: 0.6, 
                delay: feature.delay,
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.2 }
              }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 h-full overflow-hidden">
                {/* Gradient Background on Hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />
                
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon icon={feature.icon} className="text-2xl text-white" />
                  </div>
                </motion.div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-medium text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 font-light leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Effect Overlay */}
                <motion.div
                  className="absolute inset-0 border border-cyan-400/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white font-medium cursor-pointer"
          >
            <Icon icon="mdi:arrow-right" />
            <span>Explore All Features</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}