# 智能衣物分析功能

## 功能概述

智能衣物分析功能使用 OpenAI 的 GPT-4 Vision API 来自动分析衣物图片，为每件衣物生成详细的智能标签。这些标签包含颜色、风格、适合场合、温度范围等信息，使得推荐系统能够提供更精准的穿搭建议。

## 主要特性

### 🤖 AI 驱动的图片分析
- 使用 OpenAI GPT-4 Vision API 进行图像识别
- 自动识别衣物的颜色、材质、款式
- 分析衣物的风格和适用场合
- 推断适合的温度范围和天气条件

### 🏷️ 智能标签系统
- **基础信息**: 颜色、材质、图案
- **适用条件**: 温度范围、天气条件、季节
- **风格属性**: 风格标签、场合、正式程度
- **人群属性**: 性别、年龄段、体型
- **搭配建议**: 推荐搭配色彩、避免色彩

### 🎯 智能推荐算法
- 基于智能标签进行精准推荐
- 考虑天气条件和温度范围
- 分析颜色搭配和谐度
- 评估风格一致性
- 计算推荐分数

## 技术架构

### 后端服务 (virtual-tryon-server)
```
src/
├── services/
│   └── aiService.ts          # AI分析服务
├── controllers/
│   └── imageController.ts    # 图片分析控制器
├── types.ts                  # 类型定义
└── server.ts                 # 服务器配置
```

### 前端客户端 (src)
```
src/
├── services/
│   └── ClothingAnalysisService.ts  # 客户端分析服务
├── screens/
│   ├── AddClothingScreen.tsx       # 添加衣物（包含自动分析）
│   └── RecommendScreen.tsx         # 智能推荐
└── types/
    └── index.ts                    # 类型定义
```

## 使用流程

### 1. 添加衣物时的自动分析
1. 用户选择或拍摄衣物照片
2. 系统自动将图片发送到 AI 分析服务
3. AI 返回详细的智能标签
4. 用户可预览标签并继续添加衣物

### 2. 智能推荐
1. 系统根据当前天气获取温度
2. 基于智能标签筛选适合的衣物
3. 使用多维度评分算法生成搭配
4. 返回最优搭配建议

## API 接口

### 分析衣物图片
```
POST /api/analyze-clothing
Content-Type: application/json

{
  "imageBase64": "base64编码的图片数据",
  "category": "上衣",
  "name": "白色T恤"
}
```

### 响应格式
```json
{
  "success": true,
  "analysis": {
    "colors": ["白色", "蓝色"],
    "materials": ["棉质"],
    "patterns": ["纯色", "简约"],
    "temperatureRange": {
      "min": 15,
      "max": 30
    },
    "weatherConditions": ["晴天", "多云"],
    "seasons": ["春季", "夏季", "秋季"],
    "styles": ["休闲", "简约"],
    "occasions": ["日常", "运动"],
    "formalityLevel": 2,
    "gender": "unisex",
    "ageGroups": ["青年", "中年"],
    "bodyTypes": ["标准", "瘦"],
    "matchingColors": ["蓝色", "黑色", "灰色"],
    "avoidColors": ["红色", "橙色"],
    "confidence": 0.85,
    "analyzedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 评分算法

### 搭配评分维度
1. **基础分**: 每件衣物 10 分
2. **AI 分析加分**: AI 分析的衣物额外 20 分
3. **风格一致性**: 风格统一加 30 分
4. **颜色搭配**: 和谐色彩搭配加 15 分/对
5. **场合适配**: 共同适用场合加 10 分/个
6. **正式程度**: 正式度一致性加分

### 颜色搭配规则
```javascript
const harmonies = {
  '黑色': ['白色', '灰色', '红色', '蓝色'],
  '白色': ['黑色', '灰色', '蓝色', '粉色'],
  '灰色': ['黑色', '白色', '蓝色', '粉色'],
  '蓝色': ['白色', '灰色', '卡其色', '米色'],
  '红色': ['黑色', '白色', '灰色']
};
```

## 配置说明

### 环境变量
```bash
# virtual-tryon-server/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

### 客户端配置
```typescript
// src/services/ClothingAnalysisService.ts
const ANALYSIS_API_URL = 'http://localhost:3001/api/analyze-clothing';
```

## 安装和运行

### 1. 安装依赖
```bash
# 安装服务端依赖
cd virtual-tryon-server
npm install

# 安装客户端依赖
cd ..
npm install
```

### 2. 配置环境变量
```bash
# 在 virtual-tryon-server/.env 中配置
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. 启动服务
```bash
# 启动服务端
cd virtual-tryon-server
npm run dev

# 启动客户端
cd ..
npm start
```

### 4. 测试功能
```bash
# 测试 API 功能
cd virtual-tryon-server
node test-clothing-analysis.js
```

## 故障排除

### 常见问题

1. **API 调用失败**
   - 检查 OPENAI_API_KEY 是否正确配置
   - 确认网络连接正常
   - 检查 API 限额是否超出

2. **图片分析失败**
   - 确认图片格式正确（支持 JPG、PNG）
   - 检查图片大小是否合适
   - 确认 base64 编码格式正确

3. **服务器连接失败**
   - 检查服务器是否正常启动
   - 确认端口 3001 未被占用
   - 检查防火墙设置

### 调试模式
```bash
# 启用详细日志
NODE_ENV=development npm run dev
```

## 未来优化

### 计划功能
- [ ] 批量分析多张图片
- [ ] 自定义标签模板
- [ ] 用户反馈学习
- [ ] 离线分析模式
- [ ] 更多 AI 模型支持

### 性能优化
- [ ] 图片压缩优化
- [ ] 缓存机制
- [ ] 并发处理
- [ ] 错误重试机制

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License 