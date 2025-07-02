import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Share,
  Linking
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  IconButton,
  Divider
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { WardrobeStackParamList, ClothingItem } from '../types';

type ClothingDetailScreenNavigationProp = StackNavigationProp<
  WardrobeStackParamList,
  'ClothingDetail'
>;

type ClothingDetailScreenRouteProp = RouteProp<
  WardrobeStackParamList,
  'ClothingDetail'
>;

interface ClothingDetailScreenProps {
  navigation: ClothingDetailScreenNavigationProp;
  route: ClothingDetailScreenRouteProp;
}

const ClothingDetailScreen = ({ route, navigation }: ClothingDetailScreenProps) => {
  const { clothing } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我的${clothing.category_name}：${clothing.name}${clothing.brand ? ` - ${clothing.brand}` : ''}`,
        title: '分享衣物'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleEdit = () => {
    // TODO: 实现编辑功能
    Alert.alert('提示', '编辑功能暂未实现');
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      '确定要删除这件衣物吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = () => {
    // 实现删除逻辑
    Alert.alert('提示', '删除功能暂未实现');
  };

  const getActivityColor = (score: number) => {
    if (score > 20) return theme.colors.success;
    if (score > 10) return theme.colors.warning;
    return theme.colors.textSecondary;
  };

  const renderDetailRow = (label: string, value: string | null, icon?: any) => {
    if (!value) return null;
    
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailLabel}>
          {icon && <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />}
          <Text style={styles.detailLabelText}>{label}</Text>
        </View>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 衣物图片 */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: clothing.imageUri || clothing.photo_uri || '' }} style={styles.image} />
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
            onPress={() => setIsFavorite(!isFavorite)}
          />
        </View>
      </View>

      {/* 基本信息 */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Title style={styles.name}>{clothing.name}</Title>
              <View style={styles.categoryContainer}>
                <Chip 
                  style={[styles.categoryChip, { backgroundColor: clothing.category_color || theme.colors.secondary }]}
                  textStyle={styles.categoryText}
                >
                  {clothing.category_name}
                </Chip>
              </View>
            </View>
            <View style={styles.activityContainer}>
              <Ionicons 
                name="flash" 
                size={20} 
                color={getActivityColor(clothing.activity_score || 0)} 
              />
              <Text style={[styles.activityScore, { color: getActivityColor(clothing.activity_score || 0) }]}>
                {clothing.activity_score || 0}
              </Text>
              <Text style={styles.activityLabel}>活跃度</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 详细信息 */}
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>详细信息</Title>
          
          {renderDetailRow('品牌', clothing.brand || null, 'business-outline')}
          {renderDetailRow('颜色', clothing.color || null, 'color-palette-outline')}
          {renderDetailRow('尺码', clothing.size || null, 'resize-outline')}
          {renderDetailRow('购买日期', clothing.purchaseDate ? new Date(clothing.purchaseDate).toLocaleDateString('zh-CN') : null, 'calendar-outline')}
          {renderDetailRow('购买价格', clothing.price ? `¥${clothing.price}` : null, 'cash-outline')}
          {renderDetailRow('存放位置', clothing.location || null, 'location-outline')}
          {renderDetailRow('最后穿着', clothing.lastWorn ? new Date(clothing.lastWorn).toLocaleDateString('zh-CN') : '从未穿着', 'time-outline')}
          {renderDetailRow('穿着次数', `${clothing.wearCount || 0} 次`, 'repeat-outline')}
          
          {clothing.notes && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>备注</Text>
                <Paragraph style={styles.notesText}>{clothing.notes}</Paragraph>
              </View>
            </>
          )}

          {/* TODO: 添加购买链接功能
          {clothing.purchase_link && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.linkSection}>
                <Text style={styles.linkLabel}>购买链接</Text>
                <Text 
                  style={styles.linkText}
                  onPress={() => Linking.openURL(clothing.purchase_link)}
                >
                  点击查看原购买页面
                </Text>
              </View>
            </>
          )}
          */}
        </Card.Content>
      </Card>

      {/* 操作按钮 */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={handleEdit}
              style={styles.actionButton}
            >
              编辑
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              onPress={handleDelete}
              style={[styles.actionButton, styles.deleteButton]}
              textColor={theme.colors.error}
            >
              删除
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 相关搭配 */}
      <Card style={styles.outfitsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>相关穿搭</Title>
          <Paragraph style={styles.comingSoon}>
            此功能即将推出，敬请期待
          </Paragraph>
        </Card.Content>
      </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerLeft: {
    flex: 1,
  },

  name: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },

  categoryContainer: {
    flexDirection: 'row',
  },

  categoryChip: {
    alignSelf: 'flex-start',
  },

  categoryText: {
    color: theme.colors.textLight,
  },

  activityContainer: {
    alignItems: 'center',
    paddingLeft: theme.spacing.md,
  },

  activityScore: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },

  activityLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  detailsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },

  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  detailLabelText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },

  detailValue: {
    color: theme.colors.text,
    fontWeight: '500',
  },

  divider: {
    marginVertical: theme.spacing.md,
  },

  notesSection: {
    marginTop: theme.spacing.sm,
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

  linkSection: {
    marginTop: theme.spacing.sm,
  },

  linkLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },

  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
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

  deleteButton: {
    borderColor: theme.colors.error,
  },

  outfitsCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  comingSoon: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default ClothingDetailScreen; 