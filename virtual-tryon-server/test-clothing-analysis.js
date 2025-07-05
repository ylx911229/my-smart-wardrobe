const fs = require('fs');
const path = require('path');

// 测试衣物分析API
async function testClothingAnalysis() {
  const serverUrl = 'http://localhost:3001';
  
  // 示例：创建一个简单的测试base64图片数据
  // 这里使用一个很小的透明PNG图片作为测试
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const testRequest = {
    imageBase64: testImageBase64,
    category: '上衣',
    name: '测试T恤'
  };
  
  console.log('🧪 测试衣物分析API...');
  console.log('📊 请求数据:', {
    imageBase64Length: testRequest.imageBase64.length,
    category: testRequest.category,
    name: testRequest.name
  });
  
  try {
    const response = await fetch(`${serverUrl}/api/analyze-clothing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📡 响应状态:', response.status);
    
    if (!response.ok) {
      console.error('❌ 请求失败:', response.statusText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ 分析结果:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('🎉 分析成功！');
      console.log('🏷️ 生成的标签数量:', Object.keys(result.analysis || {}).length);
    } else {
      console.log('❌ 分析失败:', result.error);
    }
    
  } catch (error) {
    console.error('🚨 测试出错:', error.message);
    console.log('💡 请确保:');
    console.log('   1. 服务器已启动 (npm run dev)');
    console.log('   2. OpenAI API Key 已配置');
    console.log('   3. 网络连接正常');
  }
}

// 测试服务器健康状态
async function testServerHealth() {
  const serverUrl = 'http://localhost:3001';
  
  try {
    console.log('🏥 测试服务器健康状态...');
    const response = await fetch(`${serverUrl}/health`);
    const result = await response.json();
    
    console.log('✅ 服务器状态:', result);
    return true;
  } catch (error) {
    console.error('❌ 服务器连接失败:', error.message);
    return false;
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始测试衣物分析功能...\n');
  
  // 先测试服务器健康状态
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ 服务器未启动，请先运行: npm run dev');
    return;
  }
  
  console.log('\n---\n');
  
  // 测试衣物分析
  await testClothingAnalysis();
  
  console.log('\n🏁 测试完成！');
}

// 运行测试
main().catch(console.error); 