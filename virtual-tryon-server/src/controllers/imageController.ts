import { Request, Response } from 'express';
import { 
  ComposeImageRequest, 
  GenerateImageRequest, 
  ClothingPositionsResponse,
  HealthCheckResponse,
  ErrorResponse,
  ClothingImageInput,
  CompositionOptions,
  ClothingAnalysisRequest
} from '../types';
import { callOpenAIVirtualTryOn, analyzeClothingImage } from '../services/aiService';

/**
 * 图像合成API端点
 */
export async function composeImage(req: Request<{}, any, ComposeImageRequest>, res: Response): Promise<void> {
  try {
    const { 
      baseImageUri,
      baseImageBase64, 
      clothingImages, 
      prompt, 
      model, 
      mode,
      width, 
      height, 
      sample_strength,
      compositionSettings 
    } = req.body;
    
    // 验证必需参数
    if (!baseImageBase64) {
      res.status(400).json({
        success: false,
        error: '缺少用户照片的base64数据（baseImageBase64）'
      } as ErrorResponse);
      return;
    }
    
    if (!clothingImages || !Array.isArray(clothingImages) || clothingImages.length === 0) {
      res.status(400).json({
        success: false,
        error: '缺少衣物图片（clothingImages）'
      } as ErrorResponse);
      return;
    }
    
    if (!prompt) {
      res.status(400).json({
        success: false,
        error: '缺少合成提示词（prompt）'
      } as ErrorResponse);
      return;
    }
    
    // 验证衣物图片数据，确保都有base64数据
    for (let i = 0; i < clothingImages.length; i++) {
      const item = clothingImages[i];
      if (!item?.imageBase64 || !item?.category || !item?.position) {
        res.status(400).json({
          success: false,
          error: `衣物图片 ${i + 1} 缺少必要信息（imageBase64, category, position）`
        } as ErrorResponse);
        return;
      }
    }
    
    console.log('Processing image composition request...');
    console.log('Base image URI:', baseImageUri);
    console.log('Base image base64 length:', baseImageBase64.length);
    console.log('Clothing items:', clothingImages.length);
    console.log('Prompt:', prompt);
    console.log('Composition settings:', compositionSettings);
    
    const result = await callOpenAIVirtualTryOn(baseImageBase64, clothingImages, prompt, {
      model: model || 'jimeng-3.0',
      mode: mode || 'image_composition',
      width: width || 512,
      height: height || 768,
      sample_strength: sample_strength || 0.8,
      compositionSettings: compositionSettings || {}
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Image composition API error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    } as ErrorResponse);
  }
}

/**
 * 文字生成图像API端点（保留向后兼容）
 */
// export async function generateImage(req: Request<{}, any, GenerateImageRequest>, res: Response): Promise<void> {
//   try {
//     const { prompt, filePath, model, width, height, sample_strength } = req.body;
    
//     if (!prompt) {
//       res.status(400).json({
//         success: false,
//         error: '缺少prompt参数'
//       } as ErrorResponse);
//       return;
//     }
    
//     if (!filePath) {
//       res.status(400).json({
//         success: false,
//         error: '缺少用户照片路径'
//       } as ErrorResponse);
//       return;
//     }
    
//     console.log('Generating virtual try-on effect with text prompt...');
//     console.log('Prompt:', prompt);
//     console.log('File path:', filePath);
//     console.log('Model:', model);
    
//     const result = await callJimengTextToImage(prompt, filePath, {
//       model: model || 'jimeng-3.0',
//       width: width || 512,
//       height: height || 768,
//       sample_strength: sample_strength || 0.7
//     });
    
//     res.json(result);
    
//   } catch (error) {
//     console.error('API error:', error);
//     res.status(500).json({
//       success: false,
//       error: '服务器内部错误'
//     } as ErrorResponse);
//   }
// }

/**
 * 获取支持的衣物类别和位置映射
 */
// export function getClothingPositions(req: Request, res: Response<ClothingPositionsResponse>): void {
//   res.json({
//     positions: {
//       'upper_body': { name: '上半身', categories: ['上衣', '衬衫', 'T恤'] },
//       'upper_body_outer': { name: '上半身外层', categories: ['外套', '夹克', '西装'] },
//       'lower_body': { name: '下半身', categories: ['下装', '裤子', '裙子'] },
//       'feet': { name: '脚部', categories: ['鞋子', '靴子', '凉鞋'] },
//       'head': { name: '头部', categories: ['帽子', '头饰'] },
//       'accessories': { name: '配饰', categories: ['配饰', '包包', '首饰'] },
//       'underwear': { name: '内层', categories: ['内衣', '打底衫'] }
//     },
//     supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
//     recommendedSize: {
//       width: 512,
//       height: 768
//     }
//   });
// }

/**
 * 健康检查端点
 */
export function healthCheck(req: Request, res: Response<HealthCheckResponse>): void {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      'text-to-image': 'available',
      'image-composition': 'available'
    }
  });
}

/**
 * 分析衣物图片
 */
export async function analyzeClothing(req: Request, res: Response) {
  try {
    console.log('收到衣物分析请求');
    
    const { imageBase64, category, name }: ClothingAnalysisRequest = req.body;
    
    // 验证请求参数
    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: '缺少图片数据'
      });
    }

    // 验证 base64 格式
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(imageBase64)) {
      return res.status(400).json({
        success: false,
        error: '图片格式不正确'
      });
    }

    // 调用 AI 分析服务
    const analysisResult = await analyzeClothingImage({
      imageBase64,
      ...(category && { category }),
      ...(name && { name })
    });

    // 返回分析结果
    return res.json(analysisResult);

  } catch (error) {
    console.error('衣物分析错误:', error);
    return res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
} 