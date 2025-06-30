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

const { width } = Dimensions.get('window');

const OutfitScreen = ({ navigation }) => {
  const { getOutfits, getUsers, isLoading: dbLoading } = useDatabase();
  
  const [outfits, setOutfits] = useState([]);
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, favorite, recent
  const [refreshing, setRefreshing] = useState(false);

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
      
      const [outfitsData, usersData] = await Promise.all([
        getOutfits(),
        getUsers()
      ]);
      
      setOutfits(outfitsData);
      setUsers(usersData);
      filterOutfits(outfitsData, searchQuery, selectedUser, filterType);
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

  const filterOutfits = (outfitsData, query, user, type) => {
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
      filtered = filtered.filter(item => new Date(item.created_at) >= oneWeekAgo);
    }

    // 按搜索词筛选
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(lowercaseQuery) ||
        item.occasion?.toLowerCase().includes(lowercaseQuery) ||
        item.notes?.toLowerCase().includes(lowercaseQuery) ||
        item.user_name?.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredOutfits(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterOutfits(outfits, query, selectedUser, filterType);
  };

  const handleUserFilter = (user) => {
    const newUser = selectedUser?.id === user.id ? null : user;
    setSelectedUser(newUser);
    filterOutfits(outfits, searchQuery, newUser, filterType);
  };

  const handleTypeFilter = (type) => {
    setFilterType(type);
    filterOutfits(outfits, searchQuery, selectedUser, type);
  };

  const handleOutfitPress = (outfit) => {
    navigation.navigate('OutfitDetail', { outfit });
  };

  const renderOutfitItem = ({ item }) => (
    <OutfitCard
      item={item}
      onPress={() => handleOutfitPress(item)}
      style={styles.outfitCard}
    />
  );

  const OutfitCard = ({ item, onPress, style }) => (
    <TouchableOpacity onPress={() => onPress(item)} style={[styles.cardContainer, style]}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Title style={styles.outfitName} numberOfLines={1}>
              {item.name || '未命名搭配'}
            </Title>
            <Text style={styles.outfitDate}>
              {new Date(item.created_at).toLocaleDateString('zh-CN')}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            {item.is_favorite && (
              <Ionicons name="heart" size={20} color={theme.colors.error} />
            )}
            <Text style={styles.userName}>{item.user_name}</Text>
          </View>
        </View>

        {item.photo_uri && (
          <Image source={{ uri: item.photo_uri }} style={styles.outfitImage} />
        )}

        <Card.Content style={styles.cardContent}>
          <View style={styles.outfitDetails}>
            {item.occasion && (
              <Chip style={styles.detailChip} textStyle={styles.chipText}>
                {item.occasion}
              </Chip>
            )}
            {item.weather && (
              <Chip style={styles.detailChip} textStyle={styles.chipText}>
                {item.weather}
              </Chip>
            )}
          </View>
          
          {item.notes && (
            <Paragraph style={styles.outfitNotes} numberOfLines={2}>
              {item.notes}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
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
          {users.map((user) => (
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
              {user.name}
            </Chip>
          ))}
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
        onPress={() => navigation.navigate('CreateOutfit')}
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
  
  cardContainer: {
    flex: 1,
  },
  
  card: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  
  cardHeaderLeft: {
    flex: 1,
  },
  
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  
  outfitName: {
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  
  outfitDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  userName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  outfitImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  
  cardContent: {
    padding: theme.spacing.sm,
  },
  
  outfitDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  
  detailChip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  
  chipText: {
    fontSize: 10,
  },
  
  outfitNotes: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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