import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Avatar,
  Text,
  Divider,
  Portal,
  Modal,
  TextInput
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';
import { useDatabase } from '../services/DatabaseContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList, User } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'ProfileMain'
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface StatsData {
  totalClothes: number;
  totalOutfits: number;
  categories: { name: string; count: number }[];
}

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const { clothing, outfits, users, addUser } = useDatabase();
  
  const [stats, setStats] = useState<StatsData>({
    totalClothes: 0,
    totalOutfits: 0,
    categories: []
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhoto, setNewUserPhoto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [clothing, outfits]);

  const loadData = async () => {
    try {
      // 计算统计数据
      const categoryCount: { [key: string]: number } = {};
      clothing.forEach(item => {
        const category = item.category_name || item.category || '其他';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      setStats({
        totalClothes: clothing.length,
        totalOutfits: outfits.length,
        categories: Object.entries(categoryCount).map(([name, count]) => ({ name, count }))
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const pickUserPhoto = async () => {
    try {
      // 检查相册权限
      const mediaLibraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (mediaLibraryStatus.status !== 'granted') {
        const requestResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (requestResult.status !== 'granted') {
          Alert.alert('权限不足', '需要相册权限才能选择照片');
          return;
        }
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setNewUserPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('错误', '选择照片失败，请重试');
    }
  };

  const handleSaveUser = async () => {
    if (!newUserName.trim()) {
      Alert.alert('提示', '请输入用户名称');
      return;
    }

    setLoading(true);
    
    try {
      await addUser({
        name: newUserName.trim(),
        photo_uri: newUserPhoto,
      });
      
      setNewUserName('');
      setNewUserPhoto('');
      setShowAddUserModal(false);
      Alert.alert('成功', '用户添加成功！');
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('错误', '添加用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAddUser = () => {
    setNewUserName('');
    setNewUserPhoto('');
    setShowAddUserModal(false);
  };

  const menuItems = [
    {
      title: '数据统计',
      description: '查看您的衣柜数据分析',
      icon: 'chart-line',
      onPress: () => navigation.navigate('Statistics')
    },
    {
      title: '购物清单',
      description: '查看推荐购买的衣物',
      icon: 'shopping',
      onPress: () => navigation.navigate('ShoppingList')
    }
  ];

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.contentContainer}>
      {/* 用户管理卡片 */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={commonStyles.sectionTitle}>用户管理</Title>
            <Button
              mode="outlined"
              onPress={handleAddUser}
              icon="plus"
              style={commonStyles.secondaryButton}
            >
              添加
            </Button>
          </View>
          
          {users.length > 0 ? (
            <View style={styles.usersList}>
              {users.map((user, index) => (
                                  <View key={user.id}>
                    <View style={commonStyles.userItem}>
                      {user.photo_uri ? (
                        <Avatar.Image
                          size={50}
                          source={{ uri: user.photo_uri }}
                          style={commonStyles.userAvatar}
                        />
                      ) : (
                        <Avatar.Icon
                          size={50}
                          icon="account"
                          style={commonStyles.userAvatar}
                        />
                      )}
                      <View style={commonStyles.userInfo}>
                        <Text style={commonStyles.userName}>{user.name}</Text>
                        <Text style={commonStyles.userSubtext}>
                          创建于 {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.userActions}>
                        <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                    {index < users.length - 1 && <Divider style={commonStyles.divider} />}
                  </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyUsers}>
              <Ionicons name="person-add-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyUsersText}>还没有添加用户</Text>
              <Text style={styles.emptyUsersSubtext}>添加用户后可以为不同人生成个性化穿搭推荐</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 统计信息卡片 */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <Title style={commonStyles.sectionTitle}>数据概览</Title>
          
          <View style={commonStyles.statsContainer}>
            <View style={commonStyles.statItem}>
              <Text style={commonStyles.statNumber}>{stats.totalClothes}</Text>
              <Text style={commonStyles.statLabel}>件衣物</Text>
            </View>
            <View style={commonStyles.statItem}>
              <Text style={commonStyles.statNumber}>{stats.totalOutfits}</Text>
              <Text style={commonStyles.statLabel}>套穿搭</Text>
            </View>
            <View style={commonStyles.statItem}>
              <Text style={commonStyles.statNumber}>{users.length}</Text>
              <Text style={commonStyles.statLabel}>个用户</Text>
            </View>
          </View>

          {stats.categories.length > 0 && (
            <View style={styles.categoriesSection}>
              <Text style={styles.categoriesTitle}>分类统计</Text>
              {stats.categories.slice(0, 3).map((category) => (
                <View key={category.name} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.count} 件</Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 功能菜单 */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <Title style={commonStyles.sectionTitle}>功能菜单</Title>
          
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <View key={item.title}>
                <List.Item
                  title={item.title}
                  description={item.description}
                  left={props => <List.Icon {...props} icon={item.icon} color={theme.colors.primary} />}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={item.onPress}
                  style={styles.menuItem}
                />
                {index < menuItems.length - 1 && <Divider />}
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* 添加用户模态框 */}
      <Portal>
        <Modal
          visible={showAddUserModal}
          onDismiss={handleCancelAddUser}
          contentContainerStyle={commonStyles.modal}
        >
          <Title style={commonStyles.modalTitle}>添加新用户</Title>
          
          <TouchableOpacity onPress={pickUserPhoto} style={styles.photoSelector}>
            {newUserPhoto ? (
              <Image source={{ uri: newUserPhoto }} style={styles.selectedPhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color={theme.colors.textSecondary} />
                <Text style={styles.photoPlaceholderText}>点击添加照片</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            label="用户名称"
            value={newUserName}
            onChangeText={setNewUserName}
            style={commonStyles.formInput}
            mode="outlined"
          />

          <View style={commonStyles.buttonRow}>
            <Button
              mode="outlined"
              onPress={handleCancelAddUser}
              style={[commonStyles.secondaryButton, commonStyles.buttonHalf]}
            >
              取消
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveUser}
              loading={loading}
              disabled={loading}
              style={[commonStyles.primaryButton, commonStyles.buttonHalf]}
            >
              保存
            </Button>
          </View>
        </Modal>
      </Portal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 头部区域
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  // 用户管理特有样式
  usersList: {
    marginTop: theme.spacing.sm,
  },

  userActions: {
    padding: theme.spacing.sm,
  },

  emptyUsers: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },

  emptyUsersText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  emptyUsersSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // 分类统计特有样式
  categoriesSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: theme.spacing.md,
  },

  categoriesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },

  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },

  categoryName: {
    fontSize: 12,
    color: theme.colors.text,
  },

  categoryCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // 菜单特有样式
  menuList: {
    marginTop: theme.spacing.sm,
  },

  menuItem: {
    paddingHorizontal: 0,
  },

  // 照片选择器特有样式
  photoSelector: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },

  selectedPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },

  photoPlaceholderText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

export default ProfileScreen; 