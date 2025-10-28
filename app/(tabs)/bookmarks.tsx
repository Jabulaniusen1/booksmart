import MaterialCard from '@/components/MaterialCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/supabase';
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

export default function BookmarksScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const { user, bookmarks, setBookmarks } = useAppStore();

  useEffect(() => {
    if (user) {
      loadBookmarks();
    }
  }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await db.getBookmarks(user.id);
      if (error) {
        Alert.alert('Error', 'Failed to load bookmarks');
        return;
      }
      setBookmarks(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookmarks');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  };

  const handleBookmark = (materialId: string) => {
    Alert.alert('Bookmark Removed', 'Material removed from your bookmarks!');
    // Remove from bookmarks
    setBookmarks(bookmarks.filter(b => b.material_id !== materialId));
  };

  const handleRecommend = (materialId: string) => {
    Alert.alert('Recommended', 'Thank you for recommending this material!');
  };

  const renderBookmark = ({ item }: { item: any }) => (
    <MaterialCard
      material={item.material}
      onBookmark={handleBookmark}
      onRecommend={handleRecommend}
    />
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.loginPrompt}>
          <Ionicons name="log-in-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
          <Text style={[styles.loginText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Please log in to view your bookmarks
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
            <Text style={styles.headerTitle}>My Bookmarks</Text>
            <Text style={styles.headerSubtitle}>
              {bookmarks.length} saved material{bookmarks.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Bookmarks List */}
      <FlatList
        data={bookmarks}
        renderItem={renderBookmark}
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
            <Ionicons name="bookmark-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
            <Text style={[styles.emptyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              No bookmarks yet
            </Text>
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
              Start bookmarking materials you find useful!
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
            >
              <Text style={styles.exploreButtonText}>Explore Materials</Text>
            </TouchableOpacity>
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
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 21,
    height: 35,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
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
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
