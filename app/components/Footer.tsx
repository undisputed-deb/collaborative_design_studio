"use client";

import { Icon } from "@iconify/react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-8 text-xs text-white/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} SketchFlow. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">Developed by <span className="inline-flex items-center gap-1 text-white">Deb <Icon icon="mdi:heart" className="text-red-400" /></span></span>
          <span>LinkedIn:</span>
          <a href="https://www.linkedin.com/in/debashrestha-nandi-a789a1340/" target="_blank" rel="noreferrer" className="underline hover:text-white">debashrestha-nandi-a789a1340</a>
          <span>Email:</span>
          <a href="mailto:deb86011@gmail.com" className="underline hover:text-white">deb86011@gmail.com</a>
        </div>
      </div>
    </footer>
  );
}