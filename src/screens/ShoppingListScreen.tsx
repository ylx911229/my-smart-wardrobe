import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, TextInput, Card, Checkbox, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList, ShoppingItem } from '../types';

type ShoppingListScreenNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'ShoppingList'
>;

interface ShoppingListScreenProps {
  navigation: ShoppingListScreenNavigationProp;
}

interface ShoppingItemData extends ShoppingItem {
  id: string;
  name: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedPrice?: number;
  notes?: string;
  isCompleted: boolean;
}

const ShoppingListScreen = ({ navigation }: ShoppingListScreenProps) => {
  const [items, setItems] = useState<ShoppingItemData[]>([]);
  const [newItem, setNewItem] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const toggleItem = (id: string) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItem.trim()) {
      const item: ShoppingItemData = {
        id: Date.now().toString(),
        name: newItem.trim(),
        category: '衣物',
        priority: 'medium',
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems(prevItems => [...prevItems, item]);
      setNewItem('');
      setShowAddForm(false);
    }
  };

  const renderItem = ({ item }: { item: ShoppingItemData }) => (
    <Card style={styles.itemCard}>
      <Card.Content style={styles.itemContent}>
        <View style={styles.itemLeft}>
          <Checkbox
            status={item.isCompleted ? 'checked' : 'unchecked'}
            onPress={() => toggleItem(item.id)}
          />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, item.isCompleted && styles.completedText]}>
              {item.name}
            </Text>
            <View style={styles.itemMeta}>
              <Text style={styles.category}>{item.category}</Text>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
            </View>
          </View>
        </View>
        <IconButton
          icon="delete"
          size={20}
          onPress={() => deleteItem(item.id)}
        />
      </Card.Content>
    </Card>
  );

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFE66D';
      case 'low': return '#4ECDC4';
      default: return theme.colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>购物清单</Text>
        <Button
          mode="contained"
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addButton}
        >
          添加
        </Button>
      </View>

      {showAddForm && (
        <Card style={styles.addForm}>
          <Card.Content>
            <TextInput
              label="物品名称"
              value={newItem}
              onChangeText={setNewItem}
              style={styles.input}
            />
            <View style={styles.formButtons}>
              <Button onPress={() => setShowAddForm(false)}>
                取消
              </Button>
              <Button mode="contained" onPress={addItem}>
                添加
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addForm: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  list: {
    padding: theme.spacing.lg,
  },
  itemCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemInfo: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.placeholder,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginRight: theme.spacing.xs,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ShoppingListScreen; 