import { useState, useEffect, useCallback } from 'react';

// Vibration patterns
export const VIBRATION_PATTERNS = {
  light: 50,
  medium: 100,
  heavy: 200,
  success: [50, 50, 50],
  error: [100, 50, 100, 50, 100],
  notification: [200, 100, 200],
  tap: 25,
  double_tap: [25, 25, 25],
  heartbeat: [100, 30, 100, 30, 100],
} as const;

// Mobile device detection
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    hasVibration: false,
    hasNotificationAPI: false,
    isStandalone: false,
    platform: 'desktop' as 'desktop' | 'mobile' | 'tablet',
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const hasVibration = 'vibrate' in navigator;
    const hasNotificationAPI = 'Notification' in window;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;

    let platform: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (isMobile) platform = 'mobile';
    else if (isTablet) platform = 'tablet';

    setDeviceInfo({
      isMobile,
      isTablet,
      isDesktop,
      isIOS,
      isAndroid,
      hasVibration,
      hasNotificationAPI,
      isStandalone,
      platform,
    });

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newIsMobile = newWidth < 768;
      const newIsTablet = newWidth >= 768 && newWidth < 1024;
      const newIsDesktop = newWidth >= 1024;
      
      let newPlatform: 'desktop' | 'mobile' | 'tablet' = 'desktop';
      if (newIsMobile) newPlatform = 'mobile';
      else if (newIsTablet) newPlatform = 'tablet';

      setDeviceInfo(prev => ({
        ...prev,
        isMobile: newIsMobile,
        isTablet: newIsTablet,
        isDesktop: newIsDesktop,
        platform: newPlatform,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
};

// Vibration hook
export const useVibration = () => {
  const { hasVibration } = useDeviceInfo();

  const vibrate = useCallback((pattern: number | number[]) => {
    if (hasVibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [hasVibration]);

  const vibratePattern = useCallback((patternName: keyof typeof VIBRATION_PATTERNS) => {
    vibrate(VIBRATION_PATTERNS[patternName]);
  }, [vibrate]);

  return { vibrate, vibratePattern, hasVibration };
};

// Push notification hook
export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: VIBRATION_PATTERNS.notification,
        requireInteraction: false,
        ...options,
      });

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
};

// Screen wake lock (prevent sleep during active trading)
export const useWakeLock = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const acquire = useCallback(async () => {
    if (!isSupported || isActive) return false;

    try {
      const lock = await navigator.wakeLock.request('screen');
      setWakeLock(lock);
      setIsActive(true);

      lock.addEventListener('release', () => {
        setIsActive(false);
        setWakeLock(null);
      });

      return true;
    } catch (error) {
      console.error('Error acquiring wake lock:', error);
      return false;
    }
  }, [isSupported, isActive]);

  const release = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      setIsActive(false);
    }
  }, [wakeLock]);

  return {
    isSupported,
    isActive,
    acquire,
    release,
  };
};

// Fullscreen API
export const useFullscreen = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const isSupported = !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled
    );
    setIsSupported(isSupported);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!(
        document.fullscreenElement ||
        document.webkitFullscreenElement
      ));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const enter = useCallback(async (element?: Element) => {
    if (!isSupported) return false;

    const target = element || document.documentElement;

    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        await target.webkitRequestFullscreen();
      }
      return true;
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      return false;
    }
  }, [isSupported]);

  const exit = useCallback(async () => {
    if (!isSupported) return false;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
      return true;
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
      return false;
    }
  }, [isSupported]);

  const toggle = useCallback(async (element?: Element) => {
    return isFullscreen ? await exit() : await enter(element);
  }, [isFullscreen, enter, exit]);

  return {
    isSupported,
    isFullscreen,
    enter,
    exit,
    toggle,
  };
};

// Network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');

  useEffect(() => {
    const updateNetworkInfo = () => {
      setIsOnline(navigator.onLine);
      
      // @ts-ignore - Connection API is experimental
      if (navigator.connection) {
        // @ts-ignore
        setConnectionType(navigator.connection.type || 'unknown');
        // @ts-ignore
        setEffectiveType(navigator.connection.effectiveType || 'unknown');
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    updateNetworkInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      navigator.connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // @ts-ignore
      if (navigator.connection) {
        // @ts-ignore
        navigator.connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g',
    isFastConnection: effectiveType === '4g' || effectiveType === '5g',
  };
};

// Battery API (where supported)
export const useBattery = () => {
  const [batteryInfo, setBatteryInfo] = useState({
    level: 1,
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    isSupported: false,
  });

  useEffect(() => {
    // @ts-ignore - Battery API is experimental
    if ('getBattery' in navigator) {
      // @ts-ignore
      navigator.getBattery().then((battery) => {
        const updateBatteryInfo = () => {
          setBatteryInfo({
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            isSupported: true,
          });
        };

        updateBatteryInfo();

        battery.addEventListener('chargingchange', updateBatteryInfo);
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingtimechange', updateBatteryInfo);
        battery.addEventListener('dischargingtimechange', updateBatteryInfo);
      }).catch((error: any) => {
        console.log('Battery API not supported:', error);
      });
    }
  }, []);

  return batteryInfo;
};

// Comprehensive mobile features hook
export const useMobileFeatures = () => {
  const deviceInfo = useDeviceInfo();
  const vibration = useVibration();
  const notifications = useNotifications();
  const wakeLock = useWakeLock();
  const fullscreen = useFullscreen();
  const networkStatus = useNetworkStatus();
  const battery = useBattery();

  return {
    device: deviceInfo,
    vibration,
    notifications,
    wakeLock,
    fullscreen,
    network: networkStatus,
    battery,
  };
};