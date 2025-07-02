import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
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
  const { clothing } = useDatabase();
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
    const filtered = filterClothes(clothing, searchQuery, selectedCategory);
    setFilteredClothes(filtered);
  }, [clothing, searchQuery, selectedCategory]);

  const filterClothes = (clothesData: ClothingItem[], query: string, category: Category | null) => {
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

  const renderClothingItem = ({ item }: { item: ClothingItem }) => (
    <ClothingCard
      item={item}
      onPress={handleClothingPress}
      style={styles.clothingCard}
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
        {/* 分类筛选 */}
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item: category }) => (
            <Chip
              key={category.id}
              selected={selectedCategory?.id === category.id}
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
        />

        {/* 排序菜单 */}
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSortMenuVisible(true)}
              style={[commonStyles.secondaryButton, styles.sortButton]}
            >
              排序
            </Button>
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

      {/* 衣物列表 */}
      {filteredClothes.length > 0 ? (
        <FlatList
          data={filteredClothes}
          renderItem={renderClothingItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={commonStyles.gridContainer}
          showsVerticalScrollIndicator={false}
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
  // 排序按钮的特殊位置
  sortButton: {
    alignSelf: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  
  // 衣物卡片的特殊样式
  clothingCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
});

export default WardrobeScreen; 