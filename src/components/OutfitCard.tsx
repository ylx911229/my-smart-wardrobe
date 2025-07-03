import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Text, Chip, Paragraph } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import type { Outfit, User } from '../types';

interface OutfitCardProps {
  item: Outfit;
  onPress: (item: Outfit) => void;
  onLongPress?: (item: Outfit) => void;
  onToggleFavorite?: (item: Outfit) => void;
  style?: any;
  users?: User[];
}

const OutfitCard = ({ item, onPress, onLongPress, onToggleFavorite, style, users = [] }: OutfitCardProps) => {
  const renderDate = () => {
    try {
      if (item?.created_at && typeof item.created_at === 'string') {
        return new Date(item.created_at).toLocaleDateString('zh-CN');
      } else if (item?.createdAt && typeof item.createdAt === 'string') {
        return new Date(item.createdAt).toLocaleDateString('zh-CN');
      }
      return '未知日期';
    } catch {
      return '未知日期';
    }
  };

  const getUserName = () => {
    if (item.user_id && users.length > 0) {
      const user = users.find(u => u.id === item.user_id);
      return user ? user.name : '未知用户';
    }
    return '我'; // 默认显示为"我"（向后兼容）
  };

  return (
    <TouchableOpacity 
      onPress={() => onPress(item)}
      onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      style={[styles.cardContainer, style]}
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.nameHeartRow}>
            <Title style={styles.outfitName} numberOfLines={1}>
              {item?.name && typeof item.name === 'string' ? item.name : '未命名搭配'}
            </Title>
            {onToggleFavorite && (
              <TouchableOpacity onPress={() => onToggleFavorite(item)}>
                <Ionicons 
                  name={item?.is_favorite ? "heart" : "heart-outline"} 
                  size={20} 
                  color={item?.is_favorite ? theme.colors.error : theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.userDateRow}>
            <Text style={styles.userName}>{getUserName()}</Text>
            <Text style={styles.outfitDate}>
              {renderDate()}
            </Text>
          </View>
        </View>

        {((item?.imageUri && typeof item.imageUri === 'string' && item.imageUri.trim() !== '') ||
          (item?.photo_uri && typeof item.photo_uri === 'string' && item.photo_uri.trim() !== '')) && (
          <Image source={{ uri: (item.imageUri || item.photo_uri || '').trim() }} style={styles.outfitImage} />
        )}

        <Card.Content style={styles.cardContent}>
          <View style={styles.outfitDetails}>
            {item?.occasion && typeof item.occasion === 'string' && item.occasion.trim() !== '' && (
              <Chip style={styles.detailChip} textStyle={styles.chipText}>
                {item.occasion.trim()}
              </Chip>
            )}
            {item?.weather && typeof item.weather === 'string' && item.weather.trim() !== '' && (
              <Chip style={styles.detailChip} textStyle={styles.chipText}>
                {item.weather.trim()}
              </Chip>
            )}
          </View>
          
          {item?.notes && typeof item.notes === 'string' && item.notes.trim() !== '' && (
            <Paragraph style={styles.outfitNotes} numberOfLines={2}>
              {item.notes.trim()}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // 移除flex: 1，让FlatGrid控制宽度
  },
  
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    minHeight: 200, // 固定最小高度确保布局一致
    ...theme.shadows.small,
  },
  
  cardHeader: {
    flexDirection: 'column',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  
  nameHeartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  
  outfitName: {
    fontSize: 14,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  
  userDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  outfitDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  userName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  outfitImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
    borderTopLeftRadius: theme.roundness,
    borderTopRightRadius: theme.roundness,
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
    borderRadius: theme.roundness,
  },
  
  chipText: {
    fontSize: 10,
  },
  
  outfitNotes: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default OutfitCard; 