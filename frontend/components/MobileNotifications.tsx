import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Zap,
  DollarSign,
  Settings
} from 'lucide-react';
import { useMobileFeatures, VIBRATION_PATTERNS } from '../hooks/useMobileFeatures';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

export interface MobileNotification {
  id: string;
  type: 'signal' | 'trade' | 'alert' | 'system' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoHide?: boolean;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  data?: any;
}

interface MobileNotificationsProps {
  className?: string;
}

export const MobileNotifications: React.FC<MobileNotificationsProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { device, vibration, notifications: notificationAPI } = useMobileFeatures();
  const { toast } = useToast();

  // Add a new notification
  const addNotification = useCallback((notification: Omit<MobileNotification, 'id' | 'timestamp'>) => {
    const newNotification: MobileNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep max 10 notifications

    // Vibrate based on priority and type
    if (device.isMobile) {
      switch (notification.priority) {
        case 'urgent':
          vibration.vibratePattern('error');
          break;
        case 'high':
          vibration.vibratePattern('notification');
          break;
        case 'medium':
          vibration.vibratePattern('success');
          break;
        default:
          vibration.vibratePattern('tap');
      }
    }

    // Show browser notification if permitted
    if (notificationAPI.permission === 'granted') {
      notificationAPI.showNotification(notification.title, {
        body: notification.message,
        tag: notification.type,
        data: notification.data,
      });
    }

    // Auto-hide notification
    if (notification.autoHide !== false) {
      const duration = notification.duration || (notification.priority === 'urgent' ? 10000 : 5000);
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, duration);
    }

    // Show toast for important notifications on desktop
    if (!device.isMobile && ['urgent', 'high'].includes(notification.priority)) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });
    }

    return newNotification.id;
  }, [device.isMobile, vibration, notificationAPI, toast]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get icon for notification type
  const getNotificationIcon = (type: MobileNotification['type']) => {
    switch (type) {
      case 'signal':
        return <Zap className="h-4 w-4" />;
      case 'trade':
        return <DollarSign className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get color classes for notification type
  const getNotificationColor = (type: MobileNotification['type'], priority: MobileNotification['priority']) => {
    const baseClasses = "border-l-4";
    
    if (priority === 'urgent') {
      return `${baseClasses} border-l-red-500 bg-red-50 dark:bg-red-950/20`;
    }
    
    switch (type) {
      case 'signal':
        return `${baseClasses} border-l-blue-500 bg-blue-50 dark:bg-blue-950/20`;
      case 'trade':
        return `${baseClasses} border-l-green-500 bg-green-50 dark:bg-green-950/20`;
      case 'success':
        return `${baseClasses} border-l-green-500 bg-green-50 dark:bg-green-950/20`;
      case 'error':
        return `${baseClasses} border-l-red-500 bg-red-50 dark:bg-red-950/20`;
      case 'alert':
        return `${baseClasses} border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20`;
      default:
        return `${baseClasses} border-l-gray-500 bg-gray-50 dark:bg-gray-950/20`;
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (device.isMobile && notificationAPI.isSupported && notificationAPI.permission === 'default') {
      // Don't auto-request, let user decide
    }
  }, [device.isMobile, notificationAPI]);

  // Example notifications for demo
  useEffect(() => {
    // Add some demo notifications after component mounts
    const timer = setTimeout(() => {
      if (notifications.length === 0) {
        addNotification({
          type: 'signal',
          title: 'New Trading Signal',
          message: 'EURUSD LONG signal with 87% confidence',
          priority: 'high',
          action: {
            label: 'View',
            callback: () => console.log('Viewing signal'),
          },
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [addNotification, notifications.length]);

  if (!device.isMobile || notifications.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed top-16 left-4 right-4 z-50 space-y-2", className)}>
      {notifications.map((notification, index) => (
        <Card
          key={notification.id}
          className={cn(
            "shadow-lg animate-in slide-in-from-top-2 duration-300",
            getNotificationColor(notification.type, notification.priority),
            index > 2 && "opacity-60 scale-95" // Fade out older notifications
          )}
          style={{
            transform: `translateY(${index * 4}px)`,
          }}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 p-1 rounded-full",
                notification.type === 'error' ? 'text-red-600' : 
                notification.type === 'success' ? 'text-green-600' :
                notification.type === 'signal' ? 'text-blue-600' :
                notification.type === 'trade' ? 'text-green-600' :
                'text-gray-600'
              )}>
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
                  {notification.priority === 'urgent' && (
                    <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                      URGENT
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {notification.message}
                </p>
                
                {/* Action button */}
                {notification.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-6 text-xs px-2"
                    onClick={notification.action.callback}
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={() => removeNotification(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground mt-2 text-right">
              {notification.timestamp.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Clear all button when there are multiple notifications */}
      {notifications.length > 1 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="text-xs h-7 px-3"
          >
            Clear All ({notifications.length})
          </Button>
        </div>
      )}
    </div>
  );
};

// Hook to use notifications from other components
export const useMobileNotifications = () => {
  const [notificationComponent, setNotificationComponent] = useState<React.ComponentType | null>(null);

  const addNotification = useCallback((notification: Omit<MobileNotification, 'id' | 'timestamp'>) => {
    // This would be connected to a global notification system
    // For now, we'll just use the toast system
    console.log('Adding notification:', notification);
  }, []);

  return {
    addNotification,
    MobileNotifications,
  };
};

export default MobileNotifications;