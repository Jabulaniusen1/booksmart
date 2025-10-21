import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import PDFViewerScreen from '@/screens/PDFViewerScreen';
import { Material } from '@/lib/supabase';

export default function PDFViewerPage() {
  const { material } = useLocalSearchParams();
  
  const parsedMaterial: Material = material ? JSON.parse(material as string) : null;

  if (!parsedMaterial) {
    router.back();
    return null;
  }

  const handleClose = () => {
    router.back();
  };

  return (
    <PDFViewerScreen 
      material={parsedMaterial} 
      onClose={handleClose}
    />
  );
}
