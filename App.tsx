import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// 导入屏幕组件
import WardrobeScreen from './src/screens/WardrobeScreen';
import OutfitScreen from './src/screens/OutfitScreen';
import RecommendScreen from './src/screens/RecommendScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddClothingScreen from './src/screens/AddClothingScreen';
import ClothingDetailScreen from './src/screens/ClothingDetailScreen';
import OutfitDetailScreen from './src/screens/OutfitDetailScreen';
import CameraScreen from './src/screens/CameraScreen';
import ShoppingListScreen from './src/screens/ShoppingListScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

import { theme } from './src/styles/theme';
import { DatabaseProvider } from './src/services/DatabaseContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 衣柜相关页面堆栈
function WardrobeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.primary } }}>
      <Stack.Screen 
        name="WardrobeMain" 
        component={WardrobeScreen} 
        options={{ title: '我的衣柜' }}
      />
      <Stack.Screen 
        name="AddClothing" 
        component={AddClothingScreen} 
        options={{ title: '添加衣物' }}
      />
      <Stack.Screen 
        name="ClothingDetail" 
        component={ClothingDetailScreen as any} 
        options={{ title: '衣物详情' }}
      />
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen as any} 
        options={{ title: '拍照' }}
      />
    </Stack.Navigator>
  );
}

// 穿搭相关页面堆栈
function OutfitStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.primary } }}>
      <Stack.Screen 
        name="OutfitMain" 
        component={OutfitScreen} 
        options={{ title: '我的穿搭' }}
      />
      <Stack.Screen 
        name="OutfitDetail" 
        component={OutfitDetailScreen as any} 
        options={{ title: '穿搭详情' }}
      />
    </Stack.Navigator>
  );
}

// 个人资料相关页面堆栈
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.primary } }}>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: '个人中心' }}
      />
      <Stack.Screen 
        name="Statistics" 
        component={StatisticsScreen} 
        options={{ title: '数据统计' }}
      />
      <Stack.Screen 
        name="ShoppingList" 
        component={ShoppingListScreen} 
        options={{ title: '购物清单' }}
      />
    </Stack.Navigator>
  );
}

// 底部导航
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          if (route.name === 'Wardrobe') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'Outfit') {
            iconName = focused ? 'body' : 'body-outline';
          } else if (route.name === 'Recommend') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Wardrobe" 
        component={WardrobeStack} 
        options={{ title: '衣柜' }}
      />
      <Tab.Screen 
        name="Outfit" 
        component={OutfitStack} 
        options={{ title: '穿搭' }}
      />
      <Tab.Screen 
        name="Recommend" 
        component={RecommendScreen} 
        options={{ title: '推荐' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack} 
        options={{ title: '我的' }}
      />
    </Tab.Navigator>
  );
}

export default function App(): React.JSX.Element {
  return (
    <PaperProvider theme={theme}>
      <DatabaseProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <MainTabs />
        </NavigationContainer>
      </DatabaseProvider>
    </PaperProvider>
  );
} 