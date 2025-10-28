import { pushNotificationService } from '@/services/pushNotificationService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export const auth = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async resendConfirmation(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    return { data, error };
  },
};

// Database types based on the schema
export interface User {
  id: string;
  email: string;
  full_name: string;
  school_id: string;
  avatar_url?: string;
  points: number;
  is_admin: boolean;
  is_verified: boolean;
  upload_count: number;
  created_at: string;
  updated_at: string;
  department_id: string;
  school?: School;
  department?: Department;
  recommendation_count?: number;
}

export interface School {
  id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  school_id: string;
  created_at: string;
  school?: School;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  uploader_id: string;
  school_id: string;
  status: string;
  download_count: number;
  created_at: string;
  updated_at: string;
  department_id: string;
  uploader?: User;
  school?: School;
  department?: Department;
}

export interface Bookmark {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
  material?: Material;
}

export interface Recommendation {
  id: string;
  recommender_id: string;
  recommended_user_id: string;
  created_at: string;
  recommender?: User;
  recommended_user?: User;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read_at?: string;
  data?: any;
  created_at: string;
}

// Database functions
export const db = {
  // User functions
  async createUser(userData: Partial<User>) {
    console.log('📝 Creating user in database with data:', userData);
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    console.log('📊 User creation result:', { data, error });
    if (error) {
      console.error('❌ User creation error:', error);
    } else {
      console.log('✅ User created successfully');
    }
    
    return { data, error };
  },

  async getUserById(id: string) {
    console.log('🔍 Fetching user by ID:', id);
    
    // First try to get user with department join
    let { data, error } = await supabase
      .from('users')
      .select(`
        *,
        school:schools(*),
        department:departments!inner(*)
      `)
      .eq('id', id)
      .single();
    
    // If that fails, try without department join
    if (error && error.code === 'PGRST200') {
      console.log('🔄 Retrying without department join...');
      const result = await supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('id', id)
        .single();
      
      data = result.data;
      error = result.error;
      
      // If we have department_id, try to fetch department separately
      if (data && data.department_id) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('*')
          .eq('id', data.department_id)
          .single();
        
        if (deptData) {
          data.department = deptData;
        }
      }
    }
    
    console.log('📊 User fetch result:', { data, error });
    if (error) {
      console.error('❌ User fetch error:', error);
    } else {
      console.log('✅ User fetched successfully');
    }
    
    return { data, error };
  },

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // School functions
  async getSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name');
    return { data, error };
  },

  // Department functions
  async getDepartmentsBySchool(schoolId: string) {
    console.log('🔍 Fetching departments for school:', schoolId);
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');
    
    console.log('📊 Department fetch result:', { data, error });
    if (error) {
      console.error('❌ Department fetch error:', error);
    } else {
      console.log('✅ Departments fetched successfully');
    }
    
    return { data, error };
  },

  async createDepartment(name: string, schoolId: string) {
    console.log('🆕 Creating department:', { name, schoolId });
    
    try {
      // First, check if the department already exists
      const { data: existingDept, error: checkError } = await supabase
        .from('departments')
        .select('*')
        .eq('name', name)
        .eq('school_id', schoolId)
        .single();
      
      if (existingDept && !checkError) {
        console.log('✅ Department already exists:', existingDept);
        return { data: existingDept, error: null };
      }
      
      // If department doesn't exist, try to create it
      const { data, error } = await supabase
        .from('departments')
        .insert({ name, school_id: schoolId })
        .select()
        .single();
      
      console.log('📊 Department creation result:', { data, error });
      if (error) {
        console.error('❌ Department creation error:', error);
        console.log('🔍 RLS Policy Error - This might be due to Row Level Security policies');
        console.log('💡 Suggestion: Check if the user has permission to create departments or if RLS policies need to be updated');
      } else {
        console.log('✅ Department created successfully');
      }
      
      return { data, error };
    } catch (error) {
      console.error('💥 Unexpected error in createDepartment:', error);
      return { data: null, error: error };
    }
  },

  // Material functions
  async getMaterials(filters?: {
    schoolId?: string;
    departmentId?: string;
    search?: string;
  }) {
    console.log('🔍 Fetching materials with filters:', filters);
    
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user');
        return { data: [], error: null };
      }
      
      console.log('👤 Authenticated user:', authUser.id);
      
      // Fetch approved materials (like web version)
      const { data: approvedMaterials, error: approvedError } = await supabase
        .from('materials')
        .select(`
          *,
          uploader:users(*),
          school:schools(*)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (approvedError) {
        console.error('❌ Error fetching approved materials:', approvedError);
        return { data: [], error: approvedError };
      }

      // Fetch user's own materials (all statuses, like web version)
      const { data: userMaterials, error: userMaterialsError } = await supabase
        .from('materials')
        .select(`
          *,
          uploader:users(*),
          school:schools(*)
        `)
        .eq('uploader_id', authUser.id)
        .order('created_at', { ascending: false });

      if (userMaterialsError) {
        console.error('❌ Error fetching user materials:', userMaterialsError);
        return { data: [], error: userMaterialsError };
      }

      // Combine approved materials and user's own materials, removing duplicates (like web version)
      const allMaterials = [...(approvedMaterials || [])];
      const userMaterialsList = userMaterials || [];
      
      // Add user's materials that aren't already in the approved list
      userMaterialsList.forEach((userMaterial: any) => {
        if (!allMaterials.find(m => m.id === userMaterial.id)) {
          allMaterials.push(userMaterial);
        }
      });

      console.log('📊 Materials fetch result:', { 
        approvedCount: approvedMaterials?.length || 0,
        userMaterialsCount: userMaterialsList.length,
        totalCount: allMaterials.length,
        materials: allMaterials.map(m => ({ 
          id: m.id, 
          title: m.title, 
          status: m.status,
          uploader: m.uploader?.full_name 
        }))
      });
      
      return { data: allMaterials, error: null };
      
    } catch (error) {
      console.error('💥 Unexpected error fetching materials:', error);
      return { data: [], error: { message: 'Failed to fetch materials' } };
    }
  },

  async createMaterial(materialData: Partial<Material>) {
    const { data, error } = await supabase
      .from('materials')
      .insert(materialData)
      .select(`
        *,
        uploader:users(*),
        school:schools(*)
      `)
      .single();
    
    // If material was created successfully, check and update verification
    if (data && !error) {
      await this.checkAndUpdateVerification(data.uploader_id);
    }
    
    return { data, error };
  },

  async uploadMaterialWithFile(materialData: {
    title: string;
    description: string;
    fileUri: string;
    fileName: string;
    fileType: string;
    school_id: string;
    department: string;
  }) {
    console.log('📤 Starting material upload process...');
    
    // Check current user authentication
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return { data: null, error: { message: 'User not authenticated' } };
    }
    
    console.log('🔐 Authenticated user:', authUser.id);
    
    try {
      // Step 1: Create material record directly (skip file upload for now)
      console.log('📝 Creating material record directly...');
      
      const { data, error } = await supabase
        .from('materials')
        .insert({
          title: materialData.title,
          description: materialData.description,
          file_url: materialData.fileUri, // Use local file URI for now
          file_type: materialData.fileType,
          uploader_id: authUser.id,
          school_id: materialData.school_id,
          department_id: materialData.department,
          status: 'pending', // Like web version
          download_count: 0
        })
        .select(`
          *,
          uploader:users(*),
          school:schools(*)
        `)
        .single();
      
      if (error) {
        console.error('❌ Material creation failed:', error);
        console.error('🔍 Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { data: null, error };
      }
      
      console.log('✅ Material created successfully:', data);
      return { data, error: null };
      
    } catch (error) {
      console.error('💥 Unexpected error during upload:', error);
      console.error('🔍 Error type:', typeof error);
      console.error('🔍 Error message:', error instanceof Error ? error.message : 'Unknown error');
      return { data: null, error: { message: 'Upload failed' } };
    }
  },

  async getMaterialById(id: string) {
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        uploader:users(*),
        school:schools(*)
      `)
      .eq('id', id)
      .single();
    return { data, error };
  },

  async incrementDownloadCount(id: string) {
    // First get the material to get uploader_id and title
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('download_count, uploader_id, title')
      .eq('id', id)
      .single();
    
    if (fetchError) return { data: null, error: fetchError };
    
    // Then update with incremented count
    const { data, error } = await supabase
      .from('materials')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', id);
    
    // Create notification for download
    if (!error && material.uploader_id) {
      await this.createNotification(
        material.uploader_id,
        'download',
        'Material Downloaded!',
        `Your material "${material.title}" has been downloaded by someone!`,
        { materialId: id, materialTitle: material.title }
      );
    }
    
    return { data, error };
  },

  // Bookmark functions
  async getBookmarks(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        material:materials(
          *,
          uploader:users(*),
          school:schools(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async addBookmark(userId: string, materialId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, material_id: materialId })
      .select()
      .single();
    return { data, error };
  },

  async removeBookmark(userId: string, materialId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('material_id', materialId);
    return { data, error };
  },

  async isBookmarked(userId: string, materialId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('material_id', materialId)
      .single();
    return { data: data !== null, error };
  },

  // Recommendation functions
  async addRecommendation(recommenderId: string, recommendedUserId: string) {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({ 
        recommender_id: recommenderId, 
        recommended_user_id: recommendedUserId 
      })
      .select()
      .single();
    
    // Create notification for the recommended user
    if (data && !error) {
      const { data: recommender } = await this.getUserById(recommenderId);
      if (recommender) {
        await this.createNotification(
          recommendedUserId,
          'recommendation',
          'New Recommendation!',
          `${recommender.full_name} recommended you!`,
          { recommenderId, recommenderName: recommender.full_name }
        );
      }
    }
    
    return { data, error };
  },

  async removeRecommendation(recommenderId: string, recommendedUserId: string) {
    const { data, error } = await supabase
      .from('recommendations')
      .delete()
      .eq('recommender_id', recommenderId)
      .eq('recommended_user_id', recommendedUserId);
    return { data, error };
  },

  async isRecommended(recommenderId: string, recommendedUserId: string) {
    const { data, error } = await supabase
      .from('recommendations')
      .select('id')
      .eq('recommender_id', recommenderId)
      .eq('recommended_user_id', recommendedUserId)
      .single();
    return { data: data !== null, error };
  },

  async getUserRecommendations(userId: string) {
    const { data, error } = await supabase
      .from('recommendations')
      .select(`
        *,
        recommender:users(*)
      `)
      .eq('recommended_user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getRecommendationCount(userId: string) {
    const { count, error } = await supabase
      .from('recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('recommended_user_id', userId);
    return { data: count || 0, error };
  },

  // Verification functions
  async checkAndUpdateVerification(userId: string) {
    // Get user's upload count
    const { count, error: countError } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })
      .eq('uploader_id', userId)
      .eq('status', 'approved');
    
    if (countError) return { data: null, error: countError };
    
    const uploadCount = count || 0;
    const shouldBeVerified = uploadCount >= 10;
    
    // Update user's verification status and upload count
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_verified: shouldBeVerified,
        upload_count: uploadCount
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  // Withdrawal request functions
  async createWithdrawalRequest(userId: string, bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        amount: 20,
        bank_name: bankDetails.bankName,
        account_number: bankDetails.accountNumber,
        account_name: bankDetails.accountName,
        status: 'pending'
      })
      .select()
      .single();
    return { data, error };
  },

  async getWithdrawalRequests(userId: string) {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async approveWithdrawalRequest(requestId: string) {
    // First get the request
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError) return { data: null, error: fetchError };
    
    // Update request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
      .select()
      .single();
    
    if (updateError) return { data: null, error: updateError };
    
    // Deduct points from user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', request.user_id)
      .single();
    
    if (userError) return { data: null, error: userError };
    
    const newPoints = Math.max(0, user.points - request.amount);
    
    const { data: updatedUser, error: pointsError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', request.user_id)
      .select()
      .single();
    
    // Create notification for withdrawal approval
    if (updatedUser && !pointsError) {
      await this.createNotification(
        request.user_id,
        'withdrawal_approved',
        'Withdrawal Approved!',
        `Your withdrawal request of ${request.amount} points has been approved and processed.`,
        { requestId, amount: request.amount }
      );
    }
    
    return { data: { request: updatedRequest, user: updatedUser }, error: pointsError };
  },

  async rejectWithdrawalRequest(requestId: string) {
    // First get the request to get user_id
    const { data: request, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (fetchError) return { data: null, error: fetchError };
    
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .select()
      .single();
    
    // Create notification for withdrawal rejection
    if (data && !error) {
      await this.createNotification(
        request.user_id,
        'withdrawal_rejected',
        'Withdrawal Rejected',
        `Your withdrawal request of ${request.amount} points has been rejected. Please contact support for more information.`,
        { requestId, amount: request.amount }
      );
    }
    
    return { data, error };
  },

  // Notification functions
  async createNotification(userId: string, type: string, title: string, message: string, data?: any) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || null
      })
      .select()
      .single();
    
    // Send push notification if database notification was created successfully
    if (notification && !error) {
      try {
        await pushNotificationService.sendPushNotification(
          userId,
          title,
          message,
          { ...data, type, notificationId: notification.id }
        );
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError);
        // Don't fail the whole operation if push notification fails
      }
    }
    
    return { data: notification, error };
  },

  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  },

  async markAllNotificationsAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
      .select();
    return { data, error };
  },

  async getUnreadNotificationCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    return { data: count || 0, error };
  },

  // RPC functions
  async createUserProfile(userId: string, userEmail: string, userFullName: string, userSchoolId: string, userDepartment: string) {
    console.log('📝 Creating user profile via RPC with data:', {
      userId,
      userEmail,
      userFullName,
      userSchoolId,
      userDepartment
    });
    
    const { data, error } = await supabase
      .rpc('create_user_profile', {
        user_id: userId,
        user_email: userEmail,
        user_full_name: userFullName,
        user_school_id: userSchoolId,
        user_department: userDepartment
      });
    
    console.log('📊 RPC result:', { data, error });
    if (error) {
      console.error('❌ RPC error:', error);
    } else {
      console.log('✅ RPC executed successfully');
    }
    
    return { data, error };
  },
};
