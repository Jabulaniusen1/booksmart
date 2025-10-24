import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/lib/supabase';
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

export default function SignupBasicScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const colorScheme = useColorScheme();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Create auth user first
      const { data, error } = await auth.signUp(formData.email, formData.password, formData.name);
      
      if (error) {
        Alert.alert('Error', error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Navigate to email verification page
        router.replace({
          pathname: '/verify-email',
          params: {
            email: formData.email,
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
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
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Let's get you started with some basic information
          </Text>
        </View>

        <View style={styles.form}>
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
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
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
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Password *
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
                placeholder="Create a password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
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

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Confirm Password *
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
                placeholder="Confirm your password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors[colorScheme ?? 'light'].gray[500]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].primary },
              isLoading && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading ? 'Processing...' : 'Next'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.loginLinkText, { color: Colors[colorScheme ?? 'light'].primary }]}>
              Already have an account? Sign In
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
    textAlign: 'center',
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
  nextButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
