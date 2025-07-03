import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
// 移除FlatGrid，使用FlatList替代
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';
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
  const { outfits: allOutfits, users, updateOutfit, deleteOutfit } = useDatabase();
  
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('全部'); // 改为统一的筛选状态
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 不自动选择默认用户，让用户手动选择
    // if (users.length > 0 && !selectedUser) {
    //   const defaultUser = users.find(user => user.isDefault) || users[0];
    //   setSelectedUser(defaultUser);
    // }
  }, [users, selectedUser]);

  useEffect(() => {
    filterOutfits();
  }, [allOutfits, searchQuery, selectedFilter, selectedUser]);

  const loadData = async () => {
    try {
      setOutfits(allOutfits);
      filterOutfits();
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

  const filterOutfits = () => {
    let filtered = allOutfits;

    // 按用户筛选 - selectedUser为null时显示所有用户的穿搭
    if (selectedUser) {
      filtered = filtered.filter(item => item.user_id === selectedUser.id);
    }

    // 按类型筛选
    if (selectedFilter === '收藏') {
      filtered = filtered.filter(item => item.is_favorite === true);
    } else if (selectedFilter === '最近7天') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(item => {
        const createdDate = new Date(item.created_at || item.createdAt);
        return createdDate >= oneWeekAgo;
      });
    }

    // 按搜索词筛选
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(lowercaseQuery) ||
        item.occasion?.toLowerCase().includes(lowercaseQuery) ||
        item.notes?.toLowerCase().includes(lowercaseQuery)
      );
    }

    console.log(`筛选结果: ${allOutfits.length} -> ${filtered.length} (用户: ${selectedUser?.name || '全部'}, 筛选: ${selectedFilter})`);
    setFilteredOutfits(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUserFilter = (user: User | null) => {
    if (user === null) {
      // 选择"全部"
      setSelectedUser(null);
    } else {
      // 切换选择特定用户
      const newUser = selectedUser?.id === user.id ? null : user;
      setSelectedUser(newUser);
    }
  };

  const handleTypeFilter = (type: string) => {
    setSelectedFilter(type);
  };

  const handleOutfitPress = (outfit: Outfit) => {
    // 导航到穿搭详情页面
    navigation.navigate('OutfitDetail' as any, { outfit });
  };

  const handleToggleFavorite = async (outfit: Outfit) => {
    try {
      await updateOutfit(outfit.id, {
        is_favorite: !outfit.is_favorite
      });
      console.log(`Toggled favorite for outfit ${outfit.name}: ${!outfit.is_favorite}`);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('错误', '更新收藏状态失败');
    }
  };

  const handleOutfitLongPress = (outfit: Outfit) => {
    Alert.alert(
      '删除穿搭',
      `确定要删除"${outfit.name}"吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive', 
          onPress: () => confirmDeleteOutfit(outfit) 
        }
      ]
    );
  };

  const confirmDeleteOutfit = async (outfit: Outfit) => {
    try {
      await deleteOutfit(outfit.id);
      Alert.alert('删除成功', `"${outfit.name}"已从穿搭记录中移除`);
    } catch (error) {
      console.error('Error deleting outfit:', error);
      Alert.alert('错误', '删除失败，请重试');
    }
  };

  // 移除renderOutfitItem函数，直接在FlatList中使用

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* 搜索栏 */}
      <View style={commonStyles.searchContainer}>
        <Searchbar
          placeholder="搜索穿搭..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={commonStyles.searchbar}
          iconColor={theme.colors.primary}
        />
      </View>

      {/* 筛选选项 */}
      <View style={commonStyles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={commonStyles.filterRow}>
            <Chip
              onPress={() => handleTypeFilter('全部')}
              style={[
                commonStyles.filterChip, 
                selectedFilter === '全部' && commonStyles.filterChipSelected
              ]}
              textStyle={selectedFilter === '全部' ? commonStyles.filterChipTextSelected : {}}
            >
              全部
            </Chip>
            <Chip
              onPress={() => handleTypeFilter('收藏')}
              style={[
                commonStyles.filterChip, 
                selectedFilter === '收藏' && commonStyles.filterChipSelected
              ]}
              textStyle={selectedFilter === '收藏' ? commonStyles.filterChipTextSelected : {}}
            >
              收藏
            </Chip>
            <Chip
              onPress={() => handleTypeFilter('最近7天')}
              style={[
                commonStyles.filterChip, 
                selectedFilter === '最近7天' && commonStyles.filterChipSelected
              ]}
              textStyle={selectedFilter === '最近7天' ? commonStyles.filterChipTextSelected : {}}
            >
              最近7天
            </Chip>
          </View>
        </ScrollView>
      </View>

      {/* 用户筛选 */}
      {users.length > 0 && (
        <View style={commonStyles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={commonStyles.filterRow}
          >
            <Chip
              onPress={() => handleUserFilter(null)}
              style={[
                commonStyles.filterChip,
                !selectedUser && commonStyles.filterChipSelected
              ]}
              textStyle={!selectedUser ? commonStyles.filterChipTextSelected : {}}
            >
              全部
            </Chip>
            {users.map((user) => {
              return (
                <Chip
                  key={user.id}
                  onPress={() => handleUserFilter(user)}
                  style={[
                    commonStyles.filterChip,
                    selectedUser?.id === user.id && commonStyles.filterChipSelected
                  ]}
                  textStyle={selectedUser?.id === user.id ? commonStyles.filterChipTextSelected : {}}
                >
                  {(user.name && typeof user.name === 'string') ? user.name : '未知用户'}
                </Chip>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 穿搭网格 */}
      {filteredOutfits.length > 0 ? (
        <FlatList
          data={filteredOutfits}
          renderItem={({ item }: { item: Outfit }) => (
            <OutfitCard
              item={item}
              onPress={() => handleOutfitPress(item)}
              onLongPress={handleOutfitLongPress}
              onToggleFavorite={handleToggleFavorite}
              style={styles.outfitCardStyle}
              users={users}
            />
          )}
          keyExtractor={(item: Outfit) => item.id}
          numColumns={2}
          contentContainerStyle={commonStyles.gridContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      ) : (
        <View style={commonStyles.emptyState}>
          <EmptyState
            icon="body-outline"
            title="还没有穿搭记录"
            subtitle="快去推荐页面生成您的第一个穿搭吧"
          />
        </View>
      )}

      {/* 手动搭配按钮 */}
      <FAB
        style={commonStyles.fab}
        icon="plus"
        onPress={() => Alert.alert('提示', '创建穿搭功能即将推出')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 穿搭卡片样式，确保网格布局
  outfitCardStyle: {
    width: '48%', // 固定宽度为两列布局
    marginHorizontal: '1%',
    marginBottom: theme.spacing.md,
  },
});

export default OutfitScreen; 