import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Card, Button, Text, ActivityIndicator, Modal, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import VirtualTryOnService from '../services/VirtualTryOnService';
import type { ClothingItem, User } from '../types';

// 根据衣物类别获取部位图标
const getPositionIconName = (category: string): string => {
  const categoryLower = category?.toLowerCase() || '';
  
  if (categoryLower.includes('上衣') || categoryLower.includes('衬衫') || categoryLower.includes('t恤')) {
    return 'body';
  } else if (categoryLower.includes('外套') || categoryLower.includes('夹克') || categoryLower.includes('西装')) {
    return 'body-outline';
  } else if (categoryLower.includes('下装') || categoryLower.includes('裤子') || categoryLower.includes('裙子')) {
    return 'body';
  } else if (categoryLower.includes('鞋子') || categoryLower.includes('靴子') || categoryLower.includes('凉鞋')) {
    return 'footsteps';
  } else if (categoryLower.includes('帽子') || categoryLower.includes('头饰')) {
    return 'person-circle-outline';
  } else if (categoryLower.includes('配饰') || categoryLower.includes('包包') || categoryLower.includes('首饰')) {
    return 'bag-outline';
  } else {
    return 'body'; // 默认图标
  }
};

interface VirtualTryOnProps {
  visible: boolean;
  onDismiss: () => void;
  user: User;
  outfit: ClothingItem[];
  outfitName: string;
}

const VirtualTryOn = ({ visible, onDismiss, user, outfit, outfitName }: VirtualTryOnProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateTryOnEffect = async () => {
    // 验证用户照片
    if (!VirtualTryOnService.validateUserPhoto(user)) {
      Alert.alert('提示', '请先上传用户照片才能生成试穿效果');
      return;
    }

    // 验证穿搭
    const outfitValidation = VirtualTryOnService.validateOutfit(outfit);
    if (!outfitValidation.valid) {
      Alert.alert('提示', outfitValidation.message || '穿搭不完整');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await VirtualTryOnService.generateTryOnEffect({
        user,
        outfit,
        outfitName
      });

      if (result.success) {
        setGeneratedImage(result.imageUrl);
      } else {
        setError(result.error || '生成试穿效果失败');
      }

    } catch (error) {
      console.error('Error generating virtual try-on:', error);
      setError('生成试穿效果失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };



  const handleRetry = () => {
    generateTryOnEffect();
  };

  const handleSaveImage = async () => {
    if (!generatedImage) return;

    try {
      const savedPath = await VirtualTryOnService.saveImageToLocal(generatedImage);
      Alert.alert('保存成功', `试穿效果图已保存：${savedPath}`);
    } catch (error) {
      Alert.alert('保存失败', '无法保存图片，请稍后重试');
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text style={styles.title}>虚拟试穿效果</Text>
              <Button onPress={onDismiss} mode="text" compact>
                关闭
              </Button>
            </View>

            <Text style={styles.subtitle}>{outfitName}</Text>

            {!generatedImage && !isGenerating && !error && (
              <View style={styles.startContainer}>
                <Ionicons 
                  name="shirt-outline" 
                  size={64} 
                  color={theme.colors.primary} 
                />
                <Text style={styles.startText}>点击生成试穿效果</Text>
                <Text style={styles.startSubtext}>
                  AI将为您展示穿搭在身上的效果
                </Text>
                <Button
                  mode="contained"
                  onPress={generateTryOnEffect}
                  style={styles.generateButton}
                  icon="wand-magic"
                >
                  生成试穿效果
                </Button>
              </View>
            )}

            {isGenerating && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>正在生成试穿效果...</Text>
                <Text style={styles.loadingSubtext}>
                  这可能需要几秒钟时间，请耐心等待
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons 
                  name="warning-outline" 
                  size={48} 
                  color={theme.colors.error} 
                />
                <Text style={styles.errorText}>{error}</Text>
                <Button
                  mode="outlined"
                  onPress={handleRetry}
                  style={styles.retryButton}
                  icon="refresh"
                >
                  重新生成
                </Button>
              </View>
            )}

            {generatedImage && (
              <View style={styles.resultContainer}>
                <Image
                  source={{ uri: generatedImage }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
                <View style={styles.resultActions}>
                  <Button
                    mode="outlined"
                    onPress={handleRetry}
                    style={styles.actionButton}
                    icon="refresh"
                  >
                    重新生成
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveImage}
                    style={styles.actionButton}
                    icon="download"
                  >
                    保存图片
                  </Button>
                </View>
              </View>
            )}

            {/* 衣物图片预览 */}
            <View style={styles.outfitPreview}>
              <Text style={styles.previewTitle}>将要试穿的衣物</Text>
              
              <View style={styles.clothingRow}>
                {outfit.map((item, index) => (
                  <View key={item.id} style={styles.clothingItem}>
                    <View style={styles.clothingImageContainer}>
                      <Image
                        source={{ uri: item.imageUri || item.photo_uri || '' }}
                        style={styles.clothingImage}
                        resizeMode="cover"
                      />
                      <View style={styles.positionIcon}>
                        <Ionicons 
                          name={getPositionIconName(item.category_name || item.category) as any}
                          size={12} 
                          color={theme.colors.surface}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              
              {/* 合成说明 */}
              <View style={styles.compositionNote}>
                <Ionicons 
                  name="information-circle-outline" 
                  size={16} 
                  color={theme.colors.primary} 
                />
                <Text style={styles.compositionNoteText}>
                  AI会将上述衣物的实际外观精确地合成到您的身上，保持自然的穿着效果
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: theme.spacing.md,
    maxHeight: '90%',
  },
  
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  
  subtitle: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  
  startContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  
  startText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  startSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  generateButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  resultContainer: {
    alignItems: 'center',
  },
  
  resultImage: {
    width: '100%',
    height: 400,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
  },
  
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  
  outfitPreview: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  

  
  clothingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  
  clothingItem: {
    width: '22%', // 允许一排显示4-5件衣物
    alignItems: 'center',
  },
  
  clothingImageContainer: {
    position: 'relative',
    width: 60,
    height: 75,
  },
  
  clothingImage: {
    width: 60,
    height: 75,
    borderRadius: theme.roundness,
  },
  
  positionIcon: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  compositionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  
  compositionNoteText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: 18,
  },
});

export default VirtualTryOn; 