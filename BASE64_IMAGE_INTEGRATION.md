# Base64图片集成说明

## 功能概述

本次更新实现了将本地图片读取为base64格式，然后传递给服务端接口，再调用OpenAI接口生成虚拟试穿效果的完整流程。

## 技术架构

```
客户端 → 读取本地图片为base64 → 发送到服务端 → OpenAI GPT-4o处理 → 返回生成的图片
```

## 主要改动

### 1. 客户端改动 (`src/services/VirtualTryOnService.ts`)

- **新增依赖**: `expo-file-system` 用于读取本地文件
- **新增方法**: `readImageAsBase64()` - 将本地图片读取为base64格式
- **新增方法**: `prepareClothingInputsWithBase64()` - 准备包含base64数据的衣物输入
- **修改接口**: `ClothingImageInput` 新增 `imageBase64` 字段
- **修改流程**: 在发送请求前将所有图片转换为base64

### 2. 服务端改动

#### `virtual-tryon-server/src/types.ts`
- 更新 `ClothingImageInput` 接口，添加 `imageBase64` 字段
- 更新 `ComposeImageRequest` 接口，支持 `baseImageBase64` 字段

#### `virtual-tryon-server/src/controllers/imageController.ts`
- 修改验证逻辑，检查base64数据而非文件路径
- 更新日志输出，显示base64数据长度

#### `virtual-tryon-server/src/services/aiService.ts`
- 直接使用base64数据，无需文件路径转换
- 新增 `writeBase64ToTempFile()` 方法用于保存生成的图片
- 简化图片处理流程，提高性能

## 使用流程

### 1. 客户端使用

```typescript
// 生成虚拟试穿效果
const result = await VirtualTryOnService.generateTryOnEffect({
  user: userWithPhoto,
  outfit: clothingItemsWithImages,
  outfitName: "我的穿搭"
});
```

### 2. 数据格式

#### 请求数据格式
```json
{
  "baseImageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...",
  "clothingImages": [
    {
      "imageUri": "file://local/path/shirt.jpg",
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...",
      "category": "上衣",
      "position": "upper_body",
      "name": "白色T恤"
    }
  ],
  "prompt": "生成穿搭效果",
  "model": "gpt-4o",
  "mode": "image_composition"
}
```

#### 响应数据格式
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...",
  "metadata": {
    "baseImage": "base64",
    "clothingCount": 2,
    "prompt": "生成穿搭效果",
    "model": "gpt-4o",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 测试

### 1. 服务端测试

运行测试脚本：
```bash
cd virtual-tryon-server
node test-base64-endpoint.js
```

### 2. 客户端测试

在客户端应用中选择用户照片和衣物图片，点击"生成试穿效果"按钮。

## 依赖说明

### 客户端依赖
- `expo-file-system`: 用于读取本地文件为base64

### 服务端依赖
- `openai`: OpenAI GPT-4o接口
- `fs`: Node.js文件系统模块（内置）

## 错误处理

### 常见错误及解决方案

1. **图片读取失败**
   - 检查文件路径是否正确
   - 确认文件权限
   - 验证图片格式

2. **base64数据过大**
   - 压缩图片尺寸
   - 降低图片质量
   - 检查网络传输限制

3. **OpenAI接口调用失败**
   - 检查API密钥配置
   - 确认网络连接
   - 查看接口限制

## 性能优化

1. **图片压缩**: 建议在转换为base64前进行图片压缩
2. **并发处理**: 多个图片可以并行读取
3. **缓存机制**: 对已读取的base64数据进行缓存
4. **错误重试**: 网络失败时自动重试

## 注意事项

1. **图片大小限制**: 建议单张图片不超过5MB
2. **网络超时**: 设置合理的超时时间（30秒）
3. **内存管理**: 及时释放base64数据
4. **安全性**: 不要在日志中打印完整的base64数据

## 后续改进

1. 添加图片压缩功能
2. 实现断点续传
3. 支持批量处理
4. 添加图片质量检测
5. 优化内存使用 