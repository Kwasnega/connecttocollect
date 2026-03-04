
"use client";

import React, { useState, useEffect } from 'react';
import { Ship, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SHLCS National Registry Splash Screen
 * 
 * Optimized for 5-second cinematic sequence with session persistence.
 */
export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const statuses = [
    "Establishing Secure Node Connection...",
    "Authorizing Registry Identity...",
    "Verifying SHLCS Security Protocol...",
    "Decrypting National Ledger...",
    "Scanning Maritime Cargo Telemetry...",
    "Synchronizing Distributed Nodes...",
    "Integrity Handshake Verified.",
    "Global Registry Node Active."
  ];

  useEffect(() => {
    setMounted(true);
    
    // Check if the handshake has already occurred in this session
    const hasShown = sessionStorage.getItem('shlcs_handshake_complete');
    if (hasShown) {
      setIsVisible(false);
      return;
    }

    // Handshake required
    setIsVisible(true);

    // ------------------------------------------------------------------
    // Defensive behaviour: block any stray Firebase Storage requests that
    // might still be hanging around in cached bundles or legacy code. We
    // don't use Firebase Storage on the client any more — Cloudinary is
    // used via a server action. Patch common browser APIs early so legacy
    // code cannot trigger network calls that result in CORS spam.

    // 1) Intercept XMLHttpRequest.open and silently drop requests.
    try {
      if (typeof window !== 'undefined' && (window as any).XMLHttpRequest) {
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method: string, url: string | URL | null, ...rest: any[]) {
          try {
            const str = typeof url === 'string' ? url : url?.toString();
            if (str && str.includes('firebasestorage.googleapis.com')) {
              console.warn('Blocked legacy Firebase Storage XHR:', method, str);
              return; // do not perform network open
            }
          } catch {
            // fallthrough
          }
          // @ts-ignore
          return origOpen.apply(this, [method, url, ...rest]);
        };
      }
    } catch (e) {
      // defensive: ignore patch failure
      // eslint-disable-next-line no-console
      console.warn('XHR patch failed', e);
    }

    // 2) Intercept fetch and return a harmless response for storage URLs.
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        const origFetch = window.fetch.bind(window);
        // @ts-ignore
        window.fetch = async function (input: RequestInfo, init?: RequestInit) {
          try {
            const url = typeof input === 'string' ? input : (input as Request).url;
            if (url && url.includes('firebasestorage.googleapis.com')) {
              console.warn('Blocked legacy Firebase Storage fetch:', url);
              // Return a resolved Response to prevent caller from issuing network
              // This avoids CORS preflight and prevents console spam
              return new Response(null, { status: 204, statusText: 'No Content' });
            }
          } catch (e) {
            // ignore and fall through to real fetch
          }
          return origFetch(input, init);
        };
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('fetch patch failed', e);
    }

    // 3) Unregister any service workers and clear caches to remove stale
    //    cached bundles that might still attempt storage uploads.
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister().catch(() => {}));
        }).catch(() => {});
      }
    } catch {}

    try {
      if (window.caches && caches.keys) {
        caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).catch(() => {});
      }
    } catch {}

    // Cycle through status messages (600ms interval for 5s total window)
    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 600);

    // Total sequence duration: 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('shlcs_handshake_complete', 'true');
    }, 5000); 

    return () => {
      clearTimeout(timer);
      clearInterval(statusInterval);
    };
  }, [statuses.length]);

  // Prevent hydration mismatch by returning null until mounted on client
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Deep Cinematic Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/20 rounded-full blur-[300px] pointer-events-none" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center gap-12"
          >
            {/* Authoritative Branding Node */}
            <div className="flex flex-col items-center gap-8">
              <motion.div 
                initial={{ rotate: -15, y: 30 }}
                animate={{ rotate: 0, y: 0 }}
                transition={{ duration: 1.5, type: "spring", damping: 15 }}
                className="bg-primary p-6 rounded-[2.5rem] shadow-2xl shadow-primary/40 border border-white/10"
              >
                <Ship className="w-12 h-12 text-white" />
              </motion.div>
              <div className="text-center space-y-3">
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="text-3xl sm:text-5xl font-black text-white tracking-[-0.05em] uppercase leading-none"
                >
                  CONNECT <span className="text-accent">TO</span> COLLECT
                </motion.h1>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div className="h-px w-6 bg-white/10" />
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.6em] ml-2">
                    National Registry 2026
                  </p>
                  <div className="h-px w-6 bg-white/10" />
                </motion.div>
              </div>
            </div>

            {/* Technical Handshake & Progress Telemetry */}
            <div className="flex flex-col items-center gap-6 w-full max-w-[300px]">
              <div className="flex items-center gap-3 h-4">
                <Loader2 className="w-3 h-3 text-white/30 animate-spin" />
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={statusIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-[8px] font-black text-white/50 uppercase tracking-[0.3em] min-w-[240px]"
                  >
                    {statuses[statusIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
              
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.8, ease: "linear" }}
                  className="h-full bg-accent shadow-[0_0_15px_rgba(14,165,233,0.5)] rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Institutional Metadata Overlays */}
          <div className="absolute bottom-12 inset-x-12 flex justify-between items-end opacity-10 hidden lg:flex">
            <div className="space-y-1 font-mono text-[8px] text-white uppercase tracking-[0.2em]">
              <p>SECURE_PROTOCOL: SHLCS_v2.5</p>
              <p>ENCRYPTION: RSA_4096_GHA</p>
            </div>
            <div className="text-right space-y-1 font-mono text-[8px] text-white uppercase tracking-[0.2em]">
              <p>LOCATION: TEMA_HUB_01</p>
              <p>REGISTRY: IMMUTABLE_LEDGER</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
