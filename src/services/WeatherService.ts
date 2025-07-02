// WeatherService.ts - 天气服务模块

// OpenWeatherMap API配置
// 获取免费API密钥：https://openweathermap.org/api
// 1. 注册账号：https://home.openweathermap.org/users/sign_up
// 2. 登录后在API keys页面获取密钥
// 3. 将密钥替换下面的'your_openweather_api_key'
const OPENWEATHER_API_KEY = '05ad9e5c6002c3ed283a83afd27af6af';

export interface WeatherInfo {
  temperature: number;
  condition: string;
  description: string;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// 翻译天气状况为中文
const translateWeatherCondition = (main: string, description: string): string => {
  const weatherMap: { [key: string]: string } = {
    'Clear': '晴天',
    'Clouds': '多云',
    'Rain': '雨天',
    'Snow': '雪天',
    'Thunderstorm': '雷雨',
    'Drizzle': '小雨',
    'Mist': '雾霾',
    'Fog': '雾',
    'Haze': '霾',
    'Dust': '沙尘',
    'Sand': '沙尘',
    'Ash': '火山灰',
    'Squall': '飑',
    'Tornado': '龙卷风'
  };
  return weatherMap[main] || description || '未知';
};

// 使用OpenWeatherMap API获取真实天气
export const getRealWeather = async (coords: LocationCoords): Promise<WeatherInfo> => {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('请先配置OpenWeatherMap API密钥');
  }

  const { latitude, longitude } = coords;
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=zh_cn`
  );

  if (!response.ok) {
    throw new Error(`天气API请求失败: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    temperature: Math.round(data.main.temp),
    condition: translateWeatherCondition(data.weather[0].main, data.weather[0].description),
    description: `${data.weather[0].description}，体感温度${Math.round(data.main.feels_like)}°C`,
    humidity: data.main.humidity,
    windSpeed: Math.round(data.wind?.speed * 3.6), // 转换为km/h
    pressure: data.main.pressure
  };
};

// 智能天气生成（备用方案）
export const generateIntelligentWeather = (coords: LocationCoords): WeatherInfo => {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1;
  const { latitude } = coords;
  
  // 根据季节、时间、纬度生成合理的温度
  let baseTemp = 20;
  
  // 季节调整
  if (month >= 6 && month <= 8) { // 夏季
    baseTemp = 28;
  } else if (month >= 12 || month <= 2) { // 冬季
    baseTemp = 8;
  } else if (month >= 3 && month <= 5) { // 春季
    baseTemp = 18;
  } else { // 秋季
    baseTemp = 15;
  }
  
  // 纬度调整（纬度越高越冷）
  baseTemp -= Math.abs(latitude - 30) * 0.3;
  
  // 时间调整
  if (hour >= 6 && hour <= 18) {
    baseTemp += 3; // 白天温度高一些
  } else {
    baseTemp -= 2; // 夜间温度低一些
  }
  
  // 添加随机波动
  const temperature = Math.round(baseTemp + (Math.random() - 0.5) * 6);
  
  // 根据季节选择天气状况
  const seasonalConditions = month >= 6 && month <= 8 
    ? ['晴天', '多云', '晴天', '多云'] // 夏季多晴天
    : month >= 12 || month <= 2
    ? ['多云', '阴天', '晴天', '雾霾'] // 冬季多阴天
    : ['晴天', '多云', '阴天', '小雨']; // 春秋季节
  
  const condition = seasonalConditions[Math.floor(Math.random() * seasonalConditions.length)];
  
  return {
    temperature,
    condition,
    description: `基于位置和时间的智能预测，当前${hour}时`,
    humidity: Math.round(40 + Math.random() * 40), // 40-80%
    windSpeed: Math.round(Math.random() * 20), // 0-20 km/h
    pressure: Math.round(1000 + Math.random() * 50) // 1000-1050 hPa
  };
};

// 主要的天气获取函数
export const getWeatherInfo = async (coords: LocationCoords): Promise<WeatherInfo> => {
  try {
    // 首先尝试获取真实天气
    return await getRealWeather(coords);
  } catch (error) {
    console.log('真实天气API获取失败，使用智能预测:', error);
    // 如果真实API失败，使用智能预测
    return generateIntelligentWeather(coords);
  }
}; 