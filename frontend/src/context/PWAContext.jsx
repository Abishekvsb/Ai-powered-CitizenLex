import React, { createContext, useState, useEffect, useContext } from 'react';

const PWAContext = createContext();

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Detect if already running in standalone mode (installed)
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // 2. Check if beforeinstallprompt was already captured globally
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      setIsInstallable(true);
      console.log('PWA: Using early captured deferredPrompt');
    }

    // 3. Register a callback for when the early listener fires later (if it hasn't yet)
    window.onBeforeInstallPrompt = (e) => {
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA: deferredPrompt updated via global callback');
    };

    // 4. Fallback listener in case
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('beforeinstallprompt event fired and captured in context');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // 5. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
      setInstalledSuccess(true);
      console.log('App was successfully installed!');
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.onBeforeInstallPrompt = null;
    };
  }, []);

  const installApp = async () => {
    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (!promptEvent) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      const result = await promptEvent.prompt();
      console.log(`Install prompt user choice: ${result.outcome}`);
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        window.deferredPrompt = null;
        return true;
      }
    } catch (err) {
      console.error('Error during PWA installation prompt:', err);
    }
    return false;
  };

  return (
    <PWAContext.Provider value={{ 
      deferredPrompt, 
      isInstallable, 
      isInstalled, 
      installedSuccess,
      setInstalledSuccess,
      installApp 
    }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => useContext(PWAContext);
