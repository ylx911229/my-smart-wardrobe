import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity
} from 'react-native';
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
import { useDatabase } from '../services/DatabaseContext';

const ProfileScreen = ({ navigation }) => {
  const { getUsers, addUser, getClothes, getOutfits, isLoading: dbLoading } = useDatabase();
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalClothes: 0,
    totalOutfits: 0,
    categories: []
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhoto, setNewUserPhoto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dbLoading) {
      loadData();
    }
  }, [dbLoading]);

  const loadData = async () => {
    try {
      if (dbLoading) {
        return; // 如果数据库还在加载中，直接返回
      }
      
      const [usersData, clothesData, outfitsData] = await Promise.all([
        getUsers(),
        getClothes(),
        getOutfits()
      ]);
      
      setUsers(usersData);
      
      // 计算统计数据
      const categoryCount = {};
      clothesData.forEach(item => {
        const category = item.category_name || '其他';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      setStats({
        totalClothes: clothesData.length,
        totalOutfits: outfitsData.length,
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
      await addUser(newUserName.trim(), newUserPhoto);
      setNewUserName('');
      setNewUserPhoto('');
      setShowAddUserModal(false);
      loadData();
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
      icon: 'analytics-outline',
      onPress: () => navigation.navigate('Statistics')
    },
    {
      title: '清洗记录',
      description: '管理衣物清洗记录',
      icon: 'water-outline',
      onPress: () => navigation.navigate('WashRecord')
    },
    {
      title: '购物清单',
      description: '查看推荐购买的衣物',
      icon: 'bag-add-outline',
      onPress: () => navigation.navigate('ShoppingList')
    },
    {
      title: '设置',
      description: '应用设置和偏好',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings')
    },
    {
      title: '帮助与反馈',
      description: '使用帮助和问题反馈',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('Help')
    },
    {
      title: '关于',
      description: '关于智能衣柜应用',
      icon: 'information-circle-outline',
      onPress: () => navigation.navigate('About')
    }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 用户管理卡片 */}
      <Card style={styles.usersCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>用户管理</Title>
            <Button
              mode="outlined"
              onPress={handleAddUser}
              icon="plus"
              style={styles.addButton}
            >
              添加
            </Button>
          </View>
          
          {users.length > 0 ? (
            <View style={styles.usersList}>
              {users.map((user, index) => (
                <View key={user.id}>
                  <View style={styles.userItem}>
                    <Avatar.Image
                      size={50}
                      source={user.photo_uri ? { uri: user.photo_uri } : undefined}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userDate}>
                        创建于 {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.userActions}>
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {index < users.length - 1 && <Divider style={styles.userDivider} />}
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
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>数据概览</Title>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalClothes}</Text>
              <Text style={styles.statLabel}>件衣物</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalOutfits}</Text>
              <Text style={styles.statLabel}>套穿搭</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{users.length}</Text>
              <Text style={styles.statLabel}>个用户</Text>
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
      <Card style={styles.menuCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>功能菜单</Title>
          
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
          contentContainerStyle={styles.modal}
        >
          <Title style={styles.modalTitle}>添加新用户</Title>
          
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
            style={styles.userNameInput}
            mode="outlined"
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={handleCancelAddUser}
              style={styles.modalButton}
            >
              取消
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveUser}
              loading={loading}
              disabled={loading}
              style={styles.modalButton}
            >
              保存
            </Button>
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
    padding: theme.spacing.md,
  },

  usersCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  sectionTitle: {
    color: theme.colors.primary,
  },

  addButton: {
    borderColor: theme.colors.primary,
  },

  usersList: {
    marginTop: theme.spacing.sm,
  },

  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },

  userAvatar: {
    marginRight: theme.spacing.md,
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },

  userDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  userActions: {
    padding: theme.spacing.sm,
  },

  userDivider: {
    marginVertical: theme.spacing.sm,
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

  statsCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },

  statItem: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },

  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

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

  menuCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },

  menuList: {
    marginTop: theme.spacing.sm,
  },

  menuItem: {
    paddingHorizontal: 0,
  },

  modal: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.roundness,
  },

  modalTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },

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

  userNameInput: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  modalButton: {
    flex: 0.4,
  },
});

export default ProfileScreen; 