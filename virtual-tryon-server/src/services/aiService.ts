import fs from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { 
  ClothingImageInput, 
  CompositionOptions, 
  AIGenerationResult, 
  JimengAIRequest, 
  JimengAIResponse,
  ClothingAnalysisRequest,
  ClothingAnalysisResult
} from '../types';

// 加载环境变量
dotenv.config();

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * 将base64数据写入临时文件
 */
function writeBase64ToTempFile(base64Data: string, filename: string): string {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const tempPath = `/tmp/${filename}`;
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
  } catch (error) {
    console.error('Error writing base64 to temp file:', error);
    throw new Error(`Failed to write base64 data to temp file: ${filename}`);
  }
}

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
  baseImageBase64: string,
  clothingImages: ClothingImageInput[],
  prompt: string,
  options: CompositionOptions = {}
): Promise<any> {
  try {
    console.log('开始 OpenAI 虚拟试穿生成...');
    console.log('用户照片 base64 长度:', baseImageBase64.length);
    console.log('衣物图片:', clothingImages.map(img => `${img.name} (${img.category})`));
    console.log('生成提示:', prompt);
    
    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 环境变量未设置');
    }

    // 第一步：使用 GPT-4 分析用户照片和衣物图片
    const analysisPrompt = generateAnalysisPrompt(clothingImages, prompt);
    
    // 准备输入内容数组
    const inputContent: any[] = [
      { type: "input_text", text: analysisPrompt }
    ];

    // 添加用户照片（直接使用 base64 数据）
    inputContent.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${baseImageBase64}`
    });

    // 处理衣物图片（使用 base64 数据）
    for (const clothingImage of clothingImages) {
      if (clothingImage.imageBase64) {
        inputContent.push({
          type: "input_image",
          image_url: `data:image/jpeg;base64,${clothingImage.imageBase64}`
        });
      } else {
        console.warn(`衣物图片 ${clothingImage.name} 缺少 base64 数据`);
      }
    }

    console.log('inputContent', inputContent);

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
    const imageData = analysisResponse.output
      .filter((output) => output.type === "image_generation_call")
      .map((output) => output.result);

    if (imageData.length > 0) {
      const imageBase64 = imageData[0] as string;
      
      // 保存生成的图片到临时文件
      const tempFilename = `generated_${Date.now()}.png`;
      const tempPath = writeBase64ToTempFile(imageBase64, tempFilename);
      
      // 返回结果
      return {
        success: true,
        imageUrl: `data:image/png;base64,${imageBase64}`,
        metadata: {
          baseImage: 'base64',
          clothingCount: clothingImages.length,
          prompt: prompt,
          model: options.model || 'gpt-4o',
          mode: options.mode || 'image_composition',
          timestamp: new Date().toISOString(),
          processingTime: 'N/A',
          fallback: false,
          tempPath: tempPath
        }
      };
    } else {
      console.log('analysisResponse.output', analysisResponse.output);
      throw new Error('OpenAI 未返回生成的图像');
    }

  } catch (error) {
    console.error('OpenAI Virtual Try-On Error:', error);
    
    // 返回错误结果
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OpenAI 生成失败',
      metadata: {
        baseImage: 'base64',
        clothingCount: clothingImages.length,
        prompt: prompt,
        model: options.model || 'gpt-4o',
        mode: options.mode || 'image_composition',
        timestamp: new Date().toISOString(),
        processingTime: 'N/A',
        fallback: false
      }
    };
  }
}

/**
 * 生成 GPT-4 分析提示词
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

/**
 * 使用 OpenAI GPT-4 Vision API 分析衣物图片
 */
export async function analyzeClothingImage(
  request: ClothingAnalysisRequest
): Promise<ClothingAnalysisResult> {
  try {
    console.log('开始衣物图片分析...');
    console.log('图片 base64 长度:', request.imageBase64.length);
    console.log('衣物分类:', request.category);
    console.log('衣物名称:', request.name);

    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 环境变量未设置');
    }

    // 构建分析提示词
    const analysisPrompt = `
请详细分析这件衣物，并以JSON格式返回分析结果。请按照以下格式：

{
  "colors": ["主要颜色1", "主要颜色2"],
  "materials": ["材质1", "材质2"],
  "patterns": ["图案/款式1", "图案/款式2"],
  "temperatureRange": {
    "min": 最低适合温度(摄氏度),
    "max": 最高适合温度(摄氏度)
  },
  "weatherConditions": ["晴天", "多云", "雨天等"],
  "seasons": ["春季", "夏季", "秋季", "冬季"],
  "styles": ["休闲", "正式", "运动", "商务", "街头", "复古等"],
  "occasions": ["日常", "工作", "聚会", "运动", "约会", "正式场合等"],
  "formalityLevel": 1到5的数字(1最休闲,5最正式),
  "gender": "male"或"female"或"unisex",
  "ageGroups": ["青少年", "青年", "中年", "老年"],
  "bodyTypes": ["瘦", "标准", "丰满", "运动型等"],
  "matchingColors": ["搭配颜色1", "搭配颜色2"],
  "avoidColors": ["避免颜色1", "避免颜色2"],
  "confidence": 0到1的数字(分析置信度)
}

分析要求：
1. 仔细观察衣物的颜色、材质、款式
2. 根据衣物类型推断适合的温度范围
3. 考虑衣物的正式程度和适合场合
4. 分析适合的人群特征
5. 推荐搭配和避免的颜色
6. 给出分析的置信度评分

衣物分类：${request.category || '未指定'}
衣物名称：${request.name || '未指定'}
`;

    // 调用 OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${request.imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1 // 降低温度以获得更一致的结果
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('AI 分析返回空结果');
    }

    console.log('AI 分析原始结果:', analysisText);

    // 尝试解析 JSON 结果
    let analysisData;
    try {
      // 提取 JSON 部分（可能包含在代码块中）
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       analysisText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, analysisText];
      const jsonString = jsonMatch[1] || analysisText;
      
      analysisData = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('JSON 解析错误:', parseError);
      throw new Error('AI 分析结果格式错误');
    }

    // 验证和补充分析数据
    const validatedAnalysis = validateAndCleanAnalysis(analysisData);

    return {
      success: true,
      analysis: {
        ...validatedAnalysis,
        analyzedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('衣物分析错误:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '分析失败'
    };
  }
}

/**
 * 验证和清理分析数据
 */
function validateAndCleanAnalysis(data: any): any {
  return {
    colors: Array.isArray(data.colors) ? data.colors : [],
    materials: Array.isArray(data.materials) ? data.materials : [],
    patterns: Array.isArray(data.patterns) ? data.patterns : [],
    temperatureRange: {
      min: typeof data.temperatureRange?.min === 'number' ? data.temperatureRange.min : 0,
      max: typeof data.temperatureRange?.max === 'number' ? data.temperatureRange.max : 30
    },
    weatherConditions: Array.isArray(data.weatherConditions) ? data.weatherConditions : ['晴天'],
    seasons: Array.isArray(data.seasons) ? data.seasons : ['全季'],
    styles: Array.isArray(data.styles) ? data.styles : ['休闲'],
    occasions: Array.isArray(data.occasions) ? data.occasions : ['日常'],
    formalityLevel: typeof data.formalityLevel === 'number' ? 
      Math.max(1, Math.min(5, data.formalityLevel)) : 2,
    gender: ['male', 'female', 'unisex'].includes(data.gender) ? data.gender : 'unisex',
    ageGroups: Array.isArray(data.ageGroups) ? data.ageGroups : ['青年'],
    bodyTypes: Array.isArray(data.bodyTypes) ? data.bodyTypes : ['标准'],
    matchingColors: Array.isArray(data.matchingColors) ? data.matchingColors : [],
    avoidColors: Array.isArray(data.avoidColors) ? data.avoidColors : [],
    confidence: typeof data.confidence === 'number' ? 
      Math.max(0, Math.min(1, data.confidence)) : 0.8
  };
} 