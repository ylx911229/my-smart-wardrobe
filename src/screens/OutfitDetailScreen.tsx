import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Share,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  IconButton,
  Divider,
  Avatar,
  Portal,
  List,
  Searchbar,
  FAB
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import { useDatabase } from '../services/DatabaseContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { OutfitStackParamList, Outfit, ClothingItem } from '../types';

const { width } = Dimensions.get('window');

type OutfitDetailScreenNavigationProp = StackNavigationProp<
  OutfitStackParamList,
  'OutfitDetail'
>;

type OutfitDetailScreenRouteProp = RouteProp<
  OutfitStackParamList,
  'OutfitDetail'
>;

interface OutfitDetailScreenProps {
  navigation: OutfitDetailScreenNavigationProp;
  route: OutfitDetailScreenRouteProp;
}

// 定义衣物部位分类
const CLOTHING_POSITIONS = {
  '上衣': ['上衣', '衬衫', 'T恤'],
  '下装': ['下装', '裤子', '裙子'],
  '外套': ['外套', '夹克', '西装'],
  '鞋子': ['鞋子', '靴子', '凉鞋'],
  '配饰': ['配饰', '包包', '首饰', '帽子'],
  '内衣': ['内衣']
};

// 必传部位
const REQUIRED_POSITIONS = ['上衣', '下装', '鞋子'];

