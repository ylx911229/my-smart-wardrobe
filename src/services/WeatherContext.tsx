import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Location from 'expo-location';
import { getWeatherInfo, WeatherInfo } from './WeatherService';

interface WeatherContextType {
  weather: WeatherInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
}

interface WeatherContextProps {
  children: ReactNode;
}

const WeatherContext = createContext<WeatherContextType | null>(null);

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

export const WeatherProvider: React.FC<WeatherContextProps> = ({ children }) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // App启动时立即加载天气
    loadWeatherInfo();
  }, []);

  const loadWeatherInfo = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // 请求位置权限
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied, using default weather');
        setWeather({ 
          temperature: 22, 
          condition: '晴天', 
          description: '位置权限未授予，显示默认天气' 
        });
        setIsLoading(false);
        return;
      }

      // 获取当前位置
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // 使用平衡精度，更快获取结果
      });

      // 获取天气信息
      const weatherInfo = await getWeatherInfo(location.coords);
      setWeather(weatherInfo);
      
      console.log('Weather loaded successfully:', weatherInfo);

    } catch (locationError) {
      console.warn('Location or weather fetch failed:', locationError);
      
      // 如果获取位置失败，使用默认天气
      setWeather({ 
        temperature: 22, 
        condition: '晴天', 
        description: '获取位置失败，显示默认天气' 
      });
      setError('无法获取位置信息');
      
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWeather = async (): Promise<void> => {
    await loadWeatherInfo();
  };

  const value: WeatherContextType = {
    weather,
    isLoading,
    error,
    refreshWeather,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}; 