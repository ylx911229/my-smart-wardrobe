import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // 主色调 - 温暖的木色
    primary: '#8B4513',
    primaryVariant: '#A0522D',
    
    // 辅助色调 - 柔和的色彩
    secondary: '#DEB887',
    secondaryVariant: '#F5DEB3',
    
    // 背景色
    background: '#FFF8DC',
    surface: '#FFFFFF',
    cardBackground: '#FAF0E6',
    
    // 文字颜色
    text: '#4A4A4A',
    textSecondary: '#8B7355',
    textLight: '#FFFFFF',
    
    // 状态颜色
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
    
    // 边框和分割线
    border: '#E0E0E0',
    divider: '#F0F0F0',
    placeholder: '#999999',
    
    // 特殊颜色
    accent: '#CD853F',
    highlight: '#F4A460',
    shadow: 'rgba(139, 69, 19, 0.2)',
  },
  
  // 字体设置
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  
  // 圆角设置
  roundness: 12,
  
  // 自定义尺寸
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // 阴影设置
  shadows: {
    small: {
      shadowColor: '#8B4513',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#8B4513',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#8B4513',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
  },
}; 