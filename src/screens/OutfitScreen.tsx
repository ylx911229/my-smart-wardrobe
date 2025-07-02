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
import { FlatGrid } from 'react-native-super-grid';
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
  const { outfits: allOutfits, users } = useDatabase();
  
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('全部');
  const [selectedSeason, setSelectedSeason] = useState<string>('全部');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 设置默认用户
    if (users.length > 0 && !selectedUser) {
      const defaultUser = users.find(user => user.isDefault) || users[0];
      setSelectedUser(defaultUser);
    }
  }, [users, selectedUser]);

  useEffect(() => {
    filterOutfits();
  }, [allOutfits, searchQuery, selectedOccasion, selectedSeason, selectedUser]);

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

         // 按用户筛选
     if (selectedUser) {
       // 暂时跳过用户筛选，因为outfit表还没有user_id字段
       // filtered = filtered.filter(item => item.user_id === selectedUser.id);
     }

    // 按类型筛选
    if (selectedOccasion !== '全部') {
      filtered = filtered.filter(item => item.occasion === selectedOccasion);
    }

    if (selectedSeason !== '全部') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(item => new Date(item.created_at || item.createdAt) >= oneWeekAgo);
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

    setFilteredOutfits(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterOutfits();
  };

  const handleUserFilter = (user: User) => {
    const newUser = selectedUser?.id === user.id ? null : user;
    setSelectedUser(newUser);
    filterOutfits();
  };

  const handleTypeFilter = (type: string) => {
    setSelectedOccasion(type);
    filterOutfits();
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
              selected={selectedOccasion === '全部'}
              onPress={() => handleTypeFilter('全部')}
              style={[
                commonStyles.filterChip, 
                selectedOccasion === '全部' && commonStyles.filterChipSelected
              ]}
              textStyle={selectedOccasion === '全部' ? commonStyles.filterChipTextSelected : {}}
            >
              全部
            </Chip>
            <Chip
              selected={selectedOccasion === '收藏'}
              onPress={() => handleTypeFilter('收藏')}
              style={[
                commonStyles.filterChip, 
                selectedOccasion === '收藏' && commonStyles.filterChipSelected
              ]}
              textStyle={selectedOccasion === '收藏' ? commonStyles.filterChipTextSelected : {}}
            >
              收藏
            </Chip>
            <Chip
              selected={selectedOccasion === '最近'}
              onPress={() => handleTypeFilter('最近')}
              style={[
                commonStyles.filterChip, 
                selectedOccasion === '最近' && commonStyles.filterChipSelected
              ]}
              textStyle={selectedOccasion === '最近' ? commonStyles.filterChipTextSelected : {}}
            >
              最近
            </Chip>
          </View>
        </ScrollView>
      </View>

      {/* 用户筛选 */}
      {users.length > 1 && (
        <View style={commonStyles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={commonStyles.filterRow}
          >
            {users.map((user) => {
              return (
                <Chip
                  key={user.id}
                  selected={selectedUser?.id === user.id}
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
        <FlatGrid
          itemDimension={width / 2 - theme.spacing.lg}
          data={filteredOutfits}
          style={commonStyles.gridContainer}
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
  // 只保留不在commonStyles中的特殊样式（目前没有）
});

export default OutfitScreen; 