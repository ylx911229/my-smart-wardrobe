import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useDatabase } from '../services/DatabaseContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProfileStackParamList, ClothingItem, Outfit } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type StatisticsScreenNavigationProp = StackNavigationProp<
  ProfileStackParamList,
  'Statistics'
>;

interface StatisticsScreenProps {
  navigation: StatisticsScreenNavigationProp;
}

interface CategoryStat {
  id: number;
  name: string;
  color: string;
  count: number;
  percentage: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  color?: string;
  subtitle?: string;
}

interface CategoryBarProps {
  category: CategoryStat;
}

const StatisticsScreen = ({ navigation }: StatisticsScreenProps) => {
  const { clothing, outfits } = useDatabase();
  const [statistics, setStatistics] = useState({
    totalClothes: 0,
    totalOutfits: 0,
    categoryStats: [] as CategoryStat[],
    activityStats: {
      active: 0,
      inactive: 0,
    },
    recentAdditions: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, [clothing, outfits]);

  const loadStatistics = () => {
    try {
      // 模拟分类数据
      const categories = [
        { id: 1, name: '上衣', color: '#FF6B6B' },
        { id: 2, name: '下装', color: '#4ECDC4' },
        { id: 3, name: '外套', color: '#45B7D1' },
        { id: 4, name: '鞋子', color: '#96CEB4' },
        { id: 5, name: '配饰', color: '#FECA57' },
      ];

      // 计算分类统计
      const categoryStats = categories.map((category) => {
        const count = clothing.filter((item: ClothingItem) => item.category === category.name).length;
        return {
          ...category,
          count,
          percentage: clothing.length > 0 ? (count / clothing.length * 100).toFixed(1) : '0',
        };
      });

      // 计算活跃度统计
      const activeClothes = clothing.filter((item: ClothingItem) => (item.activity_score || 0) > 0).length;
      const inactiveClothes = clothing.length - activeClothes;

      // 计算本月新增
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const recentAdditions = clothing.filter((item: ClothingItem) => 
        new Date(item.createdAt).getTime() >= thisMonth.getTime()
      ).length;

      setStatistics({
        totalClothes: clothing.length,
        totalOutfits: outfits.length,
        categoryStats: categoryStats.sort((a, b) => b.count - a.count),
        activityStats: {
          active: activeClothes,
          inactive: inactiveClothes,
        },
        recentAdditions,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const StatCard = ({ title, value, icon, color = theme.colors.primary, subtitle }: StatCardProps) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statLeft}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const CategoryBar = ({ category }: CategoryBarProps) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryCount}>{category.count}</Text>
      </View>
      <View style={styles.categoryBarContainer}>
        <View 
          style={[
            styles.categoryBar, 
            { 
              width: `${category.percentage}%` as any,
              backgroundColor: category.color 
            }
          ]} 
        />
      </View>
      <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>数据统计</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 总览统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>总览</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="衣物总数" 
              value={statistics.totalClothes} 
              icon="shirt-outline"
              color="#FF6B6B"
            />
            <StatCard 
              title="穿搭记录" 
              value={statistics.totalOutfits} 
              icon="albums-outline"
              color="#4ECDC4"
            />
            <StatCard 
              title="活跃衣物" 
              value={statistics.activityStats.active} 
              icon="trending-up-outline"
              color="#45B7D1"
              subtitle={`${statistics.activityStats.inactive} 件闲置`}
            />
            <StatCard 
              title="本月新增" 
              value={statistics.recentAdditions} 
              icon="add-circle-outline"
              color="#96CEB4"
            />
          </View>
        </View>

        {/* 分类统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>分类分布</Text>
          <View style={styles.categoryStats}>
            {statistics.categoryStats.map((category, index) => (
              <CategoryBar key={index} category={category} />
            ))}
          </View>
        </View>

        {/* 活跃度分析 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>活跃度分析</Text>
          <View style={styles.activityChart}>
            <View style={styles.activityItem}>
              <View style={[styles.activityBar, { backgroundColor: '#4ECDC4' }]}>
                <View 
                  style={[
                    styles.activityFill,
                    { 
                      width: statistics.totalClothes > 0 
                        ? `${(statistics.activityStats.active / statistics.totalClothes) * 100}%` 
                        : '0%',
                      backgroundColor: '#4ECDC4'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.activityLabel}>
                活跃衣物: {statistics.activityStats.active} 件
              </Text>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityBar, { backgroundColor: '#FFE66D' }]}>
                <View 
                  style={[
                    styles.activityFill,
                    { 
                      width: statistics.totalClothes > 0 
                        ? `${(statistics.activityStats.inactive / statistics.totalClothes) * 100}%` 
                        : '0%',
                      backgroundColor: '#FFE66D'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.activityLabel}>
                闲置衣物: {statistics.activityStats.inactive} 件
              </Text>
            </View>
          </View>
        </View>

        {/* 使用建议 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>智能建议</Text>
          <View style={styles.suggestions}>
            {statistics.activityStats.inactive > 5 && (
              <View style={styles.suggestion}>
                <Ionicons name="bulb-outline" size={20} color="#FFB347" />
                <Text style={styles.suggestionText}>
                  您有 {statistics.activityStats.inactive} 件闲置衣物，考虑整理一下衣柜？
                </Text>
              </View>
            )}
            {statistics.recentAdditions > 3 && (
              <View style={styles.suggestion}>
                <Ionicons name="trending-up-outline" size={20} color="#4ECDC4" />
                <Text style={styles.suggestionText}>
                  本月新增了 {statistics.recentAdditions} 件衣物，搭配潜力很大！
                </Text>
              </View>
            )}
            {statistics.totalOutfits < 5 && (
              <View style={styles.suggestion}>
                <Ionicons name="camera-outline" size={20} color="#FF6B6B" />
                <Text style={styles.suggestionText}>
                  记录更多穿搭，可以获得更精准的搭配建议哦
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLeft: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryStats: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  categoryCount: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginLeft: 4,
  },
  categoryBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    width: 40,
    textAlign: 'right',
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  activityChart: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    marginBottom: 16,
  },
  activityBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    borderRadius: 4,
  },
  activityLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  suggestions: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default StatisticsScreen; 