import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams();
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Check if user is already verified
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    setIsChecking(true);
    try {
      const user = await auth.getCurrentUser();
      if (user?.email_confirmed_at) {
        setIsVerified(true);
        // Navigate to login page after verification
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
    setIsChecking(false);
  };

  const handleResendEmail = async () => {
    try {
      const { error } = await auth.resendConfirmation(email as string);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Verification email sent!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification email');
    }
  };

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  if (isVerified) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].primary + '20' }]}>
            <Ionicons name="checkmark-circle" size={64} color={Colors[colorScheme ?? 'light'].primary} />
          </View>
          
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Email Verified!
          </Text>
          
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
            Redirecting to complete your profile...
          </Text>
          
          <ActivityIndicator 
            size="large" 
            color={Colors[colorScheme ?? 'light'].primary} 
            style={styles.loader}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].primary + '20' }]}>
          <Ionicons name="mail" size={64} color={Colors[colorScheme ?? 'light'].primary} />
        </View>
        
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Check Your Email
        </Text>
        
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
          We've sent a verification link to:
        </Text>
        
        <Text style={[styles.email, { color: Colors[colorScheme ?? 'light'].primary }]}>
          {email}
        </Text>
        
        <Text style={[styles.instruction, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
          Please check your email and click the verification link to continue.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.resendButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={handleResendEmail}
            disabled={isChecking}
          >
            <Text style={styles.resendButtonText}>
              {isChecking ? 'Sending...' : 'Resend Email'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkButton, { borderColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={checkVerificationStatus}
            disabled={isChecking}
          >
            <Text style={[styles.checkButtonText, { color: Colors[colorScheme ?? 'light'].primary }]}>
              {isChecking ? 'Checking...' : 'I\'ve Verified'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  resendButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  checkButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
  },
  loader: {
    marginTop: 24,
  },
});
