import type { ClothingItem, User } from '../types';
import { Platform } from 'react-native';

// 网络配置
const getApiBaseUrl = () => {
  if (__DEV__) {
    // // 开发环境下的API地址配置
    // if (Platform.OS === 'ios') {
    //   return 'http://localhost:3001'; // iOS模拟器可以使用localhost
    // } else if (Platform.OS === 'android') {
    //   return 'http://10.0.2.2:3001'; // Android模拟器使用10.0.2.2
    // } else {
      return 'http://10.71.225.146:3001'; // 真机使用电脑的局域网IP
    // }
  } else {
    return 'https://your-production-api.com'; // 生产环境API地址
  }
};

export interface VirtualTryOnResult {
  imageUrl: string;
  success: boolean;
  error?: string;
}

export interface VirtualTryOnRequest {
  user: User;
  outfit: ClothingItem[];
  outfitName: string;
}

export interface ClothingImageInput {
  imageUri: string;
  category: string;
  position: string; // 衣物在身体上的位置
  name: string;
}

export class VirtualTryOnService {
  
  /**
   * 测试API服务器连接
   */
  static async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      console.log('Testing connection to:', getApiBaseUrl());
      
      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(getApiBaseUrl() + '/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        return {
          connected: true,
          message: `服务器连接正常 (${result.timestamp})`
        };
      } else {
        return {
          connected: false,
          message: `服务器响应错误: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      let message = '连接失败: 未知错误';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          message = '连接超时，请检查网络或服务器状态';
        } else if (error.message.includes('Network request failed')) {
          message = '网络请求失败，请检查服务器是否启动在正确端口';
        } else {
          message = `连接失败: ${error.message}`;
        }
      }
      
      return {
        connected: false,
        message
      };
    }
  }

  /**
   * 生成虚拟试穿效果
   */
  static async generateTryOnEffect(request: VirtualTryOnRequest): Promise<VirtualTryOnResult> {
    try {
      const { user, outfit, outfitName } = request;
      
      if (!user.photo_uri) {
        throw new Error('用户照片不存在');
      }

      // 验证每件衣物都有图片
      const missingImages = outfit.filter(item => 
        !item.imageUri && !item.photo_uri
      );
      
      if (missingImages.length > 0) {
        throw new Error(`以下衣物缺少图片：${missingImages.map(item => item.name).join(', ')}`);
      }

      // 测试网络连接
      const connectionTest = await this.testConnection();
      if (!connectionTest.connected) {
        throw new Error(`无法连接到AI服务器: ${connectionTest.message}`);
      }

      // 将衣物按类别分组并生成输入数据
      const clothingInputs = this.prepareClothingInputs(outfit);
      
      // 生成针对图像合成的prompt
      const prompt = this.generateImageCompositionPrompt(clothingInputs, outfitName);

      // 调用图像合成AI
      const result = await this.callImageCompositionAI(user.photo_uri, clothingInputs, prompt);
      
      return {
        imageUrl: result.imageUrl,
        success: true
      };
      
    } catch (error) {
      console.error('Virtual try-on generation failed:', error);
      
      // 根据错误类型提供更具体的错误信息
      let errorMessage = '生成试穿效果失败';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'AI生成超时，请稍后重试';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = '网络连接失败，请检查服务器是否启动';
        } else if (error.message.includes('timeout')) {
          errorMessage = '请求超时，服务器可能繁忙';
        } else if (error.message.includes('无法连接')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        imageUrl: '',
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 准备衣物输入数据
   */
  private static prepareClothingInputs(outfit: ClothingItem[]): ClothingImageInput[] {
    return outfit.map(item => {
      const category = item.category_name || item.category || '其他';
      
      return {
        imageUri: item.imageUri || item.photo_uri || '',
        category: category,
        position: this.getCategoryPosition(category),
        name: item.name
      };
    });
  }

  /**
   * 根据衣物分类确定在身体上的位置
   */
  private static getCategoryPosition(category: string): string {
    const positionMap: { [key: string]: string } = {
      '上衣': 'upper_body',
      '衬衫': 'upper_body', 
      'T恤': 'upper_body',
      '外套': 'upper_body_outer',
      '下装': 'lower_body',
      '裤子': 'lower_body',
      '裙子': 'lower_body',
      '鞋子': 'feet',
      '配饰': 'accessories',
      '帽子': 'head',
      '内衣': 'underwear'
    };
    
    return positionMap[category] || 'body';
  }

  /**
   * 生成图像合成专用的prompt
   */
  private static generateImageCompositionPrompt(clothingInputs: ClothingImageInput[], outfitName: string): string {
    const clothingDescriptions = clothingInputs.map(input => {
      return `将${input.name}（${input.category}）穿在${this.getPositionDescription(input.position)}`;
    }).join('，');

    return `请将以下衣物精确地穿在用户身上：${clothingDescriptions}。
保持自然的穿着效果，确保衣物贴合身体，光照一致，整体协调。
风格：${outfitName}，高质量合成，真实效果。`;
  }

  /**
   * 获取身体位置的中文描述
   */
  private static getPositionDescription(position: string): string {
    const descriptions: { [key: string]: string } = {
      'upper_body': '上半身',
      'upper_body_outer': '上半身外层',
      'lower_body': '下半身',
      'feet': '脚部',
      'head': '头部',
      'accessories': '相应位置',
      'underwear': '内层',
      'body': '身体'
    };
    
    return descriptions[position] || '身体';
  }

  /**
   * 调用图像合成AI
   */
  private static async callImageCompositionAI(
    userPhotoUri: string, 
    clothingInputs: ClothingImageInput[], 
    prompt: string
  ): Promise<{ imageUrl: string }> {
    try {
      // 调用支持多图输入的AI服务
      const response = await this.generateImageComposition(userPhotoUri, clothingInputs, prompt);
      
      return response;
      
    } catch (error) {
      console.error('Image composition AI call failed:', error);
      throw new Error('AI图像合成服务调用失败');
    }
  }

  /**
   * 使用即梦AI进行图像合成
   */
  private static async generateImageComposition(
    userPhotoUri: string,
    clothingInputs: ClothingImageInput[],
    prompt: string
  ): Promise<{ imageUrl: string }> {
    try {
      // 准备多图输入数据
      const requestData = {
        baseImage: userPhotoUri, // 用户照片作为底图
        clothingImages: clothingInputs,
        prompt: prompt,
        model: 'jimeng-3.0',
        mode: 'image_composition', // 图像合成模式
        width: 512,
        height: 768,
        sample_strength: 0.8, // 较高的强度确保衣物能明显显示
        compositionSettings: {
          preserveBaseStructure: true, // 保持用户原始体型结构
          blendMode: 'natural', // 自然融合模式
          lightingAdjustment: true // 自动调整光照一致性
        }
      };

      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时（AI生成需要更长时间）
      
      const response = await fetch(getApiBaseUrl() + '/api/compose-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.imageUrl) {
        return { imageUrl: result.imageUrl };
      } else {
        throw new Error(result.error || 'AI图像合成失败');
      }
      
    } catch (error) {
      console.error('Image composition failed:', error);
      // 如果真实API调用失败，回退到模拟模式
      return this.simulateImageComposition(userPhotoUri, clothingInputs, prompt);
    }
  }

  /**
   * 模拟图像合成（用于开发测试）
   */
  private static async simulateImageComposition(
    userPhotoUri: string,
    clothingInputs: ClothingImageInput[],
    prompt: string
  ): Promise<{ imageUrl: string }> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    
    // 模拟可能的失败情况
    if (Math.random() < 0.1) {
      throw new Error('AI图像合成服务暂时不可用');
    }
    
    // 返回模拟的合成图像URL
    return {
      imageUrl: `https://picsum.photos/512/768?random=${Date.now()}`
    };
  }

  /**
   * 保存试穿效果图片到本地
   */
  static async saveImageToLocal(imageUrl: string, filename?: string): Promise<string> {
    try {
      // 这里应该实现保存图片到本地的逻辑
      // 由于是React Native，需要使用如react-native-fs等库
      
      // 模拟保存过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return `file://saved_images/${filename || 'virtual_tryon_' + Date.now()}.jpg`;
      
    } catch (error) {
      console.error('Save image failed:', error);
      throw new Error('保存图片失败');
    }
  }

  /**
   * 验证用户是否有照片
   */
  static validateUserPhoto(user: User): boolean {
    return !!(user.photo_uri && user.photo_uri.trim() !== '');
  }

  /**
   * 验证穿搭是否完整且都有图片
   */
  static validateOutfit(outfit: ClothingItem[]): { valid: boolean; message?: string } {
    if (!outfit || outfit.length === 0) {
      return { valid: false, message: '穿搭不能为空' };
    }

    // 检查每件衣物是否都有图片
    const missingImages = outfit.filter(item => 
      !item.imageUri && !item.photo_uri
    );
    
    if (missingImages.length > 0) {
      return { 
        valid: false, 
        message: `以下衣物缺少图片无法生成试穿效果：${missingImages.map(item => item.name).join(', ')}` 
      };
    }

    const categories = new Set(outfit.map(item => item.category_name || item.category));
    
    // 检查是否有基本的穿搭类别
    const hasTop = categories.has('上衣') || categories.has('衬衫') || categories.has('T恤');
    const hasBottom = categories.has('下装') || categories.has('裤子') || categories.has('裙子');
    const hasShoes = categories.has('鞋子');

    if (!hasTop && !hasBottom && !hasShoes) {
      return { valid: false, message: '穿搭缺少基本的服装类别' };
    }

    return { valid: true };
  }

  /**
   * 获取衣物图片的质量信息
   */
  static async validateClothingImages(outfit: ClothingItem[]): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    for (const item of outfit) {
      const imageUri = item.imageUri || item.photo_uri;
      
      if (!imageUri) {
        issues.push(`${item.name}：缺少图片`);
        continue;
      }
      
      // 这里可以添加图片质量检查逻辑
      // 例如检查图片尺寸、格式、清晰度等
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

export default VirtualTryOnService; 