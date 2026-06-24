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

    // 2. Listen to beforeinstallprompt event
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('beforeinstallprompt event fired and captured globally');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // 3. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      console.log('App was successfully installed!');
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      const result = await deferredPrompt.prompt();
      console.log(`Install prompt user choice: ${result.outcome}`);
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
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
