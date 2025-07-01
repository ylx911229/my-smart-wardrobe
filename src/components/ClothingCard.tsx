import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import { ClothingCardProps } from '../types';

const ClothingCard = ({ item, onPress, style }: ClothingCardProps) => {
  const getActivityColor = (score: number) => {
    if (score > 20) return theme.colors.success;
    if (score > 10) return theme.colors.warning;
    return theme.colors.textSecondary;
  };

  return (
    <TouchableOpacity onPress={() => onPress(item)} style={[styles.container, style]}>
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          {(() => {
            const photoUri = (item.photo_uri && typeof item.photo_uri === 'string' && item.photo_uri.trim()) 
              ? item.photo_uri.trim() 
              : (item.imageUri && typeof item.imageUri === 'string' && item.imageUri.trim()) 
              ? item.imageUri.trim() 
              : '';
            
            return photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Ionicons name="image-outline" size={40} color={theme.colors.textSecondary} />
              </View>
            );
          })()}
          <View style={styles.overlay}>
            <View style={styles.activityIndicator}>
              <Ionicons 
                name="flash" 
                size={12} 
                color={getActivityColor((typeof item.activity_score === 'number') ? item.activity_score : 0)} 
              />
              <Text style={[styles.activityText, { color: getActivityColor((typeof item.activity_score === 'number') ? item.activity_score : 0) }]}>
                {(typeof item.activity_score === 'number') ? item.activity_score : 0}
              </Text>
            </View>
          </View>
        </View>
        
        <Card.Content style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {(item.name && typeof item.name === 'string') ? item.name : '未命名衣物'}
          </Text>
          <Chip 
            style={[styles.categoryChip, { backgroundColor: item.category_color || theme.colors.secondary }]}
            textStyle={styles.categoryText}
          >
            {(item.category_name && typeof item.category_name === 'string') 
              ? item.category_name 
              : (item.category && typeof item.category === 'string') 
              ? item.category 
              : '未分类'}
          </Chip>
          
          {(item.brand && typeof item.brand === 'string' && item.brand.trim()) && (
            <Text style={styles.brand} numberOfLines={1}>{item.brand.trim()}</Text>
          )}
          
          <View style={styles.details}>
            {(item.color && typeof item.color === 'string' && item.color.trim()) && (
              <Text style={styles.detailText}>{item.color.trim()}</Text>
            )}
            {(item.size && typeof item.size === 'string' && item.size.trim()) && (
              <Text style={styles.detailText}>{item.size.trim()}</Text>
            )}
          </View>
          
          {(item.location && typeof item.location === 'string' && item.location.trim()) && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>{item.location.trim()}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  card: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  
  imageContainer: {
    position: 'relative',
    height: 150,
  },
  
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: theme.roundness,
    borderTopRightRadius: theme.roundness,
  },
  
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  
  overlay: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  
  activityText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  
  content: {
    padding: theme.spacing.sm,
  },
  
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  
  categoryText: {
    fontSize: 10,
    color: theme.colors.textLight,
  },
  
  brand: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  
  detailText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  locationText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
});

export default ClothingCard; 