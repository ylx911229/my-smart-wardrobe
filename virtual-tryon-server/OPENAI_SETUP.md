# OpenAI 虚拟试穿配置说明

## 环境变量配置

在 `virtual-tryon-server` 目录下创建 `.env` 文件，添加以下配置：

```bash
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here

# 服务器配置
PORT=3001
NODE_ENV=development

# 调试模式
DEBUG=true

# 临时文件存储目录
TEMP_DIR=/tmp

# 图像处理配置
MAX_IMAGE_SIZE=10MB
SUPPORTED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp
```

## 获取 OpenAI API Key

1. 访问 [OpenAI 官网](https://platform.openai.com/)
2. 注册并登录账户
3. 前往 API Keys 页面
4. 点击 "Create new secret key" 创建新的 API Key
5. 复制 API Key 并替换上述配置中的 `your_openai_api_key_here`

## 安装依赖

```bash
cd virtual-tryon-server
npm install
```

## 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## API 功能说明

### 虚拟试穿流程

1. **图像分析阶段**：使用 GPT-4 Vision 分析用户照片和衣物图片
2. **描述生成阶段**：基于分析结果生成详细的虚拟试穿描述
3. **图像生成阶段**：使用 DALL-E 3 生成最终的虚拟试穿效果图

### 支持的图像格式

- JPEG/JPG
- PNG
- GIF
- WebP

### 图像处理特性

- 自动下载网络图片到临时文件
- Base64 编码处理
- 临时文件自动清理
- 错误处理和重试机制

## 注意事项

1. **API 费用**：OpenAI API 按使用量计费，请注意控制使用量
2. **图像质量**：建议使用高质量的用户照片和衣物图片以获得更好的效果
3. **网络连接**：确保服务器有稳定的网络连接以访问 OpenAI API
4. **临时文件**：系统会自动清理临时文件，但建议定期检查 `/tmp` 目录

## 错误排查

### 常见错误

1. **API Key 错误**：检查 `.env` 文件中的 `OPENAI_API_KEY` 是否正确
2. **网络超时**：检查网络连接和防火墙设置
3. **图像格式不支持**：确保图像格式在支持列表中
4. **文件大小超限**：检查图像文件大小是否超过限制

### 调试模式

启用调试模式后，系统会输出详细的处理日志，包括：
- 图像分析结果
- 生成的提示词
- API 调用详情
- 临时文件操作

## 性能优化建议

1. **图像压缩**：在上传前适当压缩图像以减少处理时间
2. **批量处理**：避免同时处理大量请求
3. **缓存机制**：考虑实现结果缓存以提高响应速度
4. **异步处理**：使用队列系统处理长时间运行的任务 