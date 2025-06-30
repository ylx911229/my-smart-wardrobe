import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Searchbar,
  Menu,
  Button,
  Chip
} from 'react-native-paper';
import { FlatGrid } from 'react-native-super-grid';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../styles/theme';
import { useDatabase } from '../services/DatabaseContext';
import ClothingCard from '../components/ClothingCard';
import EmptyState from '../components/EmptyState';

const { width } = Dimensions.get('window');

const WardrobeScreen = ({ navigation }) => {
  const { getClothes, getCategories, isLoading: dbLoading } = useDatabase();
  
  const [clothes, setClothes] = useState([]);
  const [filteredClothes, setFilteredClothes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState('activity_score DESC');
  const [refreshing, setRefreshing] = useState(false);

  const sortOptions = [
    { label: '活跃度 (高到低)', value: 'activity_score DESC' },
    { label: '活跃度 (低到高)', value: 'activity_score ASC' },
    { label: '购买时间 (最新)', value: 'purchase_date DESC' },
    { label: '购买时间 (最旧)', value: 'purchase_date ASC' },
    { label: '名称 (A-Z)', value: 'name ASC' },
    { label: '名称 (Z-A)', value: 'name DESC' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      if (dbLoading) {
        return; // 如果数据库还在加载中，直接返回
      }
      
      const [clothesData, categoriesData] = await Promise.all([
        getClothes(currentSort),
        getCategories()
      ]);
      
      setClothes(clothesData);
      setCategories(categoriesData);
      filterClothes(clothesData, searchQuery, selectedCategory);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('错误', '加载数据失败，请重试');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterClothes = (clothesData, query, category) => {
    let filtered = clothesData;

    // 按分类筛选
    if (category) {
      filtered = filtered.filter(item => item.category_id === category.id);
    }

    // 按搜索词筛选
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(lowercaseQuery) ||
        item.brand?.toLowerCase().includes(lowercaseQuery) ||
        item.color?.toLowerCase().includes(lowercaseQuery) ||
        item.category_name?.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredClothes(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterClothes(clothes, query, selectedCategory);
  };

  const handleCategoryFilter = (category) => {
    const newCategory = selectedCategory?.id === category.id ? null : category;
    setSelectedCategory(newCategory);
    filterClothes(clothes, searchQuery, newCategory);
  };

  const handleSort = async (sortValue) => {
    setCurrentSort(sortValue);
    setSortMenuVisible(false);
    
    try {
      const sortedClothes = await getClothes(sortValue);
      setClothes(sortedClothes);
      filterClothes(sortedClothes, searchQuery, selectedCategory);
    } catch (error) {
      console.error('Error sorting clothes:', error);
      Alert.alert('错误', '排序失败，请重试');
    }
  };

  const handleClothingPress = (item) => {
    navigation.navigate('ClothingDetail', { clothing: item });
  };

  const renderClothingItem = ({ item }) => (
    <ClothingCard
      item={item}
      onPress={() => handleClothingPress(item)}
      style={styles.clothingCard}
    />
  );

  if (dbLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Title>加载中...</Title>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="搜索衣物..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.primary}
        />
        
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSortMenuVisible(true)}
              icon="sort"
              style={styles.sortButton}
              contentStyle={styles.sortButtonContent}
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
              titleStyle={currentSort === option.value ? { color: theme.colors.primary } : {}}
            />
          ))}
        </Menu>
      </View>

      {/* 分类筛选 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <Chip
            key={category.id}
            selected={selectedCategory?.id === category.id}
            onPress={() => handleCategoryFilter(category)}
            style={[
              styles.categoryChip,
              selectedCategory?.id === category.id && styles.selectedCategoryChip
            ]}
            textStyle={selectedCategory?.id === category.id ? styles.selectedCategoryText : {}}
          >
            {category.name}
          </Chip>
        ))}
      </ScrollView>

      {/* 衣物网格 */}
      {filteredClothes.length > 0 ? (
        <FlatGrid
          itemDimension={width / 2 - theme.spacing.lg}
          data={filteredClothes}
          style={styles.grid}
          spacing={theme.spacing.sm}
          renderItem={renderClothingItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      ) : (
        <EmptyState
          icon="shirt-outline"
          title="还没有衣物"
          subtitle="点击右下角的 + 按钮添加第一件衣物吧"
        />
      )}

      {/* 添加按钮 */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddClothing')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  
  searchbar: {
    flex: 1,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  
  sortButton: {
    borderColor: theme.colors.primary,
  },
  
  sortButtonContent: {
    flexDirection: 'row-reverse',
  },
  
  categoryContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  categoryContent: {
    paddingRight: theme.spacing.md,
  },
  
  categoryChip: {
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  
  selectedCategoryChip: {
    backgroundColor: theme.colors.primary,
  },
  
  selectedCategoryText: {
    color: theme.colors.textLight,
  },
  
  grid: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  
  clothingCard: {
    marginBottom: theme.spacing.sm,
  },
  
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default WardrobeScreen; 