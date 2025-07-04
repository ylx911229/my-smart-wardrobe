# 虚拟试穿效果功能

## 功能概述

虚拟试穿效果是智能衣橱应用的革新功能，通过AI图像合成技术将**真实的衣物图片**精确地合成到用户照片上，让用户直观地看到穿搭效果。

## 核心优势

- **真实衣物合成**: 直接使用每件衣物的实际照片进行AI合成，而非文字描述
- **精确位置映射**: 智能识别衣物类别并准确放置在身体对应位置
- **自然融合效果**: AI确保衣物贴合身体，保持自然的穿着效果和光照一致性
- **多件衣物支持**: 同时处理上衣、下装、鞋子等多件衣物的组合穿搭
- **即时反馈**: 清晰展示即将合成的衣物图片，用户可预览效果

## 技术架构

### 前端 (React Native)
- **VirtualTryOn组件**: 
  - 展示衣物详细预览
  - 处理用户交互和状态管理
  - 显示AI合成进度和结果
- **VirtualTryOnService**: 
  - 衣物图片验证和预处理
  - 身体位置映射逻辑
  - API调用和错误处理
- **推荐系统集成**: 一键从推荐结果启动试穿

### 后端服务器 (Node.js/Express)
- **图像合成API**: `/api/compose-image` - 多图输入的AI合成
- **位置映射API**: `/api/clothing-positions` - 获取衣物位置信息
- **备用生成API**: `/api/generate-image` - 文字描述备用方案
- **即梦AI集成**: 真实AI服务 + 智能降级方案

## 安装和设置

### 1. 安装服务器依赖

**推荐：使用独立服务器目录**

```bash
# 创建独立服务器目录（避免依赖冲突）
mkdir virtual-tryon-server
cd virtual-tryon-server

# 复制服务器文件
cp ../server.js .
cp ../server-package.json package.json

# 安装依赖
npm install

# 启动服务器
node server.js
```

**服务器运行在**: `http://localhost:3001`

### 网络配置（重要）

由于React Native的网络限制，需要根据运行环境使用不同的API地址：

- **iOS模拟器**: `http://localhost:3001` ✅
- **Android模拟器**: `http://10.0.2.2:3001` ✅
- **真机设备**: `http://[你的IP]:3001` ⚠️

**获取本机IP地址**:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1

# Windows
ipconfig | findstr "IPv4"
```

**测试服务器连接**:
```bash
# 健康检查
curl http://localhost:3001/health

# 应该返回
{"status":"OK","timestamp":"...","services":{"text-to-image":"available","image-composition":"available"}}
```

### 2. 配置AI服务

服务器当前使用模拟数据，要使用真实的即梦AI：

1. 获取即梦AI API密钥
2. 修改 `server.js` 中的 `callJimengAI` 函数
3. 集成真实的即梦AI API调用

### 3. 用户数据准备

确保用户数据包含照片：
- 用户需要在个人资料中上传照片
- 照片格式：JPG, PNG
- 建议尺寸：512x768或更高

## 使用方法

### 1. 在推荐页面使用

1. 选择用户
2. 生成穿搭推荐
3. 点击"试穿效果"按钮
4. 等待AI生成结果
5. 查看、保存或重新生成

### 2. API调用示例

```javascript
// 图像合成API调用
const response = await fetch('http://localhost:3001/api/compose-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    baseImage: 'user_photo.jpg', // 用户照片
    clothingImages: [
      {
        imageUri: 'blue_shirt.jpg',
        category: '上衣',
        position: 'upper_body',
        name: '蓝色衬衫'
      },
      {
        imageUri: 'black_pants.jpg', 
        category: '裤子',
        position: 'lower_body',
        name: '黑色长裤'
      },
      {
        imageUri: 'white_shoes.jpg',
        category: '鞋子', 
        position: 'feet',
        name: '白色运动鞋'
      }
    ],
    prompt: '请将以下衣物精确地穿在用户身上：蓝色衬衫穿在上半身，黑色长裤穿在下半身，白色运动鞋穿在脚部',
    model: 'jimeng-3.0',
    mode: 'image_composition',
    width: 512,
    height: 768,
    sample_strength: 0.8,
    compositionSettings: {
      preserveBaseStructure: true,
      blendMode: 'natural',
      lightingAdjustment: true
    }
  })
});

