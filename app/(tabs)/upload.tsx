import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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
  View
} from 'react-native';

export default function UploadScreen() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const colorScheme = useColorScheme();
  const { user, addMaterial } = useAppStore();

  const handleUpload = async () => {
    console.log('🚀 Starting upload process...');
    console.log('👤 User data:', user ? {
      id: user.id,
      school_id: user.school_id,
      school_name: user.school?.name
    } : 'No user');
    
    if (!user) {
      Alert.alert('Error', 'Please log in to upload materials');
      return;
    }

    if (!formData.title || !formData.department) {
      Alert.alert('Error', 'Please provide a title and department');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    console.log('✅ All validation checks passed');
    setIsUploading(true);

    try {
      // Create material using file upload (React Native compatible)
      const file = selectedFile.assets![0];
      
      const materialData = {
        title: formData.title,
        description: formData.description,
        fileUri: file.uri,
        fileName: file.name,
        fileType: file.mimeType || 'application/pdf',
        school_id: user.school_id,
        department: formData.department,
      };

      console.log('📤 Creating material with file upload:', materialData);

      const { data: newMaterial, error: materialError } = await db.uploadMaterialWithFile(materialData);
      
      if (materialError) {
        console.error('❌ Material creation error:', materialError);
        console.error('🔍 Full error object:', JSON.stringify(materialError, null, 2));
        console.error('📊 Material data that failed:', JSON.stringify(materialData, null, 2));
        Alert.alert('Upload Failed', `Failed to upload material: ${materialError.message}`);
        setIsUploading(false);
        return;
      }

      console.log('✅ Material created successfully:', newMaterial);
      addMaterial(newMaterial);
      setFormData({ title: '', description: '', department: '' });
      setSelectedFile(null);
      Alert.alert('Upload Successful!', 'Your material has been submitted for admin approval. You\'ll be notified once it\'s approved.');
    } catch (error) {
      console.error('💥 Unexpected error during upload:', error);
      console.error('🔍 Error type:', typeof error);
      console.error('🔍 Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('🔍 Full error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'An unexpected error occurred');
    }
    
    setIsUploading(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('image')) return '🖼️';
    return '📄';
  };

  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/png',
          'image/jpeg',
          'image/jpg'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Check file size (10MB limit)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          return;
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/png',
          'image/jpeg',
          'image/jpg'
        ];
        
        if (file.mimeType && !allowedTypes.includes(file.mimeType)) {
          Alert.alert('Invalid File Type', 'Please select a PDF, DOC, DOCX, PNG, or JPG file');
          return;
        }

        setSelectedFile(result);
        console.log('📄 File selected:', file.name, 'Type:', file.mimeType, 'Size:', file.size);
      }
    } catch (error) {
      console.error('❌ Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };


  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.loginPrompt}>
          <Ionicons name="log-in-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
          <Text style={[styles.loginText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Please log in to upload materials
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
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
          <View style={styles.headerContent}>
            <Image 
              source={require('@/assets/images/book smart logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Upload Material</Text>
              <Text style={styles.headerSubtitle}>Share your study materials with fellow students</Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Title *
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
              placeholder="Enter material title"
              placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              Description *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].gray[300],
                  color: Colors[colorScheme ?? 'light'].text,
                }
              ]}
              placeholder="Describe the material content..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
              University
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
              value={user?.school?.name || 'Not selected'}
              editable={false}
              placeholder="University will be auto-selected"
              placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
            />

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
              placeholder="e.g., Computer Science, Mathematics, Biology"
              placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
              value={formData.department}
              onChangeText={(value) => updateFormData('department', value)}
            />
          </View>


          <View style={styles.fileUploadContainer}>
            <TouchableOpacity 
              style={[
                styles.fileUploadButton, 
                { 
                  borderColor: selectedFile ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].primary,
                  backgroundColor: selectedFile ? Colors[colorScheme ?? 'light'].success + '10' : 'transparent'
                }
              ]}
              onPress={handleFileSelection}
            >
              <Ionicons 
                name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"} 
                size={24} 
                color={selectedFile ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].primary} 
              />
              <Text style={[
                styles.fileUploadText, 
                { color: selectedFile ? Colors[colorScheme ?? 'light'].success : Colors[colorScheme ?? 'light'].primary }
              ]}>
                {selectedFile ? 'File Selected' : 'Select File'}
              </Text>
            </TouchableOpacity>
            
            {selectedFile && selectedFile.assets && selectedFile.assets[0] && (
              <View style={styles.selectedFileInfo}>
                <Text style={[styles.selectedFileName, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {getFileIcon(selectedFile.assets[0].mimeType || '')} {selectedFile.assets[0].name}
                </Text>
                <Text style={[styles.selectedFileSize, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
                  {(selectedFile.assets[0].size! / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            )}
            
            <Text style={[styles.fileUploadHint, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
              PDF, DOC, DOCX, PNG, JPG files only, max 10MB
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].primary },
              isUploading && styles.disabledButton
            ]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : 'Upload Material'}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
  },
  form: {
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  fileUploadContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  fileUploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  fileUploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  fileUploadHint: {
    fontSize: 12,
    marginTop: 8,
  },
  selectedFileInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 12,
  },
  uploadButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
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
