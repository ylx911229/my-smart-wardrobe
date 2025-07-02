# 天气API设置说明

## 概述

本应用支持获取真实天气信息来提供更准确的穿搭推荐。我们使用OpenWeatherMap提供的免费天气API服务。

## 功能说明

- **真实天气获取**: 基于用户位置获取当前天气信息
- **智能备用方案**: 当API不可用时，使用基于位置、时间、季节的智能预测
- **中文天气描述**: 自动翻译天气状况为中文显示

## 获取OpenWeatherMap API密钥

### 步骤1: 注册账号
1. 访问 [OpenWeatherMap官网](https://openweathermap.org/)
2. 点击右上角 "Sign Up" 注册账号
3. 填写邮箱、用户名、密码等信息
4. 验证邮箱

### 步骤2: 获取API密钥
1. 登录后点击用户名，选择 "My API keys"
2. 在 "API keys" 页面可以看到默认的API密钥
3. 也可以点击 "Generate" 创建新的API密钥
4. 复制API密钥备用

### 步骤3: 配置API密钥
1. 打开 `src/services/WeatherService.ts` 文件
2. 找到这一行：
   ```typescript
   const OPENWEATHER_API_KEY = 'your_openweather_api_key';
   ```
3. 将 `'your_openweather_api_key'` 替换为你的实际API密钥：
   ```typescript
   const OPENWEATHER_API_KEY = '你的API密钥';
   ```

## 免费额度说明

OpenWeatherMap免费版提供：
- 每分钟60次调用
- 每月1,000,000次调用
- 对于个人使用完全足够

## 备用方案

即使不配置API密钥，应用仍然可以正常工作：

1. **智能天气预测**: 基于以下因素生成合理的天气信息：
   - 当前季节（春夏秋冬）
   - 时间（白天/夜晚）
   - 地理位置（纬度影响）
   - 随机波动

2. **季节性天气模式**:
   - 夏季：多晴天、多云
   - 冬季：多阴天、雾霾
   - 春秋：晴天、多云、阴天、小雨

## 隐私说明

- 应用只获取位置坐标用于天气查询
- 不存储或上传位置信息
- 所有数据仅在本地使用

## 故障排除

### 如果天气显示"获取失败"
1. 检查网络连接
2. 确认位置权限已授予
3. 验证API密钥是否正确
4. 检查API调用额度是否超限

### 如果显示"智能预测"
这是正常的备用方案，表示：
- API密钥未配置，或
- 网络连接问题，或
- API服务暂时不可用

应用会自动使用智能算法生成合理的天气信息。

## 支持的天气状况

应用支持以下天气状况的中文显示：
- 晴天 (Clear)
- 多云 (Clouds)
- 雨天 (Rain)
- 雪天 (Snow)
- 雷雨 (Thunderstorm)
- 小雨 (Drizzle)
- 雾霾 (Mist/Haze)
- 雾 (Fog)
- 沙尘 (Dust/Sand)
- 其他特殊天气现象 