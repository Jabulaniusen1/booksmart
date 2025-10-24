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
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const { setUser } = useAppStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('🔐 Starting login process for:', email);
    setIsLoading(true);
    
    try {
      console.log('📡 Attempting to sign in...');
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        console.error('❌ Sign in error:', error);
        Alert.alert('Error', error.message);
        setIsLoading(false);
        return;
      }

      console.log('✅ Sign in successful:', data.user?.id);
      
      if (data.user) {
        console.log('👤 User data:', {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          user_metadata: data.user.user_metadata
        });

        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          console.log('⚠️ Email not verified, redirecting to verification');
          Alert.alert(
            'Email Not Verified',
            'Please check your email and click the verification link to continue.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/verify-email')
              }
            ]
          );
          setIsLoading(false);
          return;
        }

        console.log('📡 Fetching user profile from database...');
        // Get user profile from database
        const { data: userProfile, error: profileError } = await db.getUserById(data.user.id);
        
        console.log('📊 Profile fetch result:', {
          data: userProfile,
          error: profileError
        });
        
        if (profileError) {
          console.error('❌ Profile fetch error:', profileError);
          console.log('🔍 Error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          });
          
          // If user doesn't exist in database, they need to complete profile
          if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows found')) {
            console.log('🆕 User not found in database, redirecting to profile completion');
            router.replace({
              pathname: '/signup-university',
              params: { 
                authUserId: data.user.id,
                name: data.user.user_metadata?.full_name || '',
                email: data.user.email 
              }
            });
            setIsLoading(false);
            return;
          }
          Alert.alert('Error', `Failed to load user profile: ${profileError.message}`);
          setIsLoading(false);
          return;
        }

        console.log('✅ User profile loaded successfully:', userProfile);
        setUser(userProfile);
        
        // Check if profile is complete
        console.log('🔍 Checking profile completeness:', {
          school_id: userProfile.school_id,
          department_id: userProfile.department_id,
          hasSchool: !!userProfile.school_id,
          hasDepartment: !!userProfile.department_id
        });

        if (!userProfile.school_id || !userProfile.department_id) {
          console.log('⚠️ Profile incomplete, redirecting to completion');
          // Profile incomplete, redirect to completion
          router.replace({
            pathname: '/signup-university',
            params: { 
              authUserId: data.user.id,
              name: userProfile.full_name,
              email: userProfile.email 
            }
          });
          setIsLoading(false);
          return;
        }

        console.log('🎉 Login successful, redirecting to main app');
        router.replace('/(tabs)');
        Alert.alert('Success', 'Login successful!');
      }
    } catch (error) {
      console.error('💥 Unexpected error during login:', error);
      Alert.alert('Error', `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    setIsLoading(false);
  };


  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/book smart logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            BookSmart
          </Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Welcome back! Sign in to continue
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Email
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
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Password
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].gray[300],
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                placeholder="Enter your password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors[colorScheme ?? 'light'].gray[500]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].primary },
              isLoading && styles.disabledButton
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push('/signup-basic')}
          >
            <Text style={[styles.signupLinkText, { color: Colors[colorScheme ?? 'light'].primary }]}>
              Don't have an account? Sign Up
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
  logo: {
    width: 120,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  form: {
    width: '100%',
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
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  signupLinkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
