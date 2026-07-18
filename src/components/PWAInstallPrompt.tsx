import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, X, Download, Share } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already running as standalone (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Already installed, do not show prompt
    }

    // 2. Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Handle Android/Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt on mobile devices (or all for better visibility)
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Fallback for iOS / mobile browsers that do not fire the event
    // Show after a short delay so the user is settled
    const timer = setTimeout(() => {
      const isMobile = /android|iphone|ipad|ipod|opera mini|iemobile|wpdesktop/i.test(userAgent);
      if (isMobile && !isStandalone && !isDismissed) {
        setIsVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      // General fallback instructions for other browsers
      alert("App install karne ke liye apne browser ke menu (three dots) par click karein aur 'Add to Home Screen' select karein.");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed top-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          className="pointer-events-auto w-full max-w-md bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-500/30 text-white rounded-2xl shadow-2xl p-4 overflow-hidden relative"
        >
          {/* Accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400" />
          
          <div className="flex gap-3">
            {/* Logo container */}
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <img 
                src="https://i.postimg.cc/52Yfptkk/Masjid-Logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain rounded-lg"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-sm font-bold text-amber-300 font-sans tracking-wide">
                Masjid Al Habib Noorani
              </h4>
              <p className="text-[11px] text-emerald-100/90 font-sans mt-0.5 leading-relaxed Urdu">
                ہوم اسکرین پر ایپ شارٹ کٹ شامل کرنے اور تیز رفتار رسائی کے لیے ابھی انسٹال کریں!
              </p>
              <p className="text-[10px] text-teal-200 font-mono mt-0.5">
                Install App for Direct Mobile Access
              </p>
            </div>

            {/* Close */}
            <button 
              onClick={handleDismiss}
              className="text-emerald-300 hover:text-white p-1 hover:bg-white/10 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Buttons */}
          <div className="mt-3 flex gap-2 justify-end">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 hover:bg-white/5 rounded-lg transition-all"
            >
              No, Thanks
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-4 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[3]" /> Install App
            </button>
          </div>

          {/* iOS Drawer Instructions */}
          {showIOSInstructions && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-emerald-500/20 text-xs text-emerald-100 font-sans text-left"
            >
              <div className="bg-emerald-900/40 p-3 rounded-xl border border-emerald-500/10 space-y-2">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5" /> iOS / Safari Install Instructions:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-100/90 leading-relaxed">
                  <li>Apne Safari browser ke nichay <strong>Share (شیئر)</strong> icon par click karein.</li>
                  <li>Menu ko nichay scroll karein aur <strong>'Add to Home Screen' (ہوم اسکرین میں شامل کریں)</strong> select karein.</li>
                  <li>Uper right corner par <strong>'Add'</strong> par click karein.</li>
                </ol>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="w-full mt-1.5 py-1 text-center bg-emerald-800 hover:bg-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
