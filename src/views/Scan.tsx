import 'react-native-reanimated';
import React, { useState } from 'react';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { Box, Text, Icon, HStack, IconButton } from 'native-base';
import { Barcode, scanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { StyleSheet } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Center } from 'native-base';

const Scan = ({ navigation }: StackScanProps) => {
  const devices = useCameraDevices();
  const device = devices.back;
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE], { checkInverted: true });
    runOnJS(setBarcodes)(detectedBarcodes);
  }, []);

  Camera.requestCameraPermission().then((permission) => {
    console.log(permission);
  });

  const handleBack = () => {
    navigation.goBack();
  };
  const handleAlbum = () => {};

  if (device == null) {
    return null;
  }

  return (
    <Box position="relative" bg="black">
      <Camera
        style={styles.absoluteFill}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
        device={device}
        isActive={true}
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
        <IconButton
          icon={<Icon as={MaterialIcons} name="arrow-back" size="xl" color="white" />}
          borderRadius="full"
          onPress={handleBack}
          bg="#b2b7c04d"
        />

        <IconButton
          disabled
          icon={<Icon as={MaterialIcons} name="image" size="xl" color="white" />}
          borderRadius="full"
          onPress={handleAlbum}
        />
      </HStack>

      <Center position="absolute" top={0} left={0} right={0} bottom={0} safeAreaY>
        {barcodes.map((barcode, idx) => (
          <Text key={idx} style={styles.barcodeTextURL}>
            {barcode.displayValue}
          </Text>
        ))}
      </Center>
    </Box>
  );
};

const styles = StyleSheet.create({
  absoluteFill: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Scan;
