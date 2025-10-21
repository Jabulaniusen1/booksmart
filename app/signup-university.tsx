import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';
import { auth, db } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignupUniversityScreen() {
  const { authUserId, name, email } = useLocalSearchParams();
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const colorScheme = useColorScheme();
  const { setUser } = useAppStore();

  useEffect(() => {
    loadSchools();
    verifyUser();
  }, []);

  const verifyUser = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user || !user.email_confirmed_at) {
        Alert.alert('Error', 'Please verify your email first');
        router.replace('/login');
        return;
      }
      setIsVerifying(false);
    } catch (error) {
      Alert.alert('Error', 'Please verify your email first');
      router.replace('/login');
    }
  };

  const loadSchools = async () => {
    try {
      const { data, error } = await db.getSchools();
      if (error) {
        Alert.alert('Error', 'Failed to load schools');
        return;
      }
      setSchools(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load schools');
    }
  };

  const handleSignup = async () => {
    if (!selectedUniversity || !department) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('🏫 Starting profile completion process');
    console.log('📝 Form data:', {
      selectedUniversity,
      department,
      authUserId,
      name,
      email
    });

    setIsLoading(true);

    try {
      // Get current user
      console.log('👤 Getting current user...');
      const currentUser = await auth.getCurrentUser();
      
      if (!currentUser) {
        Alert.alert('Authentication Error', 'Please log in to complete your profile.');
        router.replace('/login');
        return;
      }

      // Get user's email from auth
      const userEmail = currentUser.email;
      if (!userEmail) {
        Alert.alert('Error', 'Unable to get your email address. Please try again.');
        return;
      }

      // Get user's full name from metadata or profile
      console.log('User metadata:', currentUser.user_metadata);
      let fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "";
      console.log('Extracted full name:', fullName);
      
      // If no full name found, use email prefix as fallback
      if (!fullName) {
        fullName = userEmail.split('@')[0] || 'User';
        console.log('Using email prefix as fallback name:', fullName);
      }

      // Try to create profile using RPC function
      console.log('Attempting to create profile with data:', {
        user_id: currentUser.id,
        user_email: userEmail,
        user_full_name: fullName,
        user_school_id: selectedUniversity,
        user_department: department
      });
      
      const { data: profileResult, error: profileError } = await db.createUserProfile(
        currentUser.id,
        userEmail,
        fullName,
        selectedUniversity,
        department
      );

      console.log('Profile creation response:', { profileResult, profileError });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        Alert.alert('Profile Creation Failed', `Failed to create your profile: ${profileError.message}`);
        return;
      }

      if (!profileResult?.success) {
        console.error('Profile creation failed:', profileResult);
        Alert.alert('Profile Creation Failed', `Failed to create your profile: ${profileResult?.message || 'Unknown error'}`);
        return;
      }

      Alert.alert('Profile Complete!', 'Your profile has been successfully saved. Welcome to BookSmart!');
      
      // Get the updated user profile and set it in store
      const { data: userProfile, error: profileFetchError } = await db.getUserById(currentUser.id);
      if (userProfile && !profileFetchError) {
        setUser(userProfile);
      }
      
      // Redirect to main app after showing success message
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } catch (err: any) {
      console.error('Error completing profile:', err);
      Alert.alert('Profile Creation Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSchool = schools.find(school => school.id === selectedUniversity);

  if (isVerifying) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Verifying your email...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            University & Department
          </Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Tell us about your academic background
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              University *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.universityOptions}>
              {schools.map((school) => (
                <TouchableOpacity
                  key={school.id}
                  style={[
                    styles.universityOption,
                    { 
                      backgroundColor: selectedUniversity === school.id 
                        ? Colors[colorScheme ?? 'light'].primary 
                        : Colors[colorScheme ?? 'light'].gray[100],
                      borderColor: selectedUniversity === school.id 
                        ? Colors[colorScheme ?? 'light'].primary 
                        : Colors[colorScheme ?? 'light'].gray[300]
                    }
                  ]}
                  onPress={() => setSelectedUniversity(school.id)}
                >
                  <Text style={[
                    styles.universityOptionText,
                    { 
                      color: selectedUniversity === school.id 
                        ? 'white' 
                        : Colors[colorScheme ?? 'light'].text 
                    }
                  ]}>
                    {school.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedSchool && (
              <View style={[styles.selectedInfo, { backgroundColor: Colors[colorScheme ?? 'light'].primary + '10' }]}>
                <Text style={[styles.selectedInfoText, { color: Colors[colorScheme ?? 'light'].primary }]}>
                  ✓ {selectedSchool.name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Department *
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
              placeholder="Enter your department (e.g., Computer Science)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
              value={department}
              onChangeText={setDepartment}
            />
          </View>


          <TouchableOpacity
            style={[
              styles.signupButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].primary },
              isLoading && styles.disabledButton
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? 'Creating Profile...' : 'Complete Profile'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              ← Back to Basic Info
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  universityOptions: {
    flexDirection: 'row',
  },
  universityOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  universityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  signupButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
