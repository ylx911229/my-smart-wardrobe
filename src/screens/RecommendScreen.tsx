import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Avatar,
  Text,
  IconButton
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { theme } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';
import { useDatabase } from '../services/DatabaseContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, ClothingItem, User } from '../types';

const { width } = Dimensions.get('window');

type RecommendScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Recommend'
>;

interface RecommendScreenProps {
  navigation: RecommendScreenNavigationProp;
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  description: string;
}

interface Recommendation {
  outfit: ClothingItem[];
  reason: string;
  weather: WeatherInfo | null;
}

const RecommendScreen = ({ navigation }: RecommendScreenProps) => {
  const { clothing, users, addOutfit } = useDatabase();
  
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [clothing]);

  useEffect(() => {
    // 设置默认用户
    if (users.length > 0 && !selectedUser) {
      const defaultUser = users.find(user => user.isDefault) || users[0];
      setSelectedUser(defaultUser);
    }
  }, [users, selectedUser]);

  const loadData = async () => {
    try {
      // 加载衣物数据
      setClothes(clothing);
      
      // 获取天气信息
      await getWeatherInfo();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getWeatherInfo = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeather({ temperature: 22, condition: '晴天', description: '位置权限未授予，显示默认天气' });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      // 模拟天气数据（实际应用应该调用天气API）
      const mockWeather = {
        temperature: Math.floor(Math.random() * 30) + 10,
        condition: ['晴天', '多云', '阴天', '小雨'][Math.floor(Math.random() * 4)],
        description: '今日天气适宜出行'
      };
      
      setWeather(mockWeather);
    } catch (error) {
      console.error('Error getting weather:', error);
      setWeather({ temperature: 22, condition: '晴天', description: '获取天气信息失败' });
    }
  };

  const generateRecommendation = async () => {
    if (!selectedUser || clothes.length === 0) {
      Alert.alert('提示', '请先添加用户和衣物');
      return;
    }

    setLoading(true);

    try {
      // 根据天气和季节生成推荐
      const seasonClothes = filterClothesBySeason();
      const weatherAppropriate = filterClothesByWeather(seasonClothes);
      
      // 按分类分组
      const categorizedClothes = groupClothesByCategory(weatherAppropriate);
      
      // 生成搭配
      const outfit = generateOutfit(categorizedClothes);
      
      if (outfit.length === 0) {
        Alert.alert('抱歉', '没有找到合适的搭配，请添加更多衣物');
        setLoading(false);
        return;
      }

      setRecommendation({
        outfit,
        reason: generateRecommendationReason(),
        weather: weather
      });

    } catch (error) {
      console.error('Error generating recommendation:', error);
      Alert.alert('错误', '生成推荐失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const filterClothesBySeason = () => {
    const currentMonth = new Date().getMonth() + 1;
    let season: string;
    
    if (currentMonth >= 3 && currentMonth <= 5) season = 'spring';
    else if (currentMonth >= 6 && currentMonth <= 8) season = 'summer';
    else if (currentMonth >= 9 && currentMonth <= 11) season = 'autumn';
    else season = 'winter';

    // 根据季节筛选衣物（这里简化处理）
    return clothes.filter(item => {
      if (season === 'summer') {
        return !item.name.includes('羽绒') && !item.name.includes('毛衣') && !item.name.includes('厚');
      } else if (season === 'winter') {
        return !item.name.includes('短袖') && !item.name.includes('短裤');
      }
      return true; // 春秋季节比较宽松
    });
  };

  const filterClothesByWeather = (clothesList: ClothingItem[]) => {
    if (!weather) return clothesList;

    const temp = weather.temperature;
    const condition = weather.condition;

    return clothesList.filter(item => {
      if (temp < 10) {
        // 寒冷天气
        return item.name.includes('厚') || item.name.includes('羽绒') || 
               item.name.includes('毛衣') || item.category_name === '外套';
      } else if (temp > 25) {
        // 炎热天气
        return item.name.includes('短') || item.name.includes('薄') ||
               !item.name.includes('厚') && !item.name.includes('长袖');
      }
      return true;
    });
  };

  const groupClothesByCategory = (clothesList: ClothingItem[]) => {
    const grouped: { [key: string]: ClothingItem[] } = {};
    clothesList.forEach(item => {
      const category = item.category_name || item.category || '其他';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  };

  const generateOutfit = (categorizedClothes: { [key: string]: ClothingItem[] }) => {
    const outfit: ClothingItem[] = [];
    
    // 基本搭配逻辑：上衣 + 下装 + 鞋子
    const priorities = ['上衣', '裤子', '裙子', '鞋子', '外套', '配饰'];
    
    priorities.forEach(category => {
      if (categorizedClothes[category] && categorizedClothes[category].length > 0) {
        // 优先选择活跃度高的衣物，但也有随机性
        const items = categorizedClothes[category];
        const weightedItems = items.map(item => ({
          ...item,
          weight: (item.activity_score || 0) + Math.random() * 50
        }));
        
        weightedItems.sort((a, b) => b.weight - a.weight);
        
        // 避免重复选择同类型（裤子和裙子只选一个）
        if (category === '裙子' && outfit.some(item => item.category_name === '裤子')) {
          return;
        }
        if (category === '裤子' && outfit.some(item => item.category_name === '裙子')) {
          return;
        }
        
        outfit.push(weightedItems[0]);
      }
    });

    return outfit.slice(0, 5); // 最多5件单品
  };

  const generateRecommendationReason = () => {
    const reasons = [];
    
    if (weather) {
      if (weather.temperature < 15) {
        reasons.push('今天气温较低，推荐保暖搭配');
      } else if (weather.temperature > 25) {
        reasons.push('今天天气炎热，推荐清爽搭配');
      } else {
        reasons.push('今天天气宜人，适合舒适搭配');
      }
      
      if (weather.condition.includes('雨')) {
        reasons.push('今天有雨，建议携带雨具');
      }
    }
    
    reasons.push('基于您的穿搭习惯和衣物活跃度推荐');
    
    return reasons.join('，');
  };

  const handleSaveOutfit = async () => {
    if (!recommendation || !selectedUser) return;

    try {
      const outfitData = {
        name: `${new Date().toLocaleDateString()}的推荐搭配`,
        user_id: selectedUser.id,
        clothingIds: recommendation.outfit.map(item => item.id),
        date: new Date().toISOString(),
        imageUri: '', // 可以生成拼图或让用户拍照
        occasion: '日常',
        weather: weather ? `${weather.temperature}°C ${weather.condition}` : '',
        notes: recommendation.reason,
        is_favorite: false,
        isVisible: true
      };

      await addOutfit(outfitData);

      Alert.alert('成功', '搭配已保存到我的穿搭中');
    } catch (error) {
      console.error('Error saving outfit:', error);
      Alert.alert('错误', '保存搭配失败，请重试');
    }
  };

  const renderClothingItem = (item: ClothingItem) => (
    <View key={item.id} style={styles.clothingItem}>
      <Image source={{ uri: item.imageUri || item.photo_uri || '' }} style={styles.clothingImage} />
      <View style={styles.clothingInfo}>
        <Text style={styles.clothingName}>{item.name}</Text>
        <Text style={styles.clothingCategory}>{item.category_name || item.category}</Text>
        {item.color && <Text style={styles.clothingDetail}>颜色: {item.color}</Text>}
        {item.brand && <Text style={styles.clothingDetail}>品牌: {item.brand}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView style={commonStyles.contentContainer}>
      {/* 天气信息 */}
      {weather && (
        <Card style={commonStyles.card}>
          <Card.Content>
            <View style={styles.weatherContent}>
              <View style={styles.weatherInfo}>
                <Title style={commonStyles.sectionTitle}>今日天气</Title>
                <View style={styles.weatherDetails}>
                  <Text style={styles.temperature}>{weather.temperature}°C</Text>
                  <Text style={styles.condition}>{weather.condition}</Text>
                </View>
                <Paragraph style={styles.weatherDescription}>
                  {weather.description}
                </Paragraph>
              </View>
              <Ionicons 
                name="partly-sunny" 
                size={60} 
                color={theme.colors.primary} 
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 用户选择 */}
      {users.length > 0 && (
        <Card style={commonStyles.card}>
          <Card.Content>
            <Title style={commonStyles.sectionTitle}>选择用户</Title>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.userScrollContainer}
            >
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => setSelectedUser(user)}
                  style={[
                    styles.userCard,
                    selectedUser?.id === user.id && styles.userCardSelected
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.avatarContainer,
                    selectedUser?.id === user.id && styles.avatarContainerSelected
                  ]}>
                    <Avatar.Image
                      size={50}
                      source={user.photo_uri ? { uri: user.photo_uri } : { uri: 'https://via.placeholder.com/50' }}
                      style={styles.avatarImage}
                    />
                  </View>
                  <Text style={[
                    styles.userCardName,
                    selectedUser?.id === user.id && styles.userCardNameSelected
                  ]} numberOfLines={1}>
                    {user.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {/* 推荐按钮 */}
      <Card style={commonStyles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={generateRecommendation}
            loading={loading}
            disabled={loading || !selectedUser}
            style={commonStyles.primaryButton}
            icon="star"
          >
            一键推荐今日穿搭
          </Button>
        </Card.Content>
      </Card>

      {/* 推荐结果 */}
      {recommendation && (
        <Card style={commonStyles.cardLarge}>
          <Card.Content>
            <View style={styles.recommendationHeader}>
              <Title style={commonStyles.sectionTitle}>为您推荐</Title>
              <View style={styles.recommendationActions}>
                <IconButton
                  icon="refresh"
                  onPress={generateRecommendation}
                  size={24}
                />
                <IconButton
                  icon="heart-outline"
                  onPress={handleSaveOutfit}
                  size={24}
                />
              </View>
            </View>
            
            <Paragraph style={styles.recommendationReason}>
              {recommendation.reason}
            </Paragraph>

            <View style={styles.outfitContainer}>
              {recommendation.outfit.map(renderClothingItem)}
            </View>

            <View style={commonStyles.buttonRow}>
              <Button
                mode="outlined"
                onPress={generateRecommendation}
                style={[commonStyles.secondaryButton, commonStyles.buttonHalf]}
              >
                重新推荐
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveOutfit}
                style={[commonStyles.primaryButton, commonStyles.buttonHalf]}
              >
                保存搭配
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 空状态 */}
      {clothes.length === 0 && (
        <View style={commonStyles.emptyState}>
          <Ionicons 
            name="shirt-outline" 
            size={64} 
            color={theme.colors.textSecondary} 
            style={commonStyles.emptyStateIcon}
          />
          <Text style={commonStyles.emptyStateTitle}>还没有衣物</Text>
          <Text style={commonStyles.emptyStateSubtitle}>
            添加一些衣物后就可以获得穿搭推荐了
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Wardrobe')}
            style={commonStyles.emptyStateButton}
          >
            去添加衣物
          </Button>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 天气卡片特有样式
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  weatherInfo: {
    flex: 1,
  },

  weatherDetails: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },

  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },

  condition: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },

  weatherDescription: {
    color: theme.colors.textSecondary,
  },

  // 用户选择特有样式
  userScrollContainer: {
    paddingVertical: theme.spacing.sm,
  },

  userCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.md,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.divider,
    minWidth: 80,
    ...theme.shadows.small,
  },

  userCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.cardBackground,
  },

  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },

  avatarContainerSelected: {
    borderColor: theme.colors.primary,
  },

  avatarImage: {
    borderRadius: 25,
  },

  userCardName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },

  userCardNameSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // 推荐结果特有样式
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  recommendationActions: {
    flexDirection: 'row',
  },

  recommendationReason: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },

  outfitContainer: {
    marginBottom: theme.spacing.md,
  },

  // 衣物项样式
  clothingItem: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.roundness,
  },

  clothingImage: {
    width: 60,
    height: 80,
    borderRadius: theme.roundness,
    marginRight: theme.spacing.md,
  },

  clothingInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  clothingName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },

  clothingCategory: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },

  clothingDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default RecommendScreen; 