"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Icon } from "@iconify/react";
import GradientButton from "./GradientButton";
import { useAuth } from "cosmic-authentication";

export default function ModernCTA() {
  const { signIn } = useAuth();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main CTA Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20" />
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              animate={{
                background: [
                  "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
                  "radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)"
                ]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/20 rounded-3xl p-12 md:p-16 text-center">
            {/* Floating Icons */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute top-8 left-8 text-cyan-400 opacity-60"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon icon="mdi:lightbulb" className="text-2xl" />
              </motion.div>
              <motion.div
                className="absolute top-12 right-12 text-purple-400 opacity-60"
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon icon="mdi:star" className="text-xl" />
              </motion.div>
              <motion.div
                className="absolute bottom-8 left-16 text-pink-400 opacity-60"
                animate={{
                  y: [0, -15, 0],
                  x: [0, 5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon icon="mdi:heart" className="text-lg" />
              </motion.div>
            </div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6">
                <span className="bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent">
                  Ready to Create
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                  Something Amazing?
                </span>
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/80 font-light mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Join thousands of creators who are already using sketchFlow to bring their wildest ideas to life. 
              Start your journey today with our free plan.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8"
            >
              <GradientButton onClick={signIn} variant="primary" className="text-lg px-12 py-4">
                <Icon icon="mdi:rocket-launch" className="mr-2" />
                Start Creating Now
              </GradientButton>
              <GradientButton variant="outline" className="text-lg px-12 py-4">
                <Icon icon="mdi:message" className="mr-2" />
                Contact Sales
              </GradientButton>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex items-center justify-center gap-8 text-white/60 text-sm"
            >
              <div className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="text-green-400" />
                <span>Free Forever Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:shield-check" className="text-blue-400" />
                <span>Enterprise Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon icon="mdi:heart" className="text-pink-400" />
                <span>Loved by 10K+ Users</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="grid grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto"
        >
          {[
            { number: "99.9%", label: "Uptime" },
            { number: "< 100ms", label: "Response Time" },
            { number: "24/7", label: "Support" },
            { number: "Global", label: "Scale" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="text-lg md:text-xl font-light bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-1">
                {stat.number}
              </div>
              <div className="text-white/70 text-xs font-light">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}