import { useAppStore } from '@/lib/store';
import { pushNotificationService } from '@/services/pushNotificationService';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { user, setUnreadNotificationCount } = useAppStore();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Set up notification listeners
    setupNotificationListeners();

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    // Save push token when user logs in
    if (user && expoPushToken) {
      savePushToken();
    }
  }, [user, expoPushToken]);

  const registerForPushNotifications = async () => {
    try {
      const token = await pushNotificationService.registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        console.log('Push token registered:', token);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const savePushToken = async () => {
    if (user && expoPushToken) {
      const success = await pushNotificationService.savePushToken(user.id, expoPushToken);
      if (success) {
        console.log('Push token saved to database');
      }
    }
  };

  const setupNotificationListeners = () => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = pushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        setNotification(notification);
        
        // Update unread count
        setUnreadNotificationCount(prev => prev + 1);
      }
    );

    // Listener for notification responses (when user taps notification)
    responseListener.current = pushNotificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification response:', response);
        handleNotificationResponse(response);
      }
    );
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    if (data?.type) {
      switch (data.type) {
        case 'recommendation':
          if (data.recommenderId) {
            router.push({
              pathname: '/user-profile',
              params: { userId: data.recommenderId }
            });
          }
          break;
        case 'upload_approved':
        case 'upload_rejected':
        case 'download':
          if (data.materialId) {
            router.push({
              pathname: '/pdf-viewer',
              params: { materialId: data.materialId }
            });
          }
          break;
        case 'withdrawal_approved':
        case 'withdrawal_rejected':
          // Navigate to notifications page
          router.push('/(tabs)/notifications');
          break;
        case 'points_earned':
          // Navigate to profile page
          router.push('/(tabs)/profile');
          break;
        default:
          // Default: navigate to notifications page
          router.push('/(tabs)/notifications');
          break;
      }
    } else {
      // Default: navigate to notifications page
      router.push('/(tabs)/notifications');
    }
  };

  const sendTestNotification = async () => {
    if (user && expoPushToken) {
      const success = await pushNotificationService.sendPushNotification(
        user.id,
        'Test Notification',
        'This is a test push notification!',
        { type: 'test' }
      );
      
      if (success) {
        console.log('Test notification sent successfully');
      }
    }
  };

  return {
    expoPushToken,
    notification,
    sendTestNotification,
  };
}
