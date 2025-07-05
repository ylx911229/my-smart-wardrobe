import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { composeImage, healthCheck, analyzeClothing } from './controllers/imageController';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 检查 OpenAI API Key
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY 环境变量未设置');
  console.warn('⚠️  请在 .env 文件中设置 OPENAI_API_KEY');
  console.warn('⚠️  虚拟试穿功能将无法正常工作');
} else {
  console.log('✅ OpenAI API Key 已配置');
}

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制以支持图像数据
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.post('/api/compose-image', composeImage);
app.post('/api/analyze-clothing', analyzeClothing);
// app.post('/api/generate-image', generateImage);
// app.get('/api/clothing-positions', getClothingPositions);
app.get('/health', healthCheck);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 Virtual Try-On API Server (OpenAI) running at http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(`🎨 Image composition: POST http://localhost:${port}/api/compose-image`);
  console.log(`🧠 Clothing analysis: POST http://localhost:${port}/api/analyze-clothing`);
  // console.log(`🖼️  Text generation: POST http://localhost:${port}/api/generate-image`);
  console.log(`📚 查看配置说明: OPENAI_SETUP.md`);
});

export default app; 