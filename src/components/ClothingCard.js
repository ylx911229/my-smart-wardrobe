import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';

const ClothingCard = ({ item, onPress, style }) => {
  const getActivityColor = (score) => {
    if (score > 20) return theme.colors.success;
    if (score > 10) return theme.colors.warning;
    return theme.colors.textSecondary;
  };

  return (
    <TouchableOpacity onPress={() => onPress(item)} style={[styles.container, style]}>
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.photo_uri }} style={styles.image} />
          <View style={styles.overlay}>
            <View style={styles.activityIndicator}>
              <Ionicons 
                name="flash" 
                size={12} 
                color={getActivityColor(item.activity_score)} 
              />
              <Text style={[styles.activityText, { color: getActivityColor(item.activity_score) }]}>
                {item.activity_score || 0}
              </Text>
            </View>
          </View>
        </View>
        
        <Card.Content style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Chip 
            style={[styles.categoryChip, { backgroundColor: item.category_color || theme.colors.secondary }]}
            textStyle={styles.categoryText}
          >
            {item.category_name}
          </Chip>
          
          {item.brand && (
            <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>
          )}
          
          <View style={styles.details}>
            {item.color && (
              <Text style={styles.detailText}>{item.color}</Text>
            )}
            {item.size && (
              <Text style={styles.detailText}>{item.size}</Text>
            )}
          </View>
          
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
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