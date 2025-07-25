// 基础类型定义
export interface ClothingTags {
  // 基础信息
  colors: string[];           // 主要颜色
  materials: string[];        // 材质
  patterns: string[];         // 图案/款式
  
  // 适用条件
  temperatureRange: {         // 适合温度范围
    min: number;             // 最低温度
    max: number;             // 最高温度
  };
  weatherConditions: string[]; // 适合天气条件
  seasons: string[];          // 适合季节
  
  // 风格属性
  styles: string[];           // 风格标签
  occasions: string[];        // 适合场合
  formalityLevel: number;     // 正式程度 (1-5)
  
  // 人群属性
  gender: 'male' | 'female' | 'unisex'; // 性别适用
  ageGroups: string[];        // 适合年龄段
  bodyTypes: string[];        // 适合体型
  
  // 搭配建议
  matchingColors: string[];   // 搭配颜色
  avoidColors: string[];      // 避免颜色
  
  // 分析状态
  aiAnalyzed: boolean;        // 是否经过AI分析
  confidence: number;         // AI分析置信度
  analyzedAt?: string;        // 分析时间
}

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  category_id?: number;
  category_name?: string;
  category_color?: string;
  color: string;
  brand?: string;
  price?: number;
  purchaseDate?: string;
  photo_uri?: string;
  imageUri?: string;
  tags: string[];
  season: string;
  material?: string;
  size?: string;
  location?: string;
  isVisible: boolean;
  notes?: string;
  lastWorn?: string;
  wearCount: number;
  activity_score?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  
  // 新增：智能标签
  smartTags?: ClothingTags;
}

export interface Outfit {
  id: string;
  name: string;
  user_id?: string;
  clothingIds: string[];
  date: string;
  occasion?: string;
  weather?: string;
  photo_uri?: string;
  imageUri?: string;
  notes?: string;
  rating?: number;
  is_favorite?: boolean;
  isVisible: boolean;
  created_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedPrice?: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
  location: string;
}

export interface User {
  id: string;
  name: string;
  photo_uri?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  preferences: {
    favoriteColors: string[];
    preferredStyles: string[];
    sizes: {
      tops: string;
      bottoms: string;
      shoes: string;
    };
  };
  settings: {
    notifications: boolean;
    weatherUpdates: boolean;
    recommendations: boolean;
  };
}

// 导航类型定义
export type RootStackParamList = {
  Wardrobe: undefined;
  Outfit: undefined;
  Recommend: undefined;
  Profile: undefined;
};

export type WardrobeStackParamList = {
  WardrobeMain: undefined;
  AddClothing: { categoryFilter?: string };
  ClothingDetail: { clothing: ClothingItem };
  OutfitDetail: { outfit: Outfit };
  Camera: undefined;
};

export type OutfitStackParamList = {
  OutfitMain: undefined;
  OutfitDetail: { outfit: Outfit };
  ClothingDetail: { clothing: ClothingItem };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Statistics: undefined;
  ShoppingList: undefined;
};

export type RecommendStackParamList = {
  RecommendMain: undefined;
  ClothingDetail: { clothing: ClothingItem };
  OutfitDetail: { outfit: Outfit };
};

// 数据库上下文类型
export interface DatabaseContextType {
  isLoading: boolean;
  clothing: ClothingItem[];
  outfits: Outfit[];
  shoppingList: ShoppingItem[];
  users: User[];
  addClothing: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClothing: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  deleteClothing: (id: string) => Promise<void>;
  addOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOutfit: (id: string, updates: Partial<Outfit>) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  getOutfitsByClothing: (clothingId: string) => Outfit[];
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

// 组件属性类型
export interface ClothingCardProps {
  item: ClothingItem;
  onPress: (item: ClothingItem) => void;
  onLongPress?: (item: ClothingItem) => void;
  style?: any;
}

export interface EmptyStateProps {
  icon: any;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

// 常量类型
export const CLOTHING_CATEGORIES = [
  '上衣',
  '下装',
  '外套',
  '内衣',
  '鞋子',
  '配饰',
  '其他'
] as const;

export const SEASONS = [
  '春季',
  '夏季',
  '秋季',
  '冬季',
  '全季'
] as const;

export const OCCASIONS = [
  '日常',
  '工作',
  '聚会',
  '运动',
  '旅行',
  '正式',
  '其他'
] as const;

export type ClothingCategory = typeof CLOTHING_CATEGORIES[number];
export type Season = typeof SEASONS[number];
export type Occasion = typeof OCCASIONS[number]; 