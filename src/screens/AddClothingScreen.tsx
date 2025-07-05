import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Menu,
  Text,
  Chip,
  ProgressBar
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { theme } from '../styles/theme';
import { useDatabase } from '../services/DatabaseContext';
import { analyzeClothingImage, generateDefaultTags } from '../services/ClothingAnalysisService';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { WardrobeStackParamList, Category, ClothingTags } from '../types';

type AddClothingScreenNavigationProp = StackNavigationProp<
  WardrobeStackParamList,
  'AddClothing'
>;

interface AddClothingScreenProps {
  navigation: AddClothingScreenNavigationProp;
}

interface FormData {
  name: string;
  photo_uri: string;
  brand: string;
  color: string;
  size: string;
  location: string;
  notes: string;
}

const AddClothingScreen = ({ navigation }: AddClothingScreenProps) => {
  const { addClothing } = useDatabase();
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [smartTags, setSmartTags] = useState<ClothingTags | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
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
      // 使用预定义的分类列表
      const categoriesData: Category[] = [
        { id: '1', name: '上衣', color: '#FF6B6B' },
        { id: '2', name: '下装', color: '#4ECDC4' },
        { id: '3', name: '外套', color: '#45B7D1' },
        { id: '4', name: '鞋子', color: '#96CEB4' },
        { id: '5', name: '配饰', color: '#FFEAA7' },
        { id: '6', name: '其他', color: '#DDA0DD' }
      ];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (category: Category) => {
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

  const pickImage = async (source: 'camera' | 'library') => {
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
        const imageUri = result.assets[0].uri;
        handleInputChange('photo_uri', imageUri);
        
        // 自动分析图片
        await analyzeImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('错误', '获取照片失败，请重试');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 0.9) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 0.1;
        });
      }, 200);

      const analysisResult = await analyzeClothingImage(
        imageUri,
        selectedCategory?.name,
        formData.name
      );

      clearInterval(progressInterval);
      setAnalysisProgress(1);

      if (analysisResult.success && analysisResult.analysis) {
        setSmartTags(analysisResult.analysis);
        
        // 如果AI分析出了颜色，自动填充到表单
        if (analysisResult.analysis.colors.length > 0 && !formData.color) {
          handleInputChange('color', analysisResult.analysis.colors[0]);
        }
        
        Alert.alert(
          '分析完成',
          '已为您的衣物自动生成智能标签，包含颜色、风格、适合场合等信息。',
          [{ text: '确定' }]
        );
      } else {
        // 分析失败，使用默认标签
        const defaultTags = generateDefaultTags(selectedCategory?.name, formData.name);
        setSmartTags(defaultTags);
        
        Alert.alert(
          '分析失败',
          '图片分析失败，已为您生成基础标签。您可以手动编辑衣物信息。',
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      const defaultTags = generateDefaultTags(selectedCategory?.name, formData.name);
      setSmartTags(defaultTags);
      
      Alert.alert(
        '分析失败',
        '图片分析失败，已为您生成基础标签。您可以手动编辑衣物信息。',
        [{ text: '确定' }]
      );
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(0);
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
    if (!validateForm() || !selectedCategory) return;
    
    setLoading(true);
    
    try {
      const clothingData = {
        name: formData.name,
        category: selectedCategory.name,
        category_id: parseInt(selectedCategory.id),
        category_name: selectedCategory.name,
        category_color: selectedCategory.color,
        color: formData.color,
        brand: formData.brand,
        size: formData.size,
        location: formData.location,
        notes: formData.notes,
        photo_uri: formData.photo_uri,
        tags: [],
        season: '全季',
        isVisible: true,
        wearCount: 0,
        smartTags: smartTags || generateDefaultTags(selectedCategory.name, formData.name)
      };
      
      await addClothing(clothingData);
      
      Alert.alert(
        '成功',
        '衣物添加成功！' + (smartTags?.aiAnalyzed ? '已自动生成智能标签。' : ''),
        [{ text: '确定', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding clothing:', error);
      Alert.alert('错误', '添加衣物失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderSmartTagsPreview = () => {
    if (!smartTags) return null;

    return (
      <Card style={styles.smartTagsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>智能标签 {smartTags.aiAnalyzed ? '🤖' : '📝'}</Title>
          
          {smartTags.colors.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>颜色:</Text>
              <View style={styles.tagContainer}>
                {smartTags.colors.map((color, index) => (
                  <Chip key={index} style={styles.tag} compact>{color}</Chip>
                ))}
              </View>
            </View>
          )}
          
          {smartTags.styles.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>风格:</Text>
              <View style={styles.tagContainer}>
                {smartTags.styles.map((style, index) => (
                  <Chip key={index} style={styles.tag} compact>{style}</Chip>
                ))}
              </View>
            </View>
          )}
          
          {smartTags.occasions.length > 0 && (
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>适合场合:</Text>
              <View style={styles.tagContainer}>
                {smartTags.occasions.map((occasion, index) => (
                  <Chip key={index} style={styles.tag} compact>{occasion}</Chip>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.tagSection}>
            <Text style={styles.tagLabel}>适合温度:</Text>
            <Text style={styles.tagValue}>
              {smartTags.temperatureRange.min}°C - {smartTags.temperatureRange.max}°C
            </Text>
          </View>
          
          <View style={styles.tagSection}>
            <Text style={styles.tagLabel}>正式程度:</Text>
            <Text style={styles.tagValue}>
              {smartTags.formalityLevel}/5 {'⭐'.repeat(smartTags.formalityLevel)}
            </Text>
          </View>
          
          {smartTags.aiAnalyzed && (
            <View style={styles.tagSection}>
              <Text style={styles.tagLabel}>AI分析置信度:</Text>
              <Text style={styles.tagValue}>
                {Math.round(smartTags.confidence * 100)}%
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
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
        
        {/* 分析进度 */}
        {analyzing && (
          <View style={styles.analysisContainer}>
            <View style={styles.analysisHeader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.analysisText}>正在分析图片...</Text>
            </View>
            <ProgressBar progress={analysisProgress} color={theme.colors.primary} />
          </View>
        )}
      </Card>

      {/* 智能标签预览 */}
      {renderSmartTagsPreview()}

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
          disabled={loading || analyzing}
          style={styles.submitButton}
        >
          {analyzing ? '正在分析...' : '添加衣物'}
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
  
  analysisContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  analysisText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  smartTagsCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  
  tagSection: {
    marginBottom: theme.spacing.sm,
  },
  
  tagLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  
  tag: {
    backgroundColor: theme.colors.primary + '20',
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  
  tagValue: {
    fontSize: 14,
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