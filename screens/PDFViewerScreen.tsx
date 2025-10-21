import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';
import { Material, db } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PDFViewerScreenProps {
  material: Material;
  onClose: () => void;
}

export default function PDFViewerScreen({ material, onClose }: PDFViewerScreenProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const colorScheme = useColorScheme();
  const { user, addBookmark, removeBookmark } = useAppStore();

  const handleBookmark = async () => {
    if (!user) return;

    try {
      if (isBookmarked) {
        await db.removeBookmark(user.id, material.id);
        removeBookmark(material.id);
        setIsBookmarked(false);
        Alert.alert('Bookmark Removed', 'Material removed from your bookmarks!');
      } else {
        const { data: bookmark } = await db.addBookmark(user.id, material.id);
        if (bookmark) {
          addBookmark({
            id: bookmark.id,
            user_id: user.id,
            material_id: material.id,
            material: material,
          });
          setIsBookmarked(true);
          Alert.alert('Bookmarked', 'Material added to your bookmarks!');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };


  const handleOpenPDF = async () => {
    try {
      // Increment download count
      await db.incrementDownloadCount(material.id);
      
      const supported = await Linking.canOpenURL(material.file_url);
      if (supported) {
        await Linking.openURL(material.file_url);
      } else {
        Alert.alert('Error', 'Cannot open PDF. Please check your internet connection.');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {material.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {material.school?.name} • {material.department}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
            onPress={handleBookmark}
          >
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* PDF Info and Open Button */}
      <View style={styles.pdfContainer}>
        <View style={[styles.pdfInfoContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <View style={[styles.pdfIconContainer, { backgroundColor: Colors[colorScheme ?? 'light'].primary + '15' }]}>
            <Ionicons 
              name="document-text" 
              size={48} 
              color={Colors[colorScheme ?? 'light'].primary} 
            />
          </View>
          
          <Text style={[styles.pdfTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            {material.title}
          </Text>
          
          <Text style={[styles.pdfDescription, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
            {material.description}
          </Text>
          
          <View style={[styles.pdfMeta, { backgroundColor: Colors[colorScheme ?? 'light'].gray[50] }]}>
            <View style={styles.pdfMetaItem}>
              <Ionicons name="school-outline" size={16} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={[styles.pdfMetaText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
                {material.school?.name}
              </Text>
            </View>
            <View style={styles.pdfMetaItem}>
              <Ionicons name="library-outline" size={16} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={[styles.pdfMetaText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
                {material.department} • {material.level}
              </Text>
            </View>
            <View style={styles.pdfMetaItem}>
              <Ionicons name="person-outline" size={16} color={Colors[colorScheme ?? 'light'].primary} />
              <Text style={[styles.pdfMetaText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
                Uploaded by {material.uploader?.name}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.openPdfButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
            onPress={handleOpenPDF}
          >
            <Ionicons name="open-outline" size={20} color="white" />
            <Text style={styles.openPdfButtonText}>Open PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { 
              backgroundColor: isBookmarked 
                ? Colors[colorScheme ?? 'light'].gray[200] 
                : Colors[colorScheme ?? 'light'].secondary 
            }
          ]}
          onPress={handleBookmark}
        >
          <Ionicons 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={isBookmarked ? Colors[colorScheme ?? 'light'].gray[600] : Colors[colorScheme ?? 'light'].primary} 
          />
          <Text style={[
            styles.actionButtonText,
            { 
              color: isBookmarked 
                ? Colors[colorScheme ?? 'light'].gray[600] 
                : Colors[colorScheme ?? 'light'].primary 
            }
          ]}>
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 20,
  },
  pdfContainer: {
    flex: 1,
    padding: 20,
  },
  pdfInfoContainer: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pdfIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  pdfTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  pdfDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  pdfMeta: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  pdfMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  pdfMetaText: {
    fontSize: 14,
    flex: 1,
  },
  openPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  openPdfButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 150,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
