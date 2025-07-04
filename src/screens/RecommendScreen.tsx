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

import { theme } from '../styles/theme';
import { commonStyles } from '../styles/commonStyles';
import { useDatabase } from '../services/DatabaseContext';
import VirtualTryOn from '../components/VirtualTryOn';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, ClothingItem, User } from '../types';
import { WeatherInfo } from '../services/WeatherService';
import { useWeather } from '../services/WeatherContext';

const { width } = Dimensions.get('window');

type RecommendScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Recommend'
>;

interface RecommendScreenProps {
  navigation: RecommendScreenNavigationProp;
}

interface Recommendation {
  name: string;
  outfit: ClothingItem[];
  reason: string;
  weather: WeatherInfo | null;
}

const RecommendScreen = ({ navigation }: RecommendScreenProps) => {
  const { clothing, users, addOutfit, refreshData, isLoading } = useDatabase();
  const { weather, isLoading: isWeatherLoading, refreshWeather } = useWeather();
  
  const [filteredClothes, setFilteredClothes] = useState<ClothingItem[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRecommendationFavorited, setIsRecommendationFavorited] = useState(false);
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);

  // 只在组件初始化时加载一次数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await refreshData();
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
  }, []); // 空依赖数组，只执行一次

  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users]);

  // 生成新推荐时重置收藏状态
  useEffect(() => {
    setIsRecommendationFavorited(false);
  }, [recommendation]);

  const generateRecommendation = async () => {
    if (!selectedUser || clothing.length === 0) {
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
        // 检查缺少哪些基本分类
        const missingCategories = [];
        const requiredCategories = {
          '上衣': ['上衣'],
          '下装': ['下装', '裤子', '裙子'],
          '鞋子': ['鞋子']
        };
        
        for (const [requiredType, categoryNames] of Object.entries(requiredCategories)) {
          let hasAny = false;
          for (const categoryName of categoryNames) {
            if (categorizedClothes[categoryName] && categorizedClothes[categoryName].length > 0) {
              hasAny = true;
              break;
            }
          }
          if (!hasAny) {
            missingCategories.push(requiredType);
          }
        }
        
        const missingText = missingCategories.length > 0 
          ? `缺少以下分类的衣物：${missingCategories.join('、')}`
          : '没有找到合适的搭配';
          
        Alert.alert('无法生成搭配', `${missingText}。请添加更多衣物后重试。`);
        setLoading(false);
        return;
      }

      setRecommendation({
        name: generateOutfitName(outfit),
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
    return clothing.filter(item => {
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
    
    // 定义必需的基本分类
    const requiredCategories = {
      '上衣': ['上衣'],
      '下装': ['下装', '裤子', '裙子'], // 下装可以是下装、裤子或裙子
      '鞋子': ['鞋子']
    };
    
    // 可选分类
    const optionalCategories = ['外套', '配饰', '内衣'];
    
    // 确保每个必需分类都有至少一件衣物
    for (const [requiredType, categoryNames] of Object.entries(requiredCategories)) {
      let selectedItem: ClothingItem | null = null;
      let allCandidates: ClothingItem[] = [];
      
      // 收集所有候选衣物
      for (const categoryName of categoryNames) {
        if (categorizedClothes[categoryName] && categorizedClothes[categoryName].length > 0) {
          allCandidates.push(...categorizedClothes[categoryName]);
        }
      }
      
      if (allCandidates.length === 0) {
        // 如果没有找到必需分类的衣物，搭配失败
        console.log(`没有找到 ${requiredType} 分类的衣物`);
        return []; // 返回空数组表示搭配失败
      }
      
      // 选择活跃度最高的衣物（加上随机性）
      const weightedItems = allCandidates.map(item => ({
        ...item,
        weight: (item.activity_score || 0) + Math.random() * 30
      }));
      
      weightedItems.sort((a, b) => b.weight - a.weight);
      selectedItem = weightedItems[0];
      
      if (selectedItem) {
        outfit.push(selectedItem);
      }
    }
    
    // 添加可选分类的衣物
    optionalCategories.forEach(category => {
      if (categorizedClothes[category] && categorizedClothes[category].length > 0) {
        const items = categorizedClothes[category];
        const weightedItems = items.map(item => ({
          ...item,
          weight: (item.activity_score || 0) + Math.random() * 20
        }));
        
        weightedItems.sort((a, b) => b.weight - a.weight);
        
        // 随机决定是否添加可选单品（70%概率）
        if (Math.random() > 0.3 && outfit.length < 5) {
          outfit.push(weightedItems[0]);
        }
      }
    });

    return outfit;
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
    
    // 检查搭配的完整性
    if (recommendation && recommendation.outfit.length >= 3) {
      const categories = new Set(recommendation.outfit.map(item => 
        item.category_name || item.category || '其他'
      ));
      
      if (categories.has('上衣') && (categories.has('下装') || categories.has('裤子') || categories.has('裙子')) && categories.has('鞋子')) {
        reasons.push('为您搭配了完整的上衣、下装和鞋子组合');
      }
      
      if (categories.has('外套')) {
        reasons.push('搭配了外套增强层次感');
      }
      
      if (categories.has('配饰')) {
        reasons.push('添加了配饰让整体更加精致');
      }
    }
    
    reasons.push('基于您的穿搭习惯和衣物活跃度推荐');
    
    return reasons.join('，') || '为您精心搭配的今日穿搭';
  };

  const generateOutfitName = (outfit: ClothingItem[]) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentHour = new Date().getHours();
    
    // 获取季节
    let season: string;
    if (currentMonth >= 3 && currentMonth <= 5) season = '春';
    else if (currentMonth >= 6 && currentMonth <= 8) season = '夏';
    else if (currentMonth >= 9 && currentMonth <= 11) season = '秋';
    else season = '冬';
    
    // 获取时段
    let timeOfDay: string;
    if (currentHour < 10) timeOfDay = '清晨';
    else if (currentHour < 14) timeOfDay = '午间';
    else if (currentHour < 18) timeOfDay = '午后';
    else timeOfDay = '晚间';
    
    // 分析搭配风格
    const categories = outfit.map(item => item.category_name || item.category || '其他');
    const colors = outfit.map(item => item.color).filter(Boolean);
    const brands = outfit.map(item => item.brand).filter(Boolean);
    
    // 风格词汇库
    const styleWords = {
      casual: ['休闲', '舒适', '日常', '轻松'],
      formal: ['正式', '商务', '优雅', '精致'],
      sporty: ['运动', '活力', '动感', '青春'],
      chic: ['时尚', '潮流', '摩登', '个性'],
      cozy: ['温暖', '柔软', '惬意', '居家'],
      fresh: ['清新', '简约', '明朗', '干净']
    };
    
    // 天气相关词汇
    const weatherWords: string[] = [];
    if (weather) {
      if (weather.temperature < 10) weatherWords.push('保暖');
      else if (weather.temperature > 25) weatherWords.push('清爽');
      
      if (weather.condition.includes('晴')) weatherWords.push('阳光');
      else if (weather.condition.includes('雨')) weatherWords.push('雨日');
      else if (weather.condition.includes('云')) weatherWords.push('悠然');
    }
    
    // 根据衣物特征确定风格
    let styleCategory: keyof typeof styleWords = 'casual';
    if (categories.includes('外套') && (outfit.some(item => item.name.includes('西装') || item.name.includes('衬衫')))) {
      styleCategory = 'formal';
    } else if (outfit.some(item => item.name.includes('运动') || item.name.includes('休闲'))) {
      styleCategory = 'sporty';
    } else if (outfit.some(item => item.name.includes('毛衣') || item.name.includes('针织'))) {
      styleCategory = 'cozy';
    } else if (colors.includes('白色') && outfit.length <= 3) {
      styleCategory = 'fresh';
    } else if (brands.length > 0 || categories.includes('配饰')) {
      styleCategory = 'chic';
    }
    
    // 生成名称
    const styleWord = styleWords[styleCategory][Math.floor(Math.random() * styleWords[styleCategory].length)];
    const weatherWord = weatherWords.length > 0 ? weatherWords[Math.floor(Math.random() * weatherWords.length)] : '';
    
    // 名称模板
    const templates = [
      `${season}日${timeOfDay}${styleWord}搭配`,
      `${weatherWord}${season}日穿搭`,
      `${timeOfDay}${styleWord}Look`,
      `${season}季${styleWord}风格`,
      `今日${styleWord}造型`,
      `${weatherWord ? weatherWord + '天' : season + '日'}的${styleWord}搭配`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const handleSaveOutfit = async () => {
    if (!recommendation || !selectedUser) return;

    try {
      const outfitData = {
        name: recommendation.name,
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

  const handleFavoriteRecommendation = async () => {
    if (!recommendation || !selectedUser) return;

    try {
      const outfitData = {
        name: recommendation.name,
        user_id: selectedUser.id,
        clothingIds: recommendation.outfit.map(item => item.id),
        date: new Date().toISOString(),
        imageUri: '', // 可以生成拼图或让用户拍照
        occasion: '收藏',
        weather: weather ? `${weather.temperature}°C ${weather.condition}` : '',
        notes: recommendation.reason,
        is_favorite: true, // 直接设置为收藏
        isVisible: true
      };

      await addOutfit(outfitData);
      setIsRecommendationFavorited(true);

      Alert.alert('收藏成功', '推荐搭配已收藏到我的穿搭中');
    } catch (error) {
      console.error('Error favoriting recommendation:', error);
      Alert.alert('错误', '收藏失败，请重试');
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
      {/* 今日天气 */}
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
                <Text style={styles.weatherDescription}>{weather.description}</Text>
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
              {users.map((user: User) => (
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
                    {user.photo_uri ? (
                      <Avatar.Image
                        size={50}
                        source={{ uri: user.photo_uri }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Avatar.Icon
                        size={50}
                        icon="account"
                        style={styles.avatarImage}
                      />
                    )}
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
                  icon={isRecommendationFavorited ? "heart" : "heart-outline"}
                  onPress={isRecommendationFavorited ? undefined : handleFavoriteRecommendation}
                  size={24}
                  iconColor={isRecommendationFavorited ? theme.colors.error : theme.colors.text}
                />
              </View>
            </View>
            
            {/* 穿搭名称 */}
            <Text style={styles.outfitName}>{recommendation.name}</Text>
            
            <Paragraph style={styles.recommendationReason}>
              {recommendation.reason}
            </Paragraph>

            <View style={styles.outfitContainer}>
              {recommendation.outfit.map(renderClothingItem)}
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={generateRecommendation}
                style={[commonStyles.secondaryButton, styles.buttonThird]}
              >
                重新推荐
              </Button>
              <Button
                mode="contained"
                onPress={() => setShowVirtualTryOn(true)}
                style={[commonStyles.primaryButton, styles.buttonThird]}
                icon="shirt"
              >
                试穿效果
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveOutfit}
                style={[commonStyles.primaryButton, styles.buttonThird]}
              >
                保存搭配
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 空状态 */}
      {clothing.length === 0 && (
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

      {/* 虚拟试穿效果模态框 */}
      {recommendation && selectedUser && (
        <VirtualTryOn
          visible={showVirtualTryOn}
          onDismiss={() => setShowVirtualTryOn(false)}
          user={selectedUser}
          outfit={recommendation.outfit}
          outfitName={recommendation.name}
        />
      )}
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

  outfitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },

  // 试穿效果按钮容器
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },

  buttonThird: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});

export default RecommendScreen; 