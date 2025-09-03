"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "cosmic-authentication";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, signIn, signOut, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4">
        <nav className="mt-4 flex items-center justify-between rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur">
          <Link href="/" className="flex items-center gap-2 text-white">
            <img 
              src="https://storage.googleapis.com/cosmic-project-image-assets/images/a50f7c34-2442-4e40-ab30-84796a4e32c6/yo.png" 
              alt="sketchFlow"
              className="size-7 rounded-lg object-contain"
            />
            <span className="text-sm">SketchFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#sandbox" className="hover:text-white">Sandbox</a>
            <a href="#templates" className="hover:text-white">Templates</a>
            <a href="#metrics" className="hover:text-white">Metrics</a>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {!loading && (
              isAuthenticated ? (
                <button onClick={signOut} className="px-3 py-1.5 rounded-full bg-white/0 hover:bg-white/10 border border-white/20 text-sm text-white">Sign out</button>
              ) : (
                <button onClick={signIn} className="px-3 py-1.5 rounded-full bg-white text-black text-sm">Sign up</button>
              )
            )}
          </div>
          <button onClick={() => setOpen(v => !v)} className="md:hidden text-white/90">
            <Icon icon={open ? "mdi:close" : "mdi:menu"} className="text-xl" />
          </button>
        </nav>
        {open && (
          <div className="mt-2 rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur md:hidden">
            <div className="flex flex-col text-sm text-white/80">
              <a href="#features" onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg hover:bg-white/10">Features</a>
              <a href="#sandbox" onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg hover:bg-white/10">Sandbox</a>
              <a href="#templates" onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg hover:bg-white/10">Templates</a>
              <a href="#metrics" onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg hover:bg-white/10">Metrics</a>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="px-2 py-2 rounded-lg hover:bg-white/10">Dashboard</Link>
              <div className="h-px bg-white/10 my-2" />
              {!loading && (
                isAuthenticated ? (
                  <button onClick={() => { setOpen(false); signOut(); }} className="px-3 py-2 rounded-lg bg-white/0 hover:bg-white/10 border border-white/20 text-left text-white">Sign out</button>
                ) : (
                  <button onClick={() => { setOpen(false); signIn(); }} className="px-3 py-2 rounded-lg bg-white text-black">Sign up</button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}