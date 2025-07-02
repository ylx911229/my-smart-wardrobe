import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Text, Chip, Paragraph } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import type { Outfit } from '../types';

interface OutfitCardProps {
  item: Outfit;
  onPress: (item: Outfit) => void;
  style?: any;
}

const OutfitCard = ({ item, onPress, style }: OutfitCardProps) => {
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

  return (
    <TouchableOpacity onPress={() => onPress(item)} style={[styles.cardContainer, style]}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Title style={styles.outfitName} numberOfLines={1}>
              {item?.name && typeof item.name === 'string' ? item.name : '未命名搭配'}
            </Title>
            <Text style={styles.outfitDate}>
              {renderDate()}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            {Boolean(item?.is_favorite) && (
              <Ionicons name="heart" size={20} color={theme.colors.error} />
            )}
            <Text style={styles.userName}>我</Text>
          </View>
        </View>

        {item?.photo_uri && typeof item.photo_uri === 'string' && item.photo_uri.trim() !== '' && (
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
});

export default OutfitCard; 