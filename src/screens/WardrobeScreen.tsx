import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Chip, Menu, Button, FAB, Title } from 'react-native-paper';

import { useDatabase } from '../services/DatabaseContext';
import ClothingCard from '../components/ClothingCard';
import EmptyState from '../components/EmptyState';
import { theme } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { WardrobeStackParamList, ClothingItem } from '../types';

type WardrobeScreenNavigationProp = StackNavigationProp<
  WardrobeStackParamList,
  'WardrobeMain'
>;

interface WardrobeScreenProps {
  navigation: WardrobeScreenNavigationProp;
}

interface Category {
  id: number;
  name: string;
}

const WardrobeScreen = ({ navigation }: WardrobeScreenProps) => {
  const { clothing, deleteClothing } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filteredClothes, setFilteredClothes] = useState<ClothingItem[]>([]);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('activity_score DESC');

  const sortOptions = [
    { label: '最近添加', value: 'created_at DESC' },
    { label: '最早添加', value: 'created_at ASC' },
    { label: '活跃度 (高到低)', value: 'activity_score DESC' },
    { label: '活跃度 (低到高)', value: 'activity_score ASC' },
    { label: '名称 A-Z', value: 'name ASC' },
    { label: '名称 Z-A', value: 'name DESC' },
  ];

  const categories: Category[] = [
    { id: 1, name: '上衣' },
    { id: 2, name: '下装' },
    { id: 3, name: '外套' },
    { id: 4, name: '鞋子' },
    { id: 5, name: '配饰' },
  ];

  useEffect(() => {
    const filtered = filterAndSortClothes(clothing, searchQuery, selectedCategory, currentSort);
    setFilteredClothes(filtered);
  }, [clothing, searchQuery, selectedCategory, currentSort]);

  const filterAndSortClothes = (clothesData: ClothingItem[], query: string, category: Category | null, sortBy: string) => {
    let filtered = [...clothesData];

    // 按分类过滤
    if (category) {
      filtered = filtered.filter((item: ClothingItem) => item.category === category.name);
    }

    // 按搜索词过滤
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter((item: ClothingItem) =>
        item.name.toLowerCase().includes(lowercaseQuery) ||
        item.brand?.toLowerCase().includes(lowercaseQuery) ||
        item.color?.toLowerCase().includes(lowercaseQuery)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at DESC':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'created_at ASC':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'activity_score DESC':
          return (b.activity_score || 0) - (a.activity_score || 0);
        case 'activity_score ASC':
          return (a.activity_score || 0) - (b.activity_score || 0);
        case 'name ASC':
          return a.name.localeCompare(b.name);
        case 'name DESC':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category: Category) => {
    const newCategory = selectedCategory?.id === category.id ? null : category;
    setSelectedCategory(newCategory);
  };

  const handleSort = (sortValue: string) => {
    setCurrentSort(sortValue);
    setSortMenuVisible(false);
  };

  const handleClothingPress = (item: ClothingItem) => {
    navigation.navigate('ClothingDetail', { clothing: item });
  };

  const handleClothingLongPress = (item: ClothingItem) => {
    Alert.alert(
      '删除衣物',
      `确定要删除"${item.name}"吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive', 
          onPress: () => confirmDeleteClothing(item) 
        }
      ]
    );
  };

  const confirmDeleteClothing = async (item: ClothingItem) => {
    try {
      await deleteClothing(item.id);
      Alert.alert('删除成功', `"${item.name}"已从衣柜中移除`);
    } catch (error) {
      console.error('Error deleting clothing:', error);
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  const getCurrentSortLabel = () => {
    const currentOption = sortOptions.find(option => option.value === currentSort);
    return currentOption?.label || '排序';
  };

  const renderClothingItem = ({ item }: { item: ClothingItem }) => (
    <ClothingCard
      item={item}
      onPress={handleClothingPress}
      onLongPress={handleClothingLongPress}
      style={styles.gridItem}
    />
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* 搜索栏 */}
      <View style={commonStyles.searchContainer}>
        <Searchbar
          placeholder="搜索衣物..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={commonStyles.searchbar}
          iconColor={theme.colors.primary}
        />
      </View>

      {/* 筛选选项 */}
      <View style={commonStyles.filterContainer}>
        <View style={styles.filterRow}>
          {/* 分类筛选 */}
          <FlatList
            horizontal
            data={categories}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item: category }) => (
              <Chip
                key={category.id}
                onPress={() => handleCategoryFilter(category)}
                style={[
                  commonStyles.filterChip,
                  selectedCategory?.id === category.id && commonStyles.filterChipSelected
                ]}
                textStyle={selectedCategory?.id === category.id ? commonStyles.filterChipTextSelected : {}}
              >
                {category.name}
              </Chip>
            )}
            contentContainerStyle={commonStyles.filterRow}
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
          />

          {/* 排序菜单 */}
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Chip
                onPress={() => setSortMenuVisible(true)}
                style={styles.sortChip}
                textStyle={styles.sortChipText}
              >
                {getCurrentSortLabel()}
              </Chip>
            }
          >
            {sortOptions.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => handleSort(option.value)}
                title={option.label}
              />
            ))}
          </Menu>
        </View>
      </View>

      {/* 衣物列表 */}
      {filteredClothes.length > 0 ? (
        <FlatList
          data={filteredClothes}
          renderItem={renderClothingItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={commonStyles.gridContainer}
          showsVerticalScrollIndicator={false}
          key="two-columns"
        />
      ) : (
        <View style={commonStyles.emptyState}>
          <EmptyState
            icon="shirt-outline"
            title="暂无衣物"
            subtitle="点击右下角按钮添加你的第一件衣物"
          />
        </View>
      )}

      {/* 添加按钮 */}
      <FAB
        style={commonStyles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddClothing', {})}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 筛选行布局
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // 分类列表
  categoriesList: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  
  // 排序chip样式（模仿filterChip但保持outlined风格）
  sortChip: {
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  
  sortChipText: {
    color: theme.colors.primary,
  },
  
  // 强制网格项样式，确保固定两列
  gridItem: {
    width: '48%', // 明确指定宽度而不是使用flex
    marginHorizontal: '1%',
    marginBottom: theme.spacing.md,
  },
});

export default WardrobeScreen; 