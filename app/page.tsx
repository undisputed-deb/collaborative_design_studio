'use client';

import AnimatedBackground from '@/app/components/AnimatedBackground';
import ModernHero from '@/app/components/ModernHero';
import ModernFeatures from '@/app/components/ModernFeatures';
import ModernCTA from '@/app/components/ModernCTA';

export default function Home() {
  return (
    <div className="relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Hero Section */}
      <ModernHero />
      
      {/* Features Section */}
      <ModernFeatures />
      
      {/* Call to Action Section */}
      <ModernCTA />
    </div>
  );
}