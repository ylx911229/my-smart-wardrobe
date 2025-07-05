import fs from 'fs';
import OpenAI from 'openai';
import { 
  ClothingImageInput, 
  CompositionOptions, 
  AIGenerationResult, 
  JimengAIRequest, 
  JimengAIResponse 
} from '../types';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * 将图像文件编码为 base64 格式
 */
function encodeImage(imagePath: string): string {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error encoding image:', error);
    throw new Error(`Failed to encode image: ${imagePath}`);
  }
}

/**
 * 将图像文件上传到 OpenAI 并获取 file_id
 */
async function createFile(imagePath: string): Promise<string> {
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(imagePath),
      purpose: 'vision'
    });
    return file.id;
  } catch (error) {
    console.error('Error creating file:', error);
    throw new Error(`Failed to upload image: ${imagePath}`);
  }
}

/**
 * 从 URL 下载图像并保存到临时文件
 */
async function downloadImageFromUrl(imageUrl: string, filename: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const tempPath = `/tmp/${filename}`;
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    
    return tempPath;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error(`Failed to download image from URL: ${imageUrl}`);
  }
}

/**
 * 调用 OpenAI 进行虚拟试穿图像生成
 */
export async function callOpenAIVirtualTryOn(
  baseImage: string,
  clothingImages: ClothingImageInput[],
  prompt: string,
  options: CompositionOptions = {}
): Promise<any> {
  try {
    console.log('开始 OpenAI 虚拟试穿生成...');
    console.log('用户照片:', baseImage);
    console.log('衣物图片:', clothingImages.map(img => `${img.name} (${img.category})`));
    console.log('生成提示:', prompt);
    
    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 环境变量未设置');
    }

    // 第一步：使用 GPT-4  分析用户照片和衣物图片
    const analysisPrompt = generateAnalysisPrompt(clothingImages, prompt);
    
    // 准备输入内容数组
    const inputContent: any[] = [
      { type: "text", text: analysisPrompt }
    ];

    // 处理用户照片
    let userImagePath = baseImage;
    if (baseImage.startsWith('http')) {
      userImagePath = await downloadImageFromUrl(baseImage, `user_${Date.now()}.jpg`);
    }

    // 添加用户照片（使用 base64 格式）
    try {
      const userImageBase64 = encodeImage(userImagePath);
      console.log('userImageBase64', userImageBase64);
      inputContent.push({
        type: "input_image",
        image_url: {
          url: `data:image/jpeg;base64,${userImageBase64}`
        }
      });
    } catch (error) {
      console.log('用户照片编码失败:', error);
      throw new Error('用户照片处理失败');
    }

    // 处理衣物图片
    for (const clothingImage of clothingImages) {
      let imagePath = clothingImage.imageUri;
      
      // 如果是 URL，先下载到本地
      if (imagePath.startsWith('http')) {
        imagePath = await downloadImageFromUrl(
          imagePath, 
          `clothing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        );
      }

      // 添加衣物图片
      try {
        const clothingImageBase64 = encodeImage(imagePath);
        inputContent.push({
          type: "input_image",
          image_url: {
            url: `data:image/jpeg;base64,${clothingImageBase64}`
          }
        });
      } catch (error) {
        console.log(`衣物图片编码失败: ${clothingImage.name}`, error);
        continue; // 跳过失败的图片
      }
    }

    // 调用 GPT-4 进行分析
    const analysisResponse = await openai.responses.create({
      model: options.model || "gpt-4o",
      input : [
        {
          role: "user",
          content: inputContent
        }
      ],
      tools: [{ type: "image_generation" }],
    });

    // 获取分析结果
    // const analysisResult = analysisResponse.choices[0]?.message?.content;

    const imageData = analysisResponse.output
      .filter((output) => output.type === "image_generation_call")
      .map((output) => output.result);

    if (imageData.length > 0) {
      const imageBase64 = imageData[0] as string;
      const fs = await import("fs");
      fs.writeFileSync("gift-basket.png", Buffer.from(imageBase64, "base64"));
    } else {
      console.log('analysisResponse.output', analysisResponse.output);
    }

    if (!analysisResponse) {
      throw new Error('GPT-4  分析失败');
    }

    console.log('图像分析结果:', analysisResponse);

    // 第二步：基于分析结果生成 DALL-E 提示词
    // const dallePrompt = generateDallePrompt(analysisResult, clothingImages, prompt);
    // console.log('DALL-E 提示词:', dallePrompt);

    // // 第三步：使用 DALL-E 3 生成虚拟试穿图像
    // const imageResponse = await openai.images.generate({
    //   model: "dall-e-3",
    //   prompt: dallePrompt,
    //   n: 1,
    //   size: "1024x1024", // 使用固定的有效尺寸
    //   quality: "hd"
    // });

    // 清理临时文件
    try {
      if (userImagePath !== baseImage && userImagePath.startsWith('/tmp/')) {
        fs.unlinkSync(userImagePath);
      }
      for (const clothingImage of clothingImages) {
        if (clothingImage.imageUri.startsWith('/tmp/')) {
          fs.unlinkSync(clothingImage.imageUri);
        }
      }
    } catch (cleanupError) {
      console.log('清理临时文件时出错:', cleanupError);
    }

    // // 处理 DALL-E 响应
    // const generatedImageUrl = imageResponse.data?.[0]?.url;
    // if (generatedImageUrl) {
    //   return {
    //     success: true,
    //     imageUrl: generatedImageUrl,
    //     metadata: {
    //       baseImage: baseImage,
    //       clothingCount: clothingImages.length,
    //       prompt: dallePrompt,
    //       model: options.model || 'gpt-4o + dall-e-3',
    //       mode: 'openai_virtual_tryon',
    //       timestamp: new Date().toISOString(),
    //       processingTime: 'OpenAI处理时间',
    //       response: analysisResult,
    //       size: "1024x1024"
    //     }
    //   };
    // } else {
    //   throw new Error('DALL-E 3 未返回图像URL');
    // }
    
  } catch (error) {
    console.error('OpenAI 虚拟试穿生成失败:', error);
    return {
      success: false,
      error: (error as Error).message || 'OpenAI 虚拟试穿生成失败'
    };
  }
}

/**
 * 生成 GPT-4  分析提示词
 */
function generateAnalysisPrompt(clothingImages: ClothingImageInput[], basePrompt: string): string {
  const clothingDescriptions = clothingImages.map(item => {
    const position = getClothingPosition(item.category);
    return `${item.name} (${item.category}, 应该穿在${position})`;
  }).join('、');
  
  const prompt = `
请仔细分析这些图像：
1. 第一张图片是用户照片，请描述用户的体型、姿势、现有穿着和背景
2. 接下来的图片是衣物图片：${clothingDescriptions}

请为我提供一个详细的虚拟试穿描述，包括：
- 用户的基本特征（性别、体型、姿势等）
- 每件衣物的详细描述（颜色、材质、样式等）
- 如何将这些衣物自然地搭配在用户身上
- 保持合理的穿着层次和搭配效果

${basePrompt ? `额外要求：${basePrompt}` : ''}

请用中文回答，并且要详细具体。
`.trim();

  return prompt;
}

/**
 * 基于分析结果生成 DALL-E 提示词
 */
// function generateDallePrompt(analysisResult: string, clothingImages: ClothingImageInput[], basePrompt: string): string {
//   const clothingList = clothingImages.map(item => `${item.name} (${item.category})`).join(', ');
  
//   const prompt = `
// Create a photorealistic image of a person wearing the following clothing items: ${clothingList}.

// Based on the analysis: ${analysisResult}

// Requirements:
// - Photorealistic, high-quality image
// - Professional photography style
// - Natural lighting and shadows
// - Clothing should fit naturally on the body
// - Maintain realistic proportions
// - Clean, simple background
// - Full body or upper body shot as appropriate
// - High resolution and detail

// ${basePrompt ? `Additional requirements: ${basePrompt}` : ''}

// Style: Fashion photography, professional, clean, modern.
// `.trim();

//   return prompt;
// }

/**
 * 根据衣物类别获取穿着位置描述
 */
function getClothingPosition(category: string): string {
  const positionMap: { [key: string]: string } = {
    '上衣': '上身',
    '衬衫': '上身', 
    'T恤': '上身',
    '外套': '上身外层',
    '下装': '下身',
    '裤子': '下身',
    '裙子': '下身',
    '鞋子': '脚部',
    '配饰': '相应部位',
    '帽子': '头部',
    '内衣': '内层'
  };
  
  return positionMap[category] || '身体';
}

/**
 * 调用即梦AI进行图像合成
 */
// export async function callJimengImageComposition(
//   baseImage: string,
//   clothingImages: ClothingImageInput[],
//   prompt: string,
//   options: CompositionOptions = {}
// ): Promise<AIGenerationResult> {
//   // 重定向到 OpenAI 实现
//   return await callOpenAIVirtualTryOn(baseImage, clothingImages, prompt, options);
// }

/**
 * 真实的即梦AI调用函数
 */
// async function generateWithJimengAI(
//   baseImage: string,
//   clothingImages: ClothingImageInput[],
//   prompt: string,
//   options: CompositionOptions = {}
// ): Promise<AIGenerationResult> {
//   try {
//     // 构建增强的prompt，结合衣物信息
//     const enhancedPrompt = buildEnhancedPrompt(prompt, clothingImages);
    
//     // 这里应该调用即梦AI的实际API
//     // 由于即梦AI支持图像参考，我们可以使用filePath参数传入用户照片
//     const jimengRequest: JimengAIRequest = {
//       prompt: enhancedPrompt,
//       filePath: baseImage, // 用户照片作为参考图
//       model: options.model || 'jimeng-3.0',
//       width: options.width || 512,
//       height: options.height || 768,
//       sample_strength: options.sample_strength || 0.8,
//       // 如果即梦AI支持多图输入，可以添加衣物图片
//       additionalImages: clothingImages.map(img => img.imageUri)
//     };
    
//     console.log('Calling Jimeng AI with request:', jimengRequest);
    
//     // 这里需要实际的即梦AI集成
//     // 可以通过HTTP请求调用即梦AI的MCP工具
//     const aiResponse = await callJimengAIDirectly(jimengRequest);
    
//     if (aiResponse && aiResponse.imageUrl) {
//       return {
//         success: true,
//         imageUrl: aiResponse.imageUrl,
//         metadata: {
//           baseImage: baseImage,
//           clothingCount: clothingImages.length,
//           prompt: enhancedPrompt,
//           model: options.model || 'jimeng-3.0',
//           mode: 'ai_composition',
//           timestamp: new Date().toISOString(),
//           processingTime: aiResponse.processingTime || 'unknown'
//         }
//       };
//     } else {
//       throw new Error('即梦AI返回无效结果');
//     }
    
//   } catch (error) {
//     console.error('Jimeng AI direct call failed:', error);
//     throw error;
//   }
// }

/**
 * 构建增强的prompt
 */
// function buildEnhancedPrompt(basePrompt: string, clothingImages: ClothingImageInput[]): string {
//   const clothingDescriptions = clothingImages.map(item => {
//     return `${item.category}(${item.name})`;
//   }).join('、');
  
//   return `${basePrompt} 具体衣物：${clothingDescriptions}。请确保衣物自然贴合身体，保持真实的穿着效果，光照统一，高质量合成。`;
// }

/**
 * 直接调用即梦AI的函数
 */
// async function callJimengAIDirectly(request: JimengAIRequest): Promise<JimengAIResponse> {
//   try {
//     // 这里应该集成真实的即梦AI调用
//     // 例如通过HTTP请求到即梦AI的API端点
    
//     // 模拟调用过程
//     await new Promise(resolve => setTimeout(resolve, 3000));
    
//     // 在真实实现中，这里会调用:
//     // const response = await fetch('jimeng-ai-api-endpoint', { ... });
//     // const result = await response.json();
    
//     return {
//       imageUrl: `https://picsum.photos/${request.width}/${request.height}?random=${Date.now()}`,
//       processingTime: '3.2s'
//     };
    
//   } catch (error) {
//     console.error('Direct Jimeng AI call failed:', error);
//     throw error;
//   }
// }

/**
 * 模拟调用即梦AI进行单纯文字到图像生成（保留原有功能）
 */
// export async function callJimengTextToImage(
//   prompt: string,
//   filePath: string,
//   options: CompositionOptions = {}
// ): Promise<AIGenerationResult> {
//   try {
//     console.log('OpenAI 文字转图像生成...');
//     console.log('提示词:', prompt);
//     console.log('参考图像:', filePath);
    
//     // 检查 OpenAI API Key
//     if (!process.env.OPENAI_API_KEY) {
//       throw new Error('OPENAI_API_KEY 环境变量未设置');
//     }

//     // 使用 DALL-E 3 生成图像
//     const response = await openai.images.generate({
//       model: "dall-e-3",
//       prompt: prompt,
//       n: 1,
//       size: "1024x1024",
//       quality: "hd"
//     });

//     const imageUrl = response.data?.[0]?.url;
//     if (!imageUrl) {
//       throw new Error('DALL-E 3 未返回图像URL');
//     }

//     return {
//       success: true,
//       imageUrl: imageUrl,
//       metadata: {
//         prompt: prompt,
//         model: 'dall-e-3',
//         timestamp: new Date().toISOString(),
//         size: `${options.width || 1024}x${options.height || 1024}`
//       }
//     };
    
//   } catch (error) {
//     console.error('OpenAI 文字转图像生成失败:', error);
//     return {
//       success: false,
//       error: (error as Error).message || 'OpenAI 文字转图像生成失败'
//     };
//   }
// } 