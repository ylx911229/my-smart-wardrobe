import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';

const EmptyState = ({ icon, title, subtitle, children }) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={80} color={theme.colors.textSecondary} />
      <Title style={styles.title}>{title}</Title>
      <Paragraph style={styles.subtitle}>{subtitle}</Paragraph>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  
  title: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  subtitle: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
});

export default EmptyState; 