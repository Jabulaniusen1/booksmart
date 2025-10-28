import { create } from 'zustand';
import { Bookmark, Material, Recommendation, User } from './supabase';

interface AppState {
  user: User | null;
  materials: Material[];
  bookmarks: Bookmark[];
  recommendations: Recommendation[];
  unreadNotificationCount: number;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (materialId: string) => void;
  setRecommendations: (recommendations: Recommendation[]) => void;
  addRecommendation: (recommendation: Recommendation) => void;
  removeRecommendation: (recommendationId: string) => void;
  setUnreadNotificationCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  materials: [],
  bookmarks: [],
  recommendations: [],
  unreadNotificationCount: 0,
  isLoading: false,
  setUser: (user) => set({ user }),
  setMaterials: (materials) => set({ materials }),
  addMaterial: (material) => set((state) => ({ materials: [material, ...state.materials] })),
  setBookmarks: (bookmarks) => set({ bookmarks }),
  addBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
  removeBookmark: (materialId) => set((state) => ({ 
    bookmarks: state.bookmarks.filter(b => b.material_id !== materialId) 
  })),
  setRecommendations: (recommendations) => set({ recommendations }),
  addRecommendation: (recommendation) => set((state) => ({ recommendations: [...state.recommendations, recommendation] })),
  removeRecommendation: (recommendationId) => set((state) => ({ 
    recommendations: state.recommendations.filter(r => r.id !== recommendationId) 
  })),
  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
  setLoading: (isLoading) => set({ isLoading }),
}));
