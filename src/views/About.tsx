import React, { useCallback } from 'react';
import { Text, Image, Button, VStack, Icon, useDisclose, useToast, Center } from 'native-base';
import { action, useAppDispatch, useAppSelector } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus } from '~/utils';
import { Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';

const iosToastId = 'IOS_TOAST_ID';
const christmasGif = require('~/assets/christmas.gif');
const { clearCache, loadLatestRelease } = action;

const About = () => {
  const {
    isOpen: isImageLoading,
    onOpen: openImageLoading,
    onClose: closeImageLoading,
  } = useDisclose();
  const {
    isOpen: isReduxLoading,
    onOpen: openReduxLoading,
    onClose: closeReduxLoading,
  } = useDisclose();
  const clearStatus = useAppSelector((state) => state.app.clearStatus);
  const release = useAppSelector((state) => state.release);
  const dispatch = useAppDispatch();
  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      if (clearStatus !== AsyncStatus.Pending) {
        setTimeout(closeReduxLoading, 500);
      }
    }, [clearStatus, closeReduxLoading])
  );
  useFocusEffect(
    useCallback(() => {
      dispatch(loadLatestRelease());
    }, [dispatch])
  );

  const handleAndroidDownload = () => {
    if (release.latest) {
      Linking.canOpenURL(release.latest.file?.downloadUrl || '').then((supported) => {
        supported && Linking.openURL(release.latest?.file?.downloadUrl || '');
      });
    }
  };
  const handleImageCacheClear = () => {
    openImageLoading();
    CacheManager.clearCache().finally(() => {
      setTimeout(closeImageLoading, 500);
    });
  };
  const handleReduxCacheClear = () => {
    openReduxLoading();
    dispatch(clearCache());
  };

  return (
    <VStack px={6} py={8}>
      <VStack alignItems="center">
        <Text fontSize="3xl" fontWeight="bold" color="purple.900">
          {release.name}
        </Text>
        <Text fontSize="md" fontWeight="bold" color="purple.900">
          {`${release.publishTime}  ${release.version}`}
        </Text>
      </VStack>

      {release.loadStatus === AsyncStatus.Pending && <SpinLoading />}
      {release.loadStatus === AsyncStatus.Fulfilled && release.latest === undefined && (
        <Center alignItems="center">
          <Image w="1/2" h="1/2" resizeMode="contain" source={christmasGif} alt="christmas" />
          <Text pt={4} fontWeight="bold">
            暂无更新
          </Text>
        </Center>
      )}
      {release.loadStatus === AsyncStatus.Fulfilled && release.latest !== undefined && (
        <>
          <Text pt={8} fontSize="lg" fontWeight="bold">
            {release.latest.publishTime} {release.latest.version}
          </Text>
          <Text pb={8} fontSize="md" fontWeight="bold">
            {release.latest.changeLog}
          </Text>
          <Button
            mb={8}
            shadow={2}
            _text={{ fontWeight: 'bold' }}
            leftIcon={<Icon as={MaterialIcons} name="android" size="lg" />}
            onPress={handleAndroidDownload}
          >
            APK下载
          </Button>
          <Button
            mb={8}
            shadow={2}
            _text={{ fontWeight: 'bold' }}
            leftIcon={<Icon as={MaterialIcons} name="build" size="lg" />}
            onPress={() => {
              if (!toast.isActive(iosToastId)) {
                toast.show({
                  id: iosToastId,
                  placement: 'bottom',
                  title: '代码已上传Github，欢迎Issues和PR',
                  duration: 3000,
                });
              }
            }}
          >
            IOS构建
          </Button>
        </>
      )}

      <Button
        mb={8}
        shadow={2}
        isLoading={isImageLoading}
        isLoadingText="Cleaning"
        _text={{ fontWeight: 'bold' }}
        leftIcon={<Icon as={MaterialIcons} name="image-not-supported" size="lg" />}
        onPress={handleImageCacheClear}
      >
        清理图片缓存
      </Button>
      <Button
        shadow={2}
        colorScheme="danger"
        isLoading={isReduxLoading}
        isLoadingText="Cleaning"
        _text={{ fontWeight: 'bold' }}
        leftIcon={<Icon as={MaterialIcons} name="hourglass-disabled" size="lg" />}
        onPress={handleReduxCacheClear}
      >
        清理数据缓存
      </Button>
    </VStack>
  );
};

export default About;
