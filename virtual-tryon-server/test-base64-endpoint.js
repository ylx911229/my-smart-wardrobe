const fs = require('fs');
const path = require('path');

// 测试用的base64图片数据（1x1像素的PNG图片）
const testBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// 测试数据
const testData = {
  baseImageBase64: testBase64Image,
  clothingImages: [
    {
      imageUri: 'test://shirt.jpg',
      imageBase64: testBase64Image,
      category: '上衣',
      position: 'upper_body',
      name: '测试上衣'
    },
    {
      imageUri: 'test://pants.jpg', 
      imageBase64: testBase64Image,
      category: '下装',
      position: 'lower_body',
      name: '测试裤子'
    }
  ],
  prompt: '生成一个穿着这些衣物的虚拟试穿效果',
  model: 'gpt-4o',
  mode: 'image_composition',
  width: 512,
  height: 768,
  sample_strength: 0.8,
  compositionSettings: {
    preserveBaseStructure: true,
    blendMode: 'natural',
    lightingAdjustment: true
  }
};

// 发送测试请求
async function testVirtualTryOnAPI() {
  try {
    console.log('开始测试虚拟试穿API...');
    console.log('测试数据:', {
      ...testData,
      baseImageBase64: `[base64 data length: ${testData.baseImageBase64.length}]`,
      clothingImages: testData.clothingImages.map(img => ({
        ...img,
        imageBase64: `[base64 data length: ${img.imageBase64.length}]`
      }))
    });

    const response = await fetch('http://localhost:3001/api/compose-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API调用失败:', errorText);
      return;
    }

    const result = await response.json();
    console.log('API调用成功:', {
      success: result.success,
      imageUrl: result.imageUrl ? `[Generated image URL: ${result.imageUrl.substring(0, 50)}...]` : 'No image URL',
      error: result.error,
      metadata: result.metadata
    });

    if (result.success && result.imageUrl) {
      console.log('✅ 虚拟试穿API测试成功！');
    } else {
      console.log('❌ 虚拟试穿API测试失败:', result.error);
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  testVirtualTryOnAPI();
}

module.exports = { testVirtualTryOnAPI }; 