export interface ClothingImageInput {
  imageUri: string;
  imageBase64?: string;
  category: string;
  position: string;
  name: string;
}

export interface CompositionOptions {
  model?: string;
  mode?: string;
  width?: number;
  height?: number;
  sample_strength?: number;
  compositionSettings?: CompositionSettings;
}

export interface CompositionSettings {
  preserveBaseStructure?: boolean;
  blendMode?: string;
  lightingAdjustment?: boolean;
}

export interface AIGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    baseImage?: string;
    clothingCount?: number;
    prompt?: string;
    model?: string;
    mode?: string;
    timestamp?: string;
    processingTime?: string;
    fallback?: boolean;
    response?: string;
    size?: string;
  };
}

export interface JimengAIRequest {
  prompt: string;
  filePath?: string;
  model?: string;
  width?: number;
  height?: number;
  sample_strength?: number;
  additionalImages?: string[];
}

export interface JimengAIResponse {
  imageUrl?: string;
  processingTime?: string;
}

export interface ComposeImageRequest {
  baseImageUri?: string;
  baseImageBase64: string;
  clothingImages: ClothingImageInput[];
  prompt: string;
  model?: string;
  mode?: string;
  width?: number;
  height?: number;
  sample_strength?: number;
  compositionSettings?: CompositionSettings;
}

export interface GenerateImageRequest {
  prompt: string;
  filePath: string;
  model?: string;
  width?: number;
  height?: number;
  sample_strength?: number;
}

export interface ClothingPosition {
  name: string;
  categories: string[];
}

export interface ClothingPositionsResponse {
  positions: Record<string, ClothingPosition>;
  supportedFormats: string[];
  recommendedSize: {
    width: number;
    height: number;
  };
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    'text-to-image': string;
    'image-composition': string;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
}

// 新增：图片分析相关类型
export interface ClothingAnalysisRequest {
  imageBase64: string;
  category?: string;
  name?: string;
}

export interface ClothingAnalysisResult {
  success: boolean;
  analysis?: {
    // 基础信息
    colors: string[];
    materials: string[];
    patterns: string[];
    
    // 适用条件
    temperatureRange: {
      min: number;
      max: number;
    };
    weatherConditions: string[];
    seasons: string[];
    
    // 风格属性
    styles: string[];
    occasions: string[];
    formalityLevel: number;
    
    // 人群属性
    gender: 'male' | 'female' | 'unisex';
    ageGroups: string[];
    bodyTypes: string[];
    
    // 搭配建议
    matchingColors: string[];
    avoidColors: string[];
    
    // 分析状态
    confidence: number;
    analyzedAt: string;
  };
  error?: string;
} 