const OutfitDetailScreen = ({ route, navigation }: OutfitDetailScreenProps) => {
  const { outfit } = route.params;
  const { clothing, updateOutfit } = useDatabase();
  const [isFavorite, setIsFavorite] = useState(outfit.is_favorite);
  const [outfitClothes, setOutfitClothes] = useState<ClothingItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClothes, setEditingClothes] = useState<ClothingItem[]>([]);
  const [showClothingSelector, setShowClothingSelector] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [currentClothingToReplace, setCurrentClothingToReplace] = useState<ClothingItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableClothes, setAvailableClothes] = useState<ClothingItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 根据 clothingIds 获取穿搭中的衣物
    const getOutfitClothes = () => {
      let clothingIds: string[] = [];
      
      // 处理不同格式的 clothingIds
      if (Array.isArray(outfit.clothingIds)) {
        clothingIds = outfit.clothingIds;
      } else if (typeof outfit.clothingIds === 'string') {
        try {
          clothingIds = JSON.parse(outfit.clothingIds);
        } catch (error) {
          console.error('Error parsing clothingIds:', error);
          clothingIds = [];
        }
      }
      
      // 根据 ID 筛选出对应的衣物
      const clothesInOutfit = clothing.filter(item => clothingIds.includes(item.id));
      setOutfitClothes(clothesInOutfit);
      setEditingClothes(clothesInOutfit);
    };

    getOutfitClothes();
  }, [outfit.clothingIds, clothing]);

  // 动态更新导航栏配置
  useEffect(() => {
    if (isEditing) {
      // 编辑模式下的特殊配置
      navigation.setOptions({
        title: '编辑穿搭',
        headerLeft: () => (
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.textLight}
            onPress={() => {
              Alert.alert(
                '退出编辑',
                '确定要退出编辑吗？未保存的更改将丢失。',
                [
                  { text: '取消', style: 'cancel' },
                  { text: '确定', onPress: () => {
                    handleCancelEdit();
                    navigation.goBack();
                  }}
                ]
              );
            }}
          />
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row' }}>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.textLight}
              onPress={handleCancelEdit}
            />
            <IconButton
              icon="check"
              size={24}
              iconColor={theme.colors.textLight}
              onPress={handleSaveEdit}
              disabled={saving}
            />
          </View>
        ),
      });
    } else {
      // 非编辑模式下恢复默认配置
      navigation.setOptions({
        title: '穿搭详情',
        headerLeft: undefined, // 使用默认的返回按钮
        headerRight: undefined,
      });
    }
  }, [isEditing, saving, navigation]);

  // 获取衣物的部位分类
  const getClothingPosition = (item: ClothingItem): string => {
    const category = item.category_name || item.category || '其他';
    
    for (const [position, categories] of Object.entries(CLOTHING_POSITIONS)) {
      if (categories.includes(category)) {
        return position;
      }
    }
    return '其他';
  };

  // 按部位分组衣物
  const groupClothesByPosition = (clothes: ClothingItem[]) => {
    const grouped: { [key: string]: ClothingItem[] } = {};
    
    clothes.forEach(item => {
      const position = getClothingPosition(item);
      if (!grouped[position]) {
        grouped[position] = [];
      }
      grouped[position].push(item);
    });
    
    return grouped;
  };

  // 校验穿搭完整性
  const validateOutfit = (clothes: ClothingItem[]): { valid: boolean; message?: string } => {
    const groupedClothes = groupClothesByPosition(clothes);
    const missingPositions = REQUIRED_POSITIONS.filter(position => !groupedClothes[position] || groupedClothes[position].length === 0);
    
    if (missingPositions.length > 0) {
      return {
        valid: false,
        message: `缺少必需的部位：${missingPositions.join('、')}`
      };
    }
    
    return { valid: true };
  };

  // 开始编辑
  const handleEdit = () => {
    setIsEditing(true);
    setEditingClothes([...outfitClothes]);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingClothes([...outfitClothes]);
    setShowClothingSelector(false);
    setSelectedPosition(null);
    setCurrentClothingToReplace(null);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    // 校验穿搭完整性
    const validation = validateOutfit(editingClothes);
    if (!validation.valid) {
      Alert.alert('校验失败', validation.message);
      return;
    }

    setSaving(true);
    try {
      const updatedOutfit = {
        ...outfit,
        clothingIds: editingClothes.map(item => item.id),
        updatedAt: new Date().toISOString()
      };

      await updateOutfit(outfit.id, updatedOutfit);
      
      // 更新本地状态
      setOutfitClothes([...editingClothes]);
      setIsEditing(false);
      Alert.alert('成功', '穿搭已更新');
    } catch (error) {
      console.error('Error updating outfit:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 替换衣物
  const handleReplaceClothing = (currentItem: ClothingItem) => {
    const position = getClothingPosition(currentItem);
    setCurrentClothingToReplace(currentItem);
    setSelectedPosition(position);
    
    // 筛选同一部位的衣物
    const filteredClothes = clothing.filter(item => {
      const itemPosition = getClothingPosition(item);
      return itemPosition === position && item.id !== currentItem.id;
    });
    
    setAvailableClothes(filteredClothes);
    setSearchQuery('');
    setShowClothingSelector(true);
  };

  // 添加新衣物
  const handleAddClothing = (position: string) => {
    setCurrentClothingToReplace(null);
    setSelectedPosition(position);
    
    // 筛选指定部位的衣物，排除已在穿搭中的
    const usedClothingIds = editingClothes.map(item => item.id);
    const filteredClothes = clothing.filter(item => {
      const itemPosition = getClothingPosition(item);
      return itemPosition === position && !usedClothingIds.includes(item.id);
    });
    
    setAvailableClothes(filteredClothes);
    setSearchQuery('');
    setShowClothingSelector(true);
  };

  // 删除衣物
  const handleRemoveClothing = (itemToRemove: ClothingItem) => {
    const position = getClothingPosition(itemToRemove);
    const isRequired = REQUIRED_POSITIONS.includes(position);
    
    if (isRequired) {
      Alert.alert(
        '确认删除',
        `${position}是必需部位，删除后需要添加其他${position}才能保存。确定删除吗？`,
        [
          { text: '取消', style: 'cancel' },
          { text: '确定', onPress: () => {
            const updatedClothes = editingClothes.filter(item => item.id !== itemToRemove.id);
            setEditingClothes(updatedClothes);
          }}
        ]
      );
    } else {
      const updatedClothes = editingClothes.filter(item => item.id !== itemToRemove.id);
      setEditingClothes(updatedClothes);
    }
  };

  // 选择衣物
  const handleSelectClothing = (selectedItem: ClothingItem) => {
    if (currentClothingToReplace) {
      // 替换模式
      const updatedClothes = editingClothes.map(item => 
        item.id === currentClothingToReplace.id ? selectedItem : item
      );
      setEditingClothes(updatedClothes);
    } else {
      // 添加模式
      setEditingClothes([...editingClothes, selectedItem]);
    }
    
    setShowClothingSelector(false);
    setCurrentClothingToReplace(null);
    setSelectedPosition(null);
  };

  // 过滤可选衣物
  const getFilteredClothes = () => {
    if (!searchQuery) return availableClothes;
    
    const query = searchQuery.toLowerCase();
    return availableClothes.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.brand && item.brand.toLowerCase().includes(query)) ||
      item.color.toLowerCase().includes(query)
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我的穿搭：${outfit.name || '今日搭配'}`,
        title: '分享穿搭'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // 实现收藏逻辑
    Alert.alert('提示', isFavorite ? '已取消收藏' : '已添加到收藏');
  };

  const handleWear = () => {
    Alert.alert(
      '记录穿着',
      '确定要记录今天穿了这套搭配吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: recordWear }
      ]
    );
  };

  const recordWear = () => {
    // 实现穿着记录逻辑
    Alert.alert('成功', '穿着记录已保存');
  };

  const handleClothingPress = (clothing: ClothingItem) => {
    if (isEditing) return; // 编辑模式下不跳转
    
    // 跳转到衣物详情页，在同一个Stack内导航
    navigation.navigate('ClothingDetail', { clothing });
  };

  const renderClothingItem = ({ item }: { item: ClothingItem }) => {
    const position = getClothingPosition(item);
    const isRequired = REQUIRED_POSITIONS.includes(position);
    
    return (
      <TouchableOpacity 
        onPress={() => handleClothingPress(item)} 
        style={styles.clothingItem}
        disabled={isEditing}
      >
        <Card style={styles.clothingCard}>
          <View style={styles.clothingImageContainer}>
            {item.imageUri || item.photo_uri ? (
              <Image 
                source={{ uri: item.imageUri || item.photo_uri }} 
                style={styles.clothingImage} 
              />
            ) : (
              <View style={styles.clothingPlaceholder}>
                <Ionicons name="shirt-outline" size={32} color={theme.colors.textSecondary} />
              </View>
            )}
            {isEditing && (
              <View style={styles.editOverlay}>
                <IconButton
                  icon="swap-horizontal"
                  size={20}
                  iconColor={theme.colors.textLight}
                  style={styles.editButton}
                  onPress={() => handleReplaceClothing(item)}
                />
                <IconButton
                  icon="close"
                  size={20}
                  iconColor={theme.colors.error}
                  style={[styles.editButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => handleRemoveClothing(item)}
                />
              </View>
            )}
          </View>
          <View style={styles.clothingInfo}>
            <Text style={styles.clothingName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.clothingCategoryRow}>
              <Text style={styles.clothingCategory}>{item.category_name || item.category}</Text>
              {isRequired && (
                <Chip style={styles.requiredChip} textStyle={styles.requiredChipText}>
                  必需
                </Chip>
              )}
            </View>
            {item.brand && (
              <Text style={styles.clothingBrand}>{item.brand}</Text>
            )}
            <View style={styles.clothingTags}>
              <Chip style={styles.colorChip} textStyle={styles.chipText}>
                {item.color}
              </Chip>
              {item.smartTags?.styles?.[0] && (
                <Chip style={styles.styleChip} textStyle={styles.chipText}>
                  {item.smartTags.styles[0]}
                </Chip>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderAvailableClothingItem = ({ item }: { item: ClothingItem }) => (
    <TouchableOpacity onPress={() => handleSelectClothing(item)}>
      <List.Item
        title={item.name}
        description={`${item.category_name || item.category} • ${item.color}${item.brand ? ` • ${item.brand}` : ''}`}
        left={() => (
          <View style={styles.listItemImage}>
            {item.imageUri || item.photo_uri ? (
              <Image 
                source={{ uri: item.imageUri || item.photo_uri }} 
                style={styles.listItemImageContent} 
              />
            ) : (
              <View style={styles.listItemPlaceholder}>
                <Ionicons name="shirt-outline" size={24} color={theme.colors.textSecondary} />
              </View>
            )}
          </View>
        )}
        right={() => <IconButton icon="plus" size={20} />}
      />
    </TouchableOpacity>
  );

  // 渲染添加部位按钮
  const renderAddPositionButtons = () => {
    const currentPositions = editingClothes.map(item => getClothingPosition(item));
    const groupedPositions = groupClothesByPosition(editingClothes);
    
    return (
      <View style={styles.addPositionContainer}>
        <Text style={styles.addPositionTitle}>添加部位</Text>
        <View style={styles.addPositionButtons}>
          {Object.keys(CLOTHING_POSITIONS).map(position => {
            const hasItems = groupedPositions[position] && groupedPositions[position].length > 0;
            const isRequired = REQUIRED_POSITIONS.includes(position);
            
            return (
              <Button
                key={position}
                mode={hasItems ? "outlined" : "contained"}
                style={[
                  styles.addPositionButton,
                  isRequired && !hasItems && styles.requiredPositionButton
                ]}
                onPress={() => handleAddClothing(position)}
                disabled={hasItems}
              >
                {position} {isRequired && '*'}
              </Button>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 穿搭图片 */}
      {outfit.photo_uri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: outfit.imageUri || outfit.photo_uri || '' }} style={styles.image} />
          <View style={styles.imageOverlay}>
            <IconButton
              icon="share-variant"
              size={24}
              iconColor={theme.colors.textLight}
              style={styles.overlayButton}
              onPress={handleShare}
            />
            <IconButton
              icon={isFavorite ? "heart" : "heart-outline"}
              size={24}
              iconColor={theme.colors.error}
              style={styles.overlayButton}
              onPress={handleFavorite}
            />
          </View>
        </View>
      )}

      {/* 基本信息 */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Title style={styles.outfitName}>
                {outfit.name || '未命名搭配'}
              </Title>
              <Text style={styles.userName}>
                创建于 {outfit.created_at ? new Date(outfit.created_at).toLocaleDateString('zh-CN') : '未知'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            {outfit.occasion && (
              <Chip style={styles.detailChip} textStyle={styles.chipText}>
                {outfit.occasion}
              </Chip>
            )}
            {outfit.weather && (
              <Chip style={styles.detailChip} textStyle={styles.chipText}>
                {outfit.weather}
              </Chip>
            )}
          </View>

          {outfit.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>备注</Text>
              <Paragraph style={styles.notesText}>{outfit.notes}</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 搭配单品 */}
      <Card style={styles.itemsCard}>
        <Card.Content>
          <View style={styles.itemsHeader}>
            <Title style={styles.sectionTitle}>搭配单品</Title>
            <Text style={styles.itemsCount}>
              {isEditing ? editingClothes.length : outfitClothes.length} 件
            </Text>
          </View>
          
          {(isEditing ? editingClothes : outfitClothes).length > 0 ? (
            <FlatList
              data={isEditing ? editingClothes : outfitClothes}
              renderItem={renderClothingItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.clothingList}
            />
          ) : (
            <View style={styles.emptyClothes}>
              <Ionicons name="shirt-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyClothesText}>未找到搭配单品</Text>
              <Text style={styles.emptyClothesSubtext}>
                可能该穿搭的衣物已被删除
              </Text>
            </View>
          )}

          {/* 编辑模式下的添加按钮 */}
          {isEditing && renderAddPositionButtons()}
        </Card.Content>
      </Card>

      {/* 操作按钮 - 编辑模式下隐藏，因为操作已移到导航栏 */}
      {!isEditing && (
        <Card style={styles.actionsCard}>
          <Card.Content>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="checkbook"
                onPress={handleWear}
                style={[styles.actionButton, styles.primaryButton]}
              >
                记录穿着
              </Button>
              <Button
                mode="outlined"
                icon="pencil"
                onPress={handleEdit}
                style={styles.actionButton}
              >
                编辑
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 相似推荐 */}
      {!isEditing && (
        <Card style={styles.recommendCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>相似推荐</Title>
            <Paragraph style={styles.comingSoon}>
              基于此搭配的相似推荐功能即将推出
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* 衣物选择弹窗 */}
      <Portal>
        <Modal
          visible={showClothingSelector}
          onDismiss={() => setShowClothingSelector(false)}
        >
          <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>
              {currentClothingToReplace ? '替换' : '添加'}{selectedPosition}
            </Title>
            <IconButton
              icon="close"
              onPress={() => setShowClothingSelector(false)}
            />
          </View>
          
          <Searchbar
            placeholder="搜索衣物..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <FlatList
            data={getFilteredClothes()}
            renderItem={renderAvailableClothingItem}
            keyExtractor={(item) => item.id}
            style={styles.clothingList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? '没有找到匹配的衣物' : `没有可用的${selectedPosition}`}
                </Text>
              </View>
            }
          />
         </View>
         </Modal>
       </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  imageContainer: {
    position: 'relative',
    height: 300,
  },

  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  imageOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
  },

  overlayButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    marginLeft: theme.spacing.sm,
  },

  infoCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  header: {
    marginBottom: theme.spacing.md,
  },

  headerLeft: {
    flex: 1,
  },

  outfitName: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },

  userName: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },

  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },

  detailChip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.cardBackground,
  },

  chipText: {
    fontSize: 12,
  },

  notesSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
  },

  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },

  notesText: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  itemsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  sectionTitle: {
    marginBottom: 0,
    color: theme.colors.primary,
  },

  itemsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
  },

  clothingList: {
    paddingTop: 0,
  },

  clothingItem: {
    marginBottom: theme.spacing.md,
  },

  clothingCard: {
    backgroundColor: theme.colors.cardBackground,
    elevation: 1,
  },

  clothingImageContainer: {
    height: 120,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },

  clothingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  clothingPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.divider,
  },

  editOverlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
  },

  editButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },

  clothingInfo: {
    padding: theme.spacing.md,
  },

  clothingName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  clothingCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },

  clothingCategory: {
    fontSize: 14,
    color: theme.colors.primary,
  },

  requiredChip: {
    backgroundColor: theme.colors.error,
    height: 20,
  },

  requiredChipText: {
    color: theme.colors.textLight,
    fontSize: 10,
  },

  clothingBrand: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },

  clothingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },

  colorChip: {
    height: 24,
    backgroundColor: theme.colors.primary + '20',
  },

  styleChip: {
    height: 24,
    backgroundColor: theme.colors.secondary + '20',
  },

  emptyClothes: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  emptyClothesText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  emptyClothesSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  addPositionContainer: {
    marginTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
  },

  addPositionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  addPositionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },

  addPositionButton: {
    marginBottom: theme.spacing.sm,
  },

  requiredPositionButton: {
    backgroundColor: theme.colors.error + '20',
    borderColor: theme.colors.error,
  },

  comingSoon: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  actionsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  actionButton: {
    flex: 0.45,
  },

  primaryButton: {
    backgroundColor: theme.colors.primary,
  },

  recommendCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  modalContainer: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.roundness,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  modalTitle: {
    color: theme.colors.text,
  },

  searchBar: {
    margin: theme.spacing.md,
  },

  listItemImage: {
    width: 60,
    height: 60,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },

  listItemImageContent: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  listItemPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.divider,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default OutfitDetailScreen; 