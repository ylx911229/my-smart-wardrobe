import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Menu,
  Text,
  Chip
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../styles/theme';
import { useDatabase } from '../services/DatabaseContext';

const AddClothingScreen = ({ navigation }) => {
  const { addClothing, getCategories } = useDatabase();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    photo_uri: '',
    brand: '',
    color: '',
    size: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    loadCategories();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // 请求相册权限
    const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaLibraryStatus.status !== 'granted') {
      Alert.alert('权限需求', '需要访问相册的权限来选择照片');
    }
    
    // 请求相机权限
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert('权限需求', '需要访问相机的权限来拍摄照片');
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryMenuVisible(false);
  };

  const handleImagePicker = () => {
    Alert.alert(
      '选择照片',
      '请选择获取照片的方式',
      [
        { text: '相机', onPress: () => pickImage('camera') },
        { text: '相册', onPress: () => pickImage('library') },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        // 检查相机权限
        const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
        if (cameraStatus.status !== 'granted') {
          const requestResult = await ImagePicker.requestCameraPermissionsAsync();
          if (requestResult.status !== 'granted') {
            Alert.alert('权限不足', '需要相机权限才能拍摄照片');
            return;
          }
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        // 检查相册权限
        const mediaLibraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (mediaLibraryStatus.status !== 'granted') {
          const requestResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (requestResult.status !== 'granted') {
            Alert.alert('权限不足', '需要相册权限才能选择照片');
            return;
          }
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        handleInputChange('photo_uri', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('错误', '获取照片失败，请重试');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('提示', '请输入衣物名称');
      return false;
    }
    
    if (!formData.photo_uri) {
      Alert.alert('提示', '请选择或拍摄衣物照片');
      return false;
    }
    
    if (!selectedCategory) {
      Alert.alert('提示', '请选择衣物分类');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const clothingData = {
        ...formData,
        category_id: selectedCategory.id,
      };
      
      await addClothing(clothingData);
      
      Alert.alert(
        '成功',
        '衣物添加成功！',
        [{ text: '确定', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding clothing:', error);
      Alert.alert('错误', '添加衣物失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 照片选择区域 */}
      <Card style={styles.photoCard}>
        <TouchableOpacity onPress={handleImagePicker} style={styles.photoContainer}>
          {formData.photo_uri ? (
            <Image source={{ uri: formData.photo_uri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.photoPlaceholderText}>点击添加照片</Text>
            </View>
          )}
        </TouchableOpacity>
      </Card>

      {/* 基本信息 */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>基本信息</Title>
          
          <TextInput
            label="衣物名称 *"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            style={styles.input}
            mode="outlined"
          />

          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setCategoryMenuVisible(true)}
                style={styles.categorySelector}
              >
                <Text style={styles.categoryLabel}>分类 *</Text>
                <View style={styles.categoryValue}>
                  {selectedCategory ? (
                    <Chip>{selectedCategory.name}</Chip>
                  ) : (
                    <Text style={styles.categoryPlaceholder}>请选择分类</Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            }
          >
            {categories.map((category) => (
              <Menu.Item
                key={category.id}
                onPress={() => handleCategorySelect(category)}
                title={category.name}
              />
            ))}
          </Menu>

          <TextInput
            label="品牌"
            value={formData.brand}
            onChangeText={(text) => handleInputChange('brand', text)}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.row}>
            <TextInput
              label="颜色"
              value={formData.color}
              onChangeText={(text) => handleInputChange('color', text)}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
            />
            <TextInput
              label="尺码"
              value={formData.size}
              onChangeText={(text) => handleInputChange('size', text)}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
            />
          </View>

          <TextInput
            label="存放位置"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            style={styles.input}
            mode="outlined"
            placeholder="如：主卧衣柜、次卧抽屉等"
          />

          <TextInput
            label="备注"
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
        </Card.Content>
      </Card>

      {/* 提交按钮 */}
      <View style={styles.submitContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          添加衣物
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  
  photoCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  
  photoContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: theme.roundness,
  },
  
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  photoPlaceholderText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  
  formCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary,
  },
  
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  halfInput: {
    flex: 0.48,
  },
  
  categorySelector: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.background,
  },
  
  categoryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  
  categoryValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  categoryPlaceholder: {
    color: theme.colors.textSecondary,
  },
  
  submitContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
});

export default AddClothingScreen; 