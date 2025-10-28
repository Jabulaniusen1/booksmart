import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';
import { db, Notification } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const colorScheme = useColorScheme();
  const { user, setUnreadNotificationCount } = useAppStore();

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await db.getNotifications(user.id);
      if (error) {
        Alert.alert('Error', 'Failed to load notifications');
        return;
      }
      setNotifications(data || []);
      
      // Update unread count in store
      const unreadCount = (data || []).filter(n => !n.read_at).length;
      setUnreadNotificationCount(unreadCount);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.read_at) return;
    
    try {
      await db.markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      
      // Update unread count in store
      const updatedNotifications = notifications.map(n => 
        n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
      );
      const unreadCount = updatedNotifications.filter(n => !n.read_at).length;
      setUnreadNotificationCount(unreadCount);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || markingAllRead) return;
    
    setMarkingAllRead(true);
    
    try {
      console.log('Marking all notifications as read for user:', user.id);
      const { data, error } = await db.markAllNotificationsAsRead(user.id);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        Alert.alert('Error', 'Failed to mark all notifications as read');
        return;
      }
      
      console.log('Successfully marked all notifications as read:', data);
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      
      // Update unread count in store (should be 0 after marking all as read)
      setUnreadNotificationCount(0);
      
      console.log('Updated notifications state');
      
      // Show success message
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Unexpected error in markAllAsRead:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return 'thumbs-up';
      case 'withdrawal_approved':
        return 'checkmark-circle';
      case 'withdrawal_rejected':
        return 'close-circle';
      case 'upload_approved':
        return 'checkmark-circle';
      case 'upload_rejected':
        return 'close-circle';
      case 'points_earned':
        return 'trophy';
      case 'download':
        return 'download';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'recommendation':
        return Colors[colorScheme ?? 'light'].primary;
      case 'withdrawal_approved':
      case 'upload_approved':
      case 'points_earned':
        return '#10b981';
      case 'withdrawal_rejected':
      case 'upload_rejected':
        return '#dc2626';
      case 'download':
        return '#3b82f6';
      default:
        return Colors[colorScheme ?? 'light'].gray[500];
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification);
    
    // Navigate based on notification type
    if (notification.data) {
      switch (notification.type) {
        case 'upload_approved':
        case 'upload_rejected':
        case 'download':
          if (notification.data.materialId) {
            router.push({
              pathname: '/pdf-viewer',
              params: { materialId: notification.data.materialId }
            });
          }
          break;
        case 'withdrawal_approved':
        case 'withdrawal_rejected':
          // Could navigate to withdrawal history if we had that page
          break;
        case 'recommendation':
          if (notification.data.recommenderId) {
            router.push({
              pathname: '/user-profile',
              params: { userId: notification.data.recommenderId }
            });
          }
          break;
      }
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderLeftColor: getNotificationColor(item.type),
          borderLeftWidth: item.read_at ? 0 : 3,
        }
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconContainer}>
            <Ionicons 
              name={getNotificationIcon(item.type)} 
              size={20} 
              color={getNotificationColor(item.type)} 
            />
          </View>
          <View style={styles.notificationText}>
            <Text style={[
              styles.notificationTitle,
              { 
                color: Colors[colorScheme ?? 'light'].text,
                fontWeight: item.read_at ? '500' : '600'
              }
            ]}>
              {item.title}
            </Text>
            <Text style={[
              styles.notificationMessage,
              { color: Colors[colorScheme ?? 'light'].gray[600] }
            ]}>
              {item.message}
            </Text>
          </View>
          {!item.read_at && (
            <View style={styles.unreadDot} />
          )}
        </View>
        <Text style={[
          styles.notificationTime,
          { color: Colors[colorScheme ?? 'light'].gray[500] }
        ]}>
          {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.loginPrompt}>
          <Ionicons name="log-in-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
          <Text style={[styles.loginText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Please log in to view your notifications
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Login now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
        <View style={styles.headerContent}>
          <Image 
            source={require('@/assets/images/book smart logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {notifications.some(n => !n.read_at) && (
            <TouchableOpacity
              style={[
                styles.markAllButton,
                markingAllRead && { opacity: 0.6 }
              ]}
              onPress={markAllAsRead}
              disabled={markingAllRead}
            >
              <Text style={styles.markAllText}>
                {markingAllRead ? 'Marking...' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
            <Text style={[styles.emptyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
              You'll receive notifications for recommendations, uploads, withdrawals, and more!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 50,
    height: 35,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
    marginTop: 20,
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
