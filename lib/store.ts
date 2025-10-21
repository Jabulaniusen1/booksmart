import { create } from 'zustand';
import { Bookmark, Material, User } from './supabase';

interface AppState {
  user: User | null;
  materials: Material[];
  bookmarks: Bookmark[];
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (materialId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  materials: [],
  bookmarks: [],
  isLoading: false,
  setUser: (user) => set({ user }),
  setMaterials: (materials) => set({ materials }),
  addMaterial: (material) => set((state) => ({ materials: [material, ...state.materials] })),
  setBookmarks: (bookmarks) => set({ bookmarks }),
  addBookmark: (bookmark) => set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
  removeBookmark: (materialId) => set((state) => ({ 
    bookmarks: state.bookmarks.filter(b => b.material_id !== materialId) 
  })),
  setLoading: (isLoading) => set({ isLoading }),
}));
