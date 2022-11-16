import React, { useEffect } from 'react';
import { Icon, Text, Image, Button, VStack, Center, ScrollView, useDisclose } from 'native-base';
import { action, useAppDispatch, useAppSelector } from '~/redux';
import { CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus } from '~/utils';
import { Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';

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

  useEffect(() => {
    dispatch(loadLatestRelease());
  }, [dispatch]);
  useEffect(() => {
    if (clearStatus !== AsyncStatus.Pending) {
      setTimeout(closeReduxLoading, 500);
    }
  }, [clearStatus, closeReduxLoading]);

  const handleApkDownload = () => {
    if (release.latest) {
      Linking.canOpenURL(release.latest.file?.apk.downloadUrl || '').then((supported) => {
        supported && Linking.openURL(release.latest?.file?.apk.downloadUrl || '');
      });
    }
  };
  const handleIpaDownload = () => {
    if (release.latest) {
      Linking.canOpenURL(release.latest.file?.ipa.downloadUrl || '').then((supported) => {
        supported && Linking.openURL(release.latest?.file?.ipa.downloadUrl || '');
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
    <ScrollView>
      <VStack px={6} py={8} safeAreaBottom>
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
              onPress={handleApkDownload}
            >
              APK下载
            </Button>
            <Button
              mb={8}
              shadow={2}
              _text={{ fontWeight: 'bold' }}
              leftIcon={<Icon as={MaterialIcons} name="build" size="lg" />}
              onPress={handleIpaDownload}
            >
              IPA下载
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
    </ScrollView>
  );
};

export default About;
