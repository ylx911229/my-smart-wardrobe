import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { Camera } from 'expo-camera';
import { Button, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';

const CameraScreen = ({ navigation, route }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef(null);
  const { onPhotoTaken } = route.params || {};

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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
    setType(
      type === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>需要相机权限才能拍照</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          返回
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        style={styles.camera} 
        type={type} 
        flashMode={flashMode}
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
              icon={flashMode === Camera.Constants.FlashMode.off ? "flash-off" : "flash"}
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
      </Camera>
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