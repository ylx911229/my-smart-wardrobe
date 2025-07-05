import * as FileSystem from 'expo-file-system';
import { ClothingTags } from '../types';

export interface ClothingAnalysisRequest {
  imageBase64: string;
  category?: string;
  name?: string;
}

export interface ClothingAnalysisResult {
  success: boolean;
  analysis?: ClothingTags;
  error?: string;
}

const ANALYSIS_API_URL = 'http://localhost:3001/api/analyze-clothing';

/**
 * 将图片URI转换为Base64
 */
async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('图片转换失败');
  }
}

/**
 * 分析衣物图片
 */
export async function analyzeClothingImage(
  imageUri: string,
  category?: string,
  name?: string
): Promise<ClothingAnalysisResult> {
  try {
    console.log('开始分析衣物图片:', { imageUri, category, name });
    
    // 转换图片为Base64
    const imageBase64 = await convertImageToBase64(imageUri);
    
    // 构建请求
    const request: ClothingAnalysisRequest = {
      imageBase64,
      category,
      name
    };
    
    // 发送请求
    const response = await fetch(ANALYSIS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.analysis) {
      // 转换分析结果为客户端格式
      const analysisResult: ClothingAnalysisResult = {
        success: true,
        analysis: {
          ...result.analysis,
          aiAnalyzed: true
        }
      };
      
      console.log('分析成功:', analysisResult);
      return analysisResult;
    } else {
      console.error('分析失败:', result.error);
      return {
        success: false,
        error: result.error || '分析失败'
      };
    }
    
  } catch (error) {
    console.error('分析请求错误:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误'
    };
  }
}

/**
 * 生成默认标签（当AI分析失败时使用）
 */
export function generateDefaultTags(
  category?: string,
  name?: string
): ClothingTags {
  return {
    colors: [],
    materials: [],
    patterns: [],
    temperatureRange: {
      min: 0,
      max: 30
    },
    weatherConditions: ['晴天'],
    seasons: ['全季'],
    styles: ['休闲'],
    occasions: ['日常'],
    formalityLevel: 2,
    gender: 'unisex',
    ageGroups: ['青年'],
    bodyTypes: ['标准'],
    matchingColors: [],
    avoidColors: [],
    aiAnalyzed: false,
    confidence: 0.5,
    analyzedAt: new Date().toISOString()
  };
} 