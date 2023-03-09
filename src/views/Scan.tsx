import 'react-native-reanimated';
import React, { useState, useCallback } from 'react';
import { Barcode, scanBarcodes, BarcodeFormat, BarcodeValueType } from 'vision-camera-code-scanner';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { action, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { Box, HStack } from 'native-base';
import { StyleSheet } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import VectorIcon from '~/components/VectorIcon';

const { restore } = action;

const Scan = ({ navigation }: StackScanProps) => {
  const devices = useCameraDevices();
  const device = devices.back;
  const dispatch = useAppDispatch();
  const [isActive, setIsActive] = useState(true);
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE], { checkInverted: true });
    runOnJS(setBarcodes)(detectedBarcodes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      Camera.requestCameraPermission().then((permission) => {
        setHasPermission(permission === 'authorized');
      });
    }, [])
  );
  useFocusEffect(
    useCallback(() => {
      const textBarcode = barcodes.find((item) => item.content.type === BarcodeValueType.TEXT);

      if (!textBarcode) {
        return;
      }

      setIsActive(false);
      dispatch(restore(textBarcode.displayValue || ''));
      navigation.goBack();
    }, [barcodes, dispatch, navigation])
  );

  const handleBack = () => {
    navigation.goBack();
  };
  // const handleAlbum = () => {};

  if (device == null) {
    return null;
  }
  if (!hasPermission) {
    return null;
  }

  return (
    <Box position="relative" bg="black">
      <Camera
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
        style={styles.absoluteFill}
      />

      <HStack
        px={3}
        py={1}
        flex={1}
        position="absolute"
        top={0}
        left={0}
        right={0}
        justifyContent="space-between"
        safeAreaTop
      >
        <VectorIcon name="arrow-back" borderRadius="full" onPress={handleBack} bg="#b2b7c04d" />
        {/* <VectorIcon name="image" borderRadius="full" onPress={handleAlbum} bg="#b2b7c04d" /> */}
      </HStack>
    </Box>
  );
};

const styles = StyleSheet.create({
  absoluteFill: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});

export default Scan;