const result = await response.json();
console.log(result.imageUrl);
```

## 文件结构

```
my-smart-wardrobe/
├── src/
│   ├── components/
│   │   └── VirtualTryOn.tsx          # 试穿效果组件
│   ├── services/
│   │   └── VirtualTryOnService.ts    # 试穿效果服务
│   └── screens/
│       └── RecommendScreen.tsx       # 推荐页面（已集成）
├── server.js                        # API服务器
├── server-package.json               # 服务器依赖
└── VIRTUAL_TRYON_SETUP.md           # 本文档
```

## 开发注意事项

### 1. 性能优化
- 图像生成可能需要较长时间，提供加载状态
- 考虑实现缓存机制减少重复生成
- 压缩生成的图像以节省存储空间

### 2. 错误处理
- 网络错误处理
- AI服务不可用时的降级方案
- 用户照片验证

### 3. 用户体验
- 提供清晰的操作指引
- 显示生成进度
- 允许用户取消长时间的生成过程

## 扩展功能

### 计划中的功能
- **批量生成**: 一次生成多个角度的试穿效果
- **风格迁移**: 将不同风格应用到同一套穿搭
- **虚拟换装**: 允许用户交互式地更换单个服装项目
- **AR试穿**: 基于摄像头的实时试穿效果

### 自定义选项
- 生成图像的尺寸和质量
- 不同的AI模型选择
- 背景场景自定义
- 光照和姿势调整

## 故障排除

### 常见问题

1. **服务器连接失败 - "Network request failed"**
   
   **问题**: 应用显示"网络连接失败，请检查服务器是否启动"
   
   **解决方案**:
   ```bash
   # 1. 确认服务器正在运行
   curl http://localhost:3001/health
   
   # 2. 检查进程是否存在
   ps aux | grep "node server.js"
   
   # 3. 重新启动服务器
   cd virtual-tryon-server
   node server.js
   ```
   
   **网络配置检查**:
   - iOS模拟器: 确保使用 `localhost:3001`
   - Android模拟器: 确保使用 `10.0.2.2:3001`
   - 真机: 更新IP地址到 `VirtualTryOnService.ts` 的 `getApiBaseUrl()` 函数

2. **npm依赖冲突 - "ERESOLVE unable to resolve dependency tree"**
   
   **问题**: 在主项目目录安装express依赖时出现冲突
   
   **解决方案**: 使用独立服务器目录
   ```bash
   mkdir virtual-tryon-server
   cd virtual-tryon-server
   cp ../server.js .
   cp ../server-package.json package.json
   npm install
   ```

3. **连接超时 - "请求超时，服务器可能繁忙"**
   
   **问题**: AI生成时间过长导致超时
   
   **解决方案**:
   - 网络连接: 30秒超时（可在VirtualTryOnService.ts调整）
   - AI生成: 已设置30秒超时
   - 检查网络稳定性

4. **权限问题 - "EACCES"**
   
   **问题**: npm安装时出现权限错误
   
   **解决方案**:
   ```bash
   # 修复npm缓存权限
   sudo chown -R $(whoami) ~/.npm
   ```

5. **AI生成失败**
   - 检查用户照片是否有效
   - 验证prompt格式是否正确
   - 查看服务器日志获取详细错误

6. **图像显示问题**
   - 检查图像URL是否有效
   - 确认网络连接正常
   - 验证图像格式支持

### 日志和调试

服务器日志包含详细的生成信息：
```bash
# 启动服务器并查看日志
npm start

# 健康检查
curl http://localhost:3001/health
```

## 贡献指南

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License - 详见LICENSE文件 