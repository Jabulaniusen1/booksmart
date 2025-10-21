import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';
import { auth, db } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
    department: '',
    level: '',
  });
  const colorScheme = useColorScheme();
  const { user, setUser } = useAppStore();

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
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      level: user?.level || '',
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
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
          <View style={styles.profileInfo}>
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="create-outline" size={20} color="white" />
          </TouchableOpacity>
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
            <Ionicons name="thumbs-up" size={24} color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'light'].text }]}>
              {user.recommendations}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Recommendations
            </Text>
          </View>
        </View>

        {/* Points Progress */}
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
              {user.department || 'Not specified'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="layers" size={20} color={Colors[colorScheme ?? 'light'].gray[500]} />
            <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Level
            </Text>
            <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {user.level || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={handleBankDetails}
          >
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.actionButtonText}>Bank Details</Text>
          </TouchableOpacity>

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
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Enter your department"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={editForm.department}
                onChangeText={(value) => updateEditForm('department', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                Level
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
                placeholder="Enter your level (e.g., 300 Level)"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={editForm.level}
                onChangeText={(value) => updateEditForm('level', value)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
});
