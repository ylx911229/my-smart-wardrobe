import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Share
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

const OutfitDetailScreen = ({ route, navigation }) => {
  const { outfit } = route.params;
  const [isFavorite, setIsFavorite] = useState(outfit.is_favorite);

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

  const handleEdit = () => {
    navigation.navigate('EditOutfit', { outfit });
  };

  return (
    <ScrollView style={styles.container}>
      {/* 穿搭图片 */}
      {outfit.photo_uri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: outfit.photo_uri }} style={styles.image} />
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
                {outfit.user_name} · {new Date(outfit.created_at).toLocaleDateString('zh-CN')}
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

      {/* 单品详情 */}
      <Card style={styles.itemsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>搭配单品</Title>
          <Paragraph style={styles.comingSoon}>
            单品详情功能即将推出，敬请期待
          </Paragraph>
        </Card.Content>
      </Card>

      {/* 操作按钮 */}
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

      {/* 相似推荐 */}
      <Card style={styles.recommendCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>相似推荐</Title>
          <Paragraph style={styles.comingSoon}>
            基于此搭配的相似推荐功能即将推出
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

  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
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
});

export default OutfitDetailScreen; 