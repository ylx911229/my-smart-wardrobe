import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Searchbar,
  Menu,
  Button,
  Chip,
  Text,
  IconButton
} from 'react-native-paper';
import { FlatGrid } from 'react-native-super-grid';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../styles/theme';
import { useDatabase } from '../services/DatabaseContext';
import EmptyState from '../components/EmptyState';
import OutfitCard from '../components/OutfitCard';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, Outfit, User } from '../types';

const { width } = Dimensions.get('window');

type OutfitScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Outfit'
>;

interface OutfitScreenProps {
  navigation: OutfitScreenNavigationProp;
}



const OutfitScreen = ({ navigation }: OutfitScreenProps) => {
  const { outfits: dbOutfits } = useDatabase();
  
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, favorite, recent
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dbOutfits])
  );

  const loadData = async () => {
    try {
      // 使用数据库中的outfits和模拟用户数据
      const usersData: User[] = [
        { id: 1, name: '我', photo_uri: '', created_at: new Date().toISOString() }
      ];
      
      setOutfits(dbOutfits);
      setUsers(usersData);
      filterOutfits(dbOutfits, searchQuery, selectedUser, filterType);
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

  const filterOutfits = (outfitsData: Outfit[], query: string, user: User | null, type: string) => {
    let filtered = outfitsData;

    // 按用户筛选
    if (user) {
      filtered = filtered.filter(item => item.user_id === user.id);
    }

    // 按类型筛选
    if (type === 'favorite') {
      filtered = filtered.filter(item => item.is_favorite);
    } else if (type === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(item => new Date(item.created_at || item.createdAt) >= oneWeekAgo);
    }

    // 按搜索词筛选
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(lowercaseQuery) ||
        item.occasion?.toLowerCase().includes(lowercaseQuery) ||
        item.notes?.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredOutfits(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterOutfits(outfits, query, selectedUser, filterType);
  };

  const handleUserFilter = (user: User) => {
    const newUser = selectedUser?.id === user.id ? null : user;
    setSelectedUser(newUser);
    filterOutfits(outfits, searchQuery, newUser, filterType);
  };

  const handleTypeFilter = (type: string) => {
    setFilterType(type);
    filterOutfits(outfits, searchQuery, selectedUser, type);
  };

  const handleOutfitPress = (outfit: Outfit) => {
    // TODO: 实现详情页导航
    Alert.alert('提示', `查看搭配: ${outfit.name}`);
  };

  const renderOutfitItem = ({ item }: { item: Outfit }) => (
    <OutfitCard
      item={item}
      onPress={() => handleOutfitPress(item)}
    />
  );



  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="搜索穿搭..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={theme.colors.primary}
        />
      </View>

      {/* 筛选选项 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <Chip
              selected={filterType === 'all'}
              onPress={() => handleTypeFilter('all')}
              style={[styles.filterChip, filterType === 'all' && styles.selectedChip]}
            >
              全部
            </Chip>
            <Chip
              selected={filterType === 'favorite'}
              onPress={() => handleTypeFilter('favorite')}
              style={[styles.filterChip, filterType === 'favorite' && styles.selectedChip]}
            >
              收藏
            </Chip>
            <Chip
              selected={filterType === 'recent'}
              onPress={() => handleTypeFilter('recent')}
              style={[styles.filterChip, filterType === 'recent' && styles.selectedChip]}
            >
              最近
            </Chip>
          </View>
        </ScrollView>
      </View>

      {/* 用户筛选 */}
      {users.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.userFilterContainer}
          contentContainerStyle={styles.userFilterContent}
        >
          {users.map((user) => {
            return (
              <Chip
                key={user.id}
                selected={selectedUser?.id === user.id}
                onPress={() => handleUserFilter(user)}
                style={[
                  styles.userChip,
                  selectedUser?.id === user.id && styles.selectedUserChip
                ]}
                textStyle={selectedUser?.id === user.id ? styles.selectedUserText : {}}
                              >
                  {(user.name && typeof user.name === 'string') ? user.name : '未知用户'}
                </Chip>
            );
          })}
        </ScrollView>
      )}

      {/* 穿搭网格 */}
      {filteredOutfits.length > 0 ? (
        <FlatGrid
          itemDimension={width / 2 - theme.spacing.lg}
          data={filteredOutfits}
          style={styles.grid}
          spacing={theme.spacing.sm}
          renderItem={renderOutfitItem}
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
          icon="body-outline"
          title="还没有穿搭记录"
          subtitle="快去推荐页面生成您的第一个穿搭吧"
        />
      )}

      {/* 手动搭配按钮 */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => Alert.alert('提示', '创建穿搭功能即将推出')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  searchbar: {
    backgroundColor: theme.colors.surface,
  },
  
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  filterRow: {
    flexDirection: 'row',
    paddingRight: theme.spacing.md,
  },
  
  filterChip: {
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  
  selectedChip: {
    backgroundColor: theme.colors.primary,
  },
  
  userFilterContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  userFilterContent: {
    paddingRight: theme.spacing.md,
  },
  
  userChip: {
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  
  selectedUserChip: {
    backgroundColor: theme.colors.secondary,
  },
  
  selectedUserText: {
    color: theme.colors.textLight,
  },
  
  grid: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },

  
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default OutfitScreen; 