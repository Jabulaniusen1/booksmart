import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAvatarSource } from '@/lib/avatar';
import { useAppStore } from '@/lib/store';
import { db, Material, User } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [isRecommended, setIsRecommended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState(false);
  
  const colorScheme = useColorScheme();
  const { user: currentUser } = useAppStore();

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Load user data
      const { data: userData, error: userError } = await db.getUserById(userId);
      if (userError) {
        Alert.alert('Error', 'Failed to load user profile');
        return;
      }
      setUser(userData);

      // Load user's materials
      const { data: materialsData, error: materialsError } = await db.getMaterials();
      if (!materialsError && materialsData) {
        const userMaterials = materialsData.filter(material => material.uploader_id === userId);
        setMaterials(userMaterials);
      }

      // Load recommendation count
      const { data: count, error: countError } = await db.getRecommendationCount(userId);
      if (!countError) {
        setRecommendationCount(count);
      }

      // Check if current user has recommended this user
      if (currentUser) {
        const { data: isRecommendedData, error: isRecommendedError } = await db.isRecommended(currentUser.id, userId);
        if (!isRecommendedError) {
          setIsRecommended(isRecommendedData);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (!currentUser || !user) return;
    
    if (currentUser.id === user.id) {
      Alert.alert('Error', 'You cannot recommend yourself');
      return;
    }

    try {
      setRecommending(true);
      
      if (isRecommended) {
        // Remove recommendation
        const { error } = await db.removeRecommendation(currentUser.id, user.id);
        if (error) {
          Alert.alert('Error', 'Failed to remove recommendation');
          return;
        }
        setIsRecommended(false);
        setRecommendationCount(prev => prev - 1);
        Alert.alert('Success', 'Recommendation removed');
      } else {
        // Add recommendation
        const { error } = await db.addRecommendation(currentUser.id, user.id);
        if (error) {
          Alert.alert('Error', 'Failed to add recommendation');
          return;
        }
        setIsRecommended(true);
        setRecommendationCount(prev => prev + 1);
        Alert.alert('Success', 'User recommended successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setRecommending(false);
    }
  };

  const isVerified = user?.is_verified || false;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Ionicons name="person-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
        <Text style={[styles.errorText, { color: Colors[colorScheme ?? 'light'].text }]}>
          User not found
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image 
                source={getAvatarSource(user.id, user.avatar_url)} 
                style={styles.avatar} 
              />
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{user.full_name}</Text>
                {isVerified && (
                  <View style={styles.verifiedTextContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <Ionicons name="thumbs-up" size={24} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'light'].text }]}>
              {recommendationCount}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Recommendations
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <Ionicons name="document-text" size={24} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'light'].text }]}>
              {materials.length}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Uploads
            </Text>
          </View>
        </View>

        {/* University Info */}
        <View style={[styles.infoCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <View style={styles.infoRow}>
            <Ionicons name="school" size={20} color={Colors[colorScheme ?? 'light'].gray[500]} />
            <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              University
            </Text>
            <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {user.school?.name || 'Not specified'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="library" size={20} color={Colors[colorScheme ?? 'light'].gray[500]} />
            <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Department
            </Text>
            <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {user.department?.name || 'Not specified'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={Colors[colorScheme ?? 'light'].gray[500]} />
            <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Joined
            </Text>
            <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {new Date(user.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* User's Uploads */}
        {materials.length > 0 && (
          <View style={[styles.uploadsCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <Text style={[styles.uploadsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Uploads ({materials.length})
            </Text>
            {materials.slice(0, 5).map((material) => (
              <TouchableOpacity 
                key={material.id} 
                style={styles.uploadItem}
                onPress={() => {
                  router.push({
                    pathname: '/pdf-viewer',
                    params: { material: JSON.stringify(material) }
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.uploadIcon}>
                  <Ionicons name="document-text" size={20} color={Colors[colorScheme ?? 'light'].primary} />
                </View>
                <View style={styles.uploadInfo}>
                  <Text style={[styles.uploadTitle, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
                    {material.title}
                  </Text>
                  <Text style={[styles.uploadDate, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
                    {new Date(material.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme ?? 'light'].gray[400]} />
              </TouchableOpacity>
            ))}
            {materials.length > 5 && (
              <Text style={[styles.moreUploads, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
                +{materials.length - 5} more uploads
              </Text>
            )}
          </View>
        )}

        {/* Action Button */}
        {currentUser && currentUser.id !== user.id && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.recommendButton,
                {
                  backgroundColor: isRecommended 
                    ? Colors[colorScheme ?? 'light'].gray[200] 
                    : Colors[colorScheme ?? 'light'].primary
                }
              ]}
              onPress={handleRecommend}
              disabled={recommending}
            >
              {recommending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons 
                    name={isRecommended ? "thumbs-up" : "thumbs-up-outline"} 
                    size={20} 
                    color={isRecommended ? Colors[colorScheme ?? 'light'].gray[700] : "white"} 
                  />
                  <Text style={[
                    styles.recommendButtonText,
                    { color: isRecommended ? Colors[colorScheme ?? 'light'].gray[700] : "white" }
                  ]}>
                    {isRecommended ? 'Recommended' : 'Recommend'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  profileSection: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  verifiedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  uploadsCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginBottom: 8,
  },
  uploadIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  uploadDate: {
    fontSize: 12,
  },
  moreUploads: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  actionContainer: {
    padding: 20,
  },
  recommendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  recommendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
