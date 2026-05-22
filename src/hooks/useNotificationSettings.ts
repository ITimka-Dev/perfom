import { useState, useEffect, useCallback } from 'react';

export interface NotificationSettings {
  enableToasts: boolean;
  farmNotifications: boolean;
  petNotifications: boolean;
  productionNotifications: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enableToasts: true,
  farmNotifications: true,
  petNotifications: true,
  productionNotifications: true,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem("notification-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notification settings:", e);
      }
    }
  }, []);

  const shouldShowToast = useCallback((type: 'farm' | 'pet' | 'production'): boolean => {
    if (!settings.enableToasts) return false;
    
    switch (type) {
      case 'farm':
        return settings.farmNotifications;
      case 'pet':
        return settings.petNotifications;
      case 'production':
        return settings.productionNotifications;
      default:
        return true;
    }
  }, [settings]);

  return {
    settings,
    shouldShowToast,
  };
}
