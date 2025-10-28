import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getAvatarSource } from '@/lib/avatar';
import { useAppStore } from '@/lib/store';
import { auth, db, Material } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [userMaterials, setUserMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const { user, setUser } = useAppStore();
  const { sendTestNotification } = usePushNotifications();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load recommendation count
      const { data: count, error: countError } = await db.getRecommendationCount(user.id);
      if (!countError) {
        setRecommendationCount(count);
      }

      // Load user's materials
      const { data: materialsData, error: materialsError } = await db.getMaterials();
      if (!materialsError && materialsData) {
        const myMaterials = materialsData.filter(material => material.uploader_id === user.id);
        setUserMaterials(myMaterials);
        
        // Update verification status based on actual uploads
        await db.checkAndUpdateVerification(user.id);
        
        // Reload user data to get updated verification status
        const { data: updatedUser, error: userError } = await db.getUserById(user.id);
        if (!userError && updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await auth.signOut();
              setUser(null);
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Initialize form with current user data
    setEditForm({
      name: user?.full_name || '',
      email: user?.email || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name || !editForm.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) return;

    try {
      const { data: updatedUser, error } = await db.updateUser(user.id, {
        full_name: editForm.name,
        email: editForm.email,
        // Note: department and level are not in the schema, so we'll skip them for now
      });

      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      setUser(updatedUser);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const updateEditForm = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBankDetails = () => {
    setShowBankModal(true);
  };

  const handleSaveBankDetails = () => {
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      Alert.alert('Error', 'Please fill in all bank details');
      return;
    }
    
    // Update user with bank details
    if (user) {
      setUser({
        ...user,
        // @ts-expect-error: extending user for UI state only, not persisted to DB
        bank_name: bankDetails.bankName,
        account_number: bankDetails.accountNumber,
        account_name: bankDetails.accountName,
      });
    }
    
    setShowBankModal(false);
    Alert.alert('Success', 'Bank details saved successfully!');
  };

  const getPointsProgress = () => {
    if (!user) return 0;
    return Math.min((user.points / 30) * 100, 100);
  };

  const isEligibleForPayout = () => {
    return user && user.points >= 30;
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.loginPrompt}>
          <Ionicons name="log-in-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
          <Text style={[styles.loginText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Please log in to view your profile
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
          <View style={styles.headerTop}>
            <Image 
              source={require('@/assets/images/book smart logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image 
                source={getAvatarSource(user.id, user.avatar_url)} 
                style={styles.avatar} 
              />
              {recommendationCount >= 2 && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{user.full_name}</Text>
                {recommendationCount >= 2 && (
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
            <Ionicons name="trophy" size={24} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'light'].text }]}>
              {user.points}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Points
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <Ionicons name="star" size={24} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'light'].text }]}>
              {recommendationCount}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Recommendations
            </Text>
          </View>
        </View>

        {/* Verification Status */}
        <View style={[styles.verificationCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <View style={styles.verificationHeader}>
            <Ionicons 
              name={user.is_verified ? "checkmark-circle" : "lock-closed"} 
              size={24} 
              color={user.is_verified ? "#10b981" : Colors[colorScheme ?? 'light'].gray[500]} 
            />
            <Text style={[styles.verificationTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {user.is_verified ? 'Verified User' : 'Verification Required'}
            </Text>
          </View>
          <Text style={[styles.verificationText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
            {user.is_verified 
              ? 'You can earn points and request withdrawals'
              : `Upload ${10 - userMaterials.length} more materials to get verified`
            }
          </Text>
          {!user.is_verified && (
            <View style={styles.uploadProgress}>
              <View style={[styles.uploadProgressBar, { backgroundColor: Colors[colorScheme ?? 'light'].gray[200] }]}>
                <View
                  style={[
                    styles.uploadProgressFill,
                    {
                      backgroundColor: Colors[colorScheme ?? 'light'].primary,
                      width: `${Math.min((userMaterials.length / 10) * 100, 100)}%`,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.uploadProgressText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
                {userMaterials.length}/10 uploads
              </Text>
            </View>
          )}
        </View>

        {/* Points Progress - Only show if verified */}
        {user.is_verified && (
          <View style={[styles.progressCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Points Progress
              </Text>
              <Text style={[styles.progressSubtitle, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
                {user.points}/30 points
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: Colors[colorScheme ?? 'light'].gray[200] }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].primary,
                    width: `${getPointsProgress()}%`,
                  }
                ]}
              />
            </View>
            {isEligibleForPayout() && (
              <View style={[styles.payoutBanner, { backgroundColor: Colors[colorScheme ?? 'light'].success }]}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.payoutText}>Eligible for payout!</Text>
              </View>
            )}
          </View>
        )}

        {/* University Info */}
        <View style={[styles.infoCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <View style={styles.infoRow}>
            <Ionicons name="school" size={20} color={Colors[colorScheme ?? 'light'].gray[500]} />
            <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              University
            </Text>
            <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              University of Lagos
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="library" size={20} color={Colors[colorScheme ?? 'light'].gray[500]} />
            <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Department
            </Text>
            <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {user.department_id || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* My Uploads */}
        <View style={[styles.uploadsCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <View style={styles.uploadsHeader}>
            <Ionicons name="document-text" size={20} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={[styles.uploadsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              My Uploads ({userMaterials.length})
            </Text>
          </View>
          
          {userMaterials.length > 0 ? (
            <View style={styles.uploadsList}>
              {userMaterials.slice(0, 5).map((material) => (
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
                    <View style={styles.uploadMeta}>
                      <Text style={[styles.uploadStatus, { 
                        color: material.status === 'approved' ? '#10b981' : 
                               material.status === 'pending' ? '#f59e0b' : '#dc2626'
                      }]}>
                        {material.status.charAt(0).toUpperCase() + material.status.slice(1)}
                      </Text>
                      <Text style={[styles.uploadDate, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
                        {new Date(material.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme ?? 'light'].gray[400]} />
                </TouchableOpacity>
              ))}
              {userMaterials.length > 5 && (
                <Text style={[styles.moreUploads, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
                  +{userMaterials.length - 5} more uploads
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyUploads}>
              <Ionicons name="document-outline" size={48} color={Colors[colorScheme ?? 'light'].gray[400]} />
              <Text style={[styles.emptyUploadsText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
                No uploads yet
              </Text>
              <Text style={[styles.emptyUploadsSubtext, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
                Start uploading materials to get verified!
              </Text>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
                onPress={() => router.push('/(tabs)/upload')}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.uploadButtonText}>Upload Material</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {user.is_verified && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
              onPress={handleBankDetails}
            >
              <Ionicons name="card" size={20} color="white" />
              <Text style={styles.actionButtonText}>Bank Details</Text>
            </TouchableOpacity>
          )}

          {/* <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={sendTestNotification}
          >
            <Ionicons name="notifications" size={20} color="white" />
            <Text style={styles.actionButtonText}>Test Push Notification</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].gray[200] }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors[colorScheme ?? 'light'].gray[700]} />
            <Text style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].gray[700] }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bank Details Modal */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBankModal(false)}>
              <Text style={[styles.modalCancel, { color: Colors[colorScheme ?? 'light'].primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Bank Details
            </Text>
            <TouchableOpacity onPress={handleSaveBankDetails}>
              <Text style={[styles.modalSave, { color: Colors[colorScheme ?? 'light'].primary }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                Bank Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Enter bank name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={bankDetails.bankName}
                onChangeText={(value) => setBankDetails(prev => ({ ...prev, bankName: value }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                Account Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Enter account number"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={bankDetails.accountNumber}
                onChangeText={(value) => setBankDetails(prev => ({ ...prev, accountNumber: value }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                Account Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Enter account name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={bankDetails.accountName}
                onChangeText={(value) => setBankDetails(prev => ({ ...prev, accountName: value }))}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: Colors[colorScheme ?? 'light'].gray[200] }]}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={[styles.modalCancelText, { color: Colors[colorScheme ?? 'light'].primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={[styles.modalSaveText, { color: Colors[colorScheme ?? 'light'].primary }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                Full Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={editForm.name}
                onChangeText={(value) => updateEditForm('name', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                Email *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={editForm.email}
                onChangeText={(value) => updateEditForm('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                Department
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].gray[100],
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].gray[600],
                  }
                ]}
                value={user.department?.name || 'Not specified'}
                editable={false}
                placeholder="Department is set from your profile"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLogo: {
    width: 50,
    height: 35,
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: 20,
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
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  progressCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressSubtitle: {
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  payoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  payoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  verificationText: {
    fontSize: 14,
    marginBottom: 12,
  },
  uploadProgress: {
    marginTop: 8,
  },
  uploadProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  uploadProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  uploadProgressText: {
    fontSize: 12,
    textAlign: 'center',
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
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 16,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadsCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadsList: {
    gap: 8,
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
    marginBottom: 4,
  },
  uploadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadStatus: {
    fontSize: 12,
    fontWeight: '600',
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
  emptyUploads: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyUploadsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyUploadsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
