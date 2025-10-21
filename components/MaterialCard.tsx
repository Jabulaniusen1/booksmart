import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Material } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MaterialCardProps {
  material: Material;
  onBookmark: (materialId: string) => void;
  currentUserId?: string;
}

export default function MaterialCard({ material, onBookmark, currentUserId }: MaterialCardProps) {
  const colorScheme = useColorScheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    const isOwner = currentUserId && material.uploader_id === currentUserId;
    if (!isOwner) return null; // Only show status for own materials
    
    switch (material.status) {
      case 'pending':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
            <Ionicons name="time" size={12} color="#f59e0b" />
            <Text style={[styles.statusText, { color: '#f59e0b' }]}>Pending</Text>
          </View>
        );
      case 'approved':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#dcfce7', borderColor: '#16a34a' }]}>
            <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
            <Text style={[styles.statusText, { color: '#16a34a' }]}>Approved</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#fee2e2', borderColor: '#dc2626' }]}>
            <Ionicons name="close-circle" size={12} color="#dc2626" />
            <Text style={[styles.statusText, { color: '#dc2626' }]}>Rejected</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const handlePress = () => {
    // Navigate to PDF viewer
    router.push({
      pathname: '/pdf-viewer',
      params: { material: JSON.stringify(material) }
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: Colors[colorScheme ?? 'light'].cardBorder,
        }
      ]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: Colors[colorScheme ?? 'light'].text }
              ]}
              numberOfLines={2}
            >
              {material.title}
            </Text>
            {getStatusBadge()}
          </View>
          <Text
            style={[
              styles.description,
              { color: Colors[colorScheme ?? 'light'].gray[600] }
            ]}
            numberOfLines={2}
          >
            {material.description}
          </Text>
        </View>
        
        <View style={styles.pdfIcon}>
          <Ionicons name="document-text" size={24} color={Colors[colorScheme ?? 'light'].primary} />
        </View>
      </View>

      <View style={styles.metaInfo}>
        <View style={styles.schoolInfo}>
          <Ionicons name="school" size={16} color={Colors[colorScheme ?? 'light'].gray[500]} />
          <Text style={[styles.schoolText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
            {material.school?.name}
          </Text>
        </View>
        
        <View style={styles.departmentInfo}>
          <Ionicons name="library" size={16} color={Colors[colorScheme ?? 'light'].gray[500]} />
          <Text style={[styles.departmentText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
            {material.department?.name}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.uploaderInfo}>
          <Image
            source={{ uri: material.uploader?.avatar_url }}
            style={styles.avatar}
          />
          <View>
            <Text style={[styles.uploaderName, { color: Colors[colorScheme ?? 'light'].text }]}>
              {material.uploader?.full_name}
            </Text>
            <Text style={[styles.uploadDate, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
              {formatDate(material.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].secondary }]}
            onPress={() => onBookmark(material.id)}
          >
            <Ionicons name="bookmark-outline" size={18} color={Colors[colorScheme ?? 'light'].primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  pdfIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  schoolText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  departmentText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  uploaderName: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadDate: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
