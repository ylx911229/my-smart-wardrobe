import express from 'express';
import cors from 'cors';
import { composeImage, generateImage, getClothingPositions, healthCheck } from './controllers/imageController';

const app = express();
const port = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.post('/api/compose-image', composeImage);
app.post('/api/generate-image', generateImage);
app.get('/api/clothing-positions', getClothingPositions);
app.get('/health', healthCheck);

// 启动服务器
app.listen(port, () => {
  console.log(`Virtual Try-On API Server (TypeScript) running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Image composition: POST http://localhost:${port}/api/compose-image`);
  console.log(`Text generation: POST http://localhost:${port}/api/generate-image`);
});

export default app; 