import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { Button, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { WardrobeStackParamList } from '../types';

type CameraScreenNavigationProp = StackNavigationProp<
  WardrobeStackParamList,
  'Camera'
>;

type CameraScreenRouteProp = RouteProp<
  WardrobeStackParamList,
  'Camera'
>;

interface CameraScreenProps {
  navigation: CameraScreenNavigationProp;
  route: CameraScreenRouteProp;
}

const CameraScreen = ({ navigation, route }: CameraScreenProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const cameraRef = useRef<CameraView>(null);
  // TODO: 添加回调参数类型定义
  const onPhotoTaken = (route.params as any)?.onPhotoTaken;

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (onPhotoTaken) {
          onPhotoTaken(photo.uri);
        }
        
        navigation.goBack();
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('错误', '拍照失败，请重试');
      }
    }
  };

  const toggleCameraType = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>需要相机权限才能拍照</Text>
        <Button mode="contained" onPress={requestPermission}>
          请求权限
        </Button>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          返回
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        flash={flash}
        ref={cameraRef}
      >
        <View style={styles.cameraContent}>
          {/* 顶部控制栏 */}
          <View style={styles.topControls}>
            <IconButton
              icon="close"
              iconColor={theme.colors.textLight}
              size={28}
              onPress={() => navigation.goBack()}
            />
            <IconButton
              icon={flash === 'off' ? "flash-off" : "flash"}
              iconColor={theme.colors.textLight}
              size={28}
              onPress={toggleFlash}
            />
          </View>

          {/* 底部控制栏 */}
          <View style={styles.bottomControls}>
            <View style={styles.controlsRow}>
              {/* 翻转相机 */}
              <IconButton
                icon="camera-reverse"
                iconColor={theme.colors.textLight}
                size={32}
                onPress={toggleCameraType}
                style={styles.sideButton}
              />

              {/* 拍照按钮 */}
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              {/* 占位按钮 */}
              <View style={styles.sideButton} />
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },

  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },

  permissionText: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text,
  },

  camera: {
    flex: 1,
  },

  cameraContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: theme.spacing.md,
  },

  bottomControls: {
    paddingBottom: 50,
    paddingHorizontal: theme.spacing.md,
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sideButton: {
    width: 48,
    height: 48,
  },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.textLight,
  },

  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.textLight,
  },
});

export default CameraScreen; 