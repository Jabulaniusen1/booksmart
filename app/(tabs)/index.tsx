import MaterialCard from '@/components/MaterialCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/lib/store';
import { Material, db, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const colorScheme = useColorScheme();
  const { materials, setMaterials, user } = useAppStore();

  useEffect(() => {
    loadMaterials();
    loadSchools();
    loadDepartments();
  }, []);

  const loadMaterials = async () => {
    try {
      const { data, error } = await db.getMaterials();
      if (error) {
        Alert.alert('Error', 'Failed to load materials');
        return;
      }
      setMaterials(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load materials');
    }
  };

  const loadSchools = async () => {
    try {
      const { data, error } = await db.getSchools();
      if (error) {
        Alert.alert('Error', 'Failed to load schools');
        return;
      }
      setSchools(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load schools');
    }
  };

  const loadDepartments = async () => {
    try {
      // Load all departments from all schools
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) {
        Alert.alert('Error', 'Failed to load departments');
        return;
      }
      setDepartments(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load departments');
    }
  };

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchool = !selectedSchool || material.school_id === selectedSchool;
    const matchesDepartment = !selectedDepartment || material.department_id === selectedDepartment;
    
    return matchesSearch && matchesSchool && matchesDepartment;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  };

  const handleBookmark = (materialId: string) => {
    Alert.alert('Bookmarked', 'Material added to your bookmarks!');
  };


  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setSelectedSchool('');
    setSelectedDepartment('');
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedSchool) count++;
    if (selectedDepartment) count++;
    return count;
  };

  const renderMaterial = ({ item }: { item: Material }) => (
    <MaterialCard
      material={item}
      onBookmark={handleBookmark}
      currentUserId={user?.id}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}>
        <View style={styles.headerContent}>
          <Image 
            source={require('@/assets/images/book smart logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>BookSmart</Text>
            <Text style={styles.headerSubtitle}>
              {user ? `Welcome back, ${user.full_name}!` : 'Discover study materials'}
            </Text>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <Ionicons name="search" size={20} color={Colors[colorScheme ?? 'light'].gray[400]} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="Search materials..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { 
              backgroundColor: getActiveFiltersCount() > 0 
                ? Colors[colorScheme ?? 'light'].secondary 
                : Colors[colorScheme ?? 'light'].primary 
            }
          ]}
          onPress={handleFilterPress}
        >
          <Ionicons name="filter" size={20} color="white" />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Materials List */}
      <FlatList
        data={filteredMaterials}
        renderItem={renderMaterial}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color={Colors[colorScheme ?? 'light'].gray[400]} />
            <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].gray[500] }]}>
              No materials found
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: Colors[colorScheme ?? 'light'].gray[200] }]}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={[styles.modalCancelText, { color: Colors[colorScheme ?? 'light'].primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Filters
            </Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={[styles.modalClearText, { color: Colors[colorScheme ?? 'light'].gray[600] }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* School Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                University
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { 
                      backgroundColor: !selectedSchool 
                        ? Colors[colorScheme ?? 'light'].primary 
                        : Colors[colorScheme ?? 'light'].gray[100],
                      borderColor: Colors[colorScheme ?? 'light'].gray[300]
                    }
                  ]}
                  onPress={() => setSelectedSchool('')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { 
                      color: !selectedSchool 
                        ? 'white' 
                        : Colors[colorScheme ?? 'light'].text 
                    }
                  ]}>
                    All Universities
                  </Text>
                </TouchableOpacity>
                {schools.map((school) => (
                  <TouchableOpacity
                    key={school.id}
                    style={[
                      styles.filterOption,
                      { 
                        backgroundColor: selectedSchool === school.id 
                          ? Colors[colorScheme ?? 'light'].primary 
                          : Colors[colorScheme ?? 'light'].gray[100],
                        borderColor: Colors[colorScheme ?? 'light'].gray[300]
                      }
                    ]}
                    onPress={() => setSelectedSchool(school.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { 
                        color: selectedSchool === school.id 
                          ? 'white' 
                          : Colors[colorScheme ?? 'light'].text 
                      }
                    ]}>
                      {school.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Department Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Department
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    { 
                      backgroundColor: !selectedDepartment 
                        ? Colors[colorScheme ?? 'light'].primary 
                        : Colors[colorScheme ?? 'light'].gray[100],
                      borderColor: Colors[colorScheme ?? 'light'].gray[300]
                    }
                  ]}
                  onPress={() => setSelectedDepartment('')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { 
                      color: !selectedDepartment 
                        ? 'white' 
                        : Colors[colorScheme ?? 'light'].text 
                    }
                  ]}>
                    All Departments
                  </Text>
                </TouchableOpacity>
                {departments.map((department) => (
                  <TouchableOpacity
                    key={department.id}
                    style={[
                      styles.filterOption,
                      { 
                        backgroundColor: selectedDepartment === department.id 
                          ? Colors[colorScheme ?? 'light'].primary 
                          : Colors[colorScheme ?? 'light'].gray[100],
                        borderColor: Colors[colorScheme ?? 'light'].gray[300]
                      }
                    ]}
                    onPress={() => setSelectedDepartment(department.id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { 
                        color: selectedDepartment === department.id 
                          ? 'white' 
                          : Colors[colorScheme ?? 'light'].text 
                      }
                    ]}>
                      {department.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: Colors[colorScheme ?? 'light'].gray[200] }]}>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>
                Apply Filters ({filteredMaterials.length} results)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClearText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});