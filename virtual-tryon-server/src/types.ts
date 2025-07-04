export interface ClothingImageInput {
  imageUri: string;
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
  baseImage: string;
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