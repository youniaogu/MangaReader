import React, { useMemo, Fragment } from 'react';
import {
  Icon,
  Text,
  Image,
  Modal,
  Button,
  VStack,
  Center,
  ScrollView,
  useToast,
  useDisclose,
} from 'native-base';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { AsyncStatus, BackupRestore } from '~/utils';
import { CacheManager } from '@georstat/react-native-image-cache';
import { Linking, Platform } from 'react-native';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import ErrorWithRetry from '~/components/ErrorWithRetry';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpinLoading from '~/components/SpinLoading';
import QrcodeModal from '~/components/QrcodeModal';
import PathModal from '~/components/PathModal';
import Clipboard from '@react-native-clipboard/clipboard';
import LZString from 'lz-string';

const { restore, clearCache, loadLatestRelease, setAndroidDownloadPath } = action;
const christmasGif = require('~/assets/christmas.gif');
const BackupRestoreOptions = [
  { label: '剪贴板', value: BackupRestore.Clipboard },
  { label: '二维码', value: BackupRestore.Qrcode },
];

const About = ({ navigation }: StackAboutProps) => {
  const toast = useToast();
  const { isOpen: isClearing, onOpen: openClearing, onClose: closeClearing } = useDisclose();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclose();
  const { isOpen: isQrcodeOpen, onOpen: onQrcodeOpen, onClose: onQrcodeClose } = useDisclose();
  const { isOpen: isBackupOpen, onOpen: onBackupOpen, onClose: onBackupClose } = useDisclose();
  const { isOpen: isRestoreOpen, onOpen: onRestoreOpen, onClose: onRestoreClose } = useDisclose();
  const {
    isOpen: isAlbumPathOpen,
    onOpen: onAlbumPathOpen,
    onClose: onAlbumPathClose,
  } = useDisclose();
  const dispatch = useAppDispatch();
  const release = useAppSelector((state) => state.release);
  const favorites = useAppSelector((state) => state.favorites);
  const clearStatus = useAppSelector((state) => state.datasync.clearStatus);
  const restoreStatus = useAppSelector((state) => state.datasync.restoreStatus);
  const androidDownloadPath = useAppSelector((state) => state.setting.androidDownloadPath);

  const compressed = useMemo(() => {
    const uncompressed = JSON.stringify({
      createTime: new Date().getTime(),
      favorites: favorites.map((item) => item.mangaHash),
    });
    return LZString.compressToBase64(uncompressed);
  }, [favorites]);

  const handleRetry = () => {
    dispatch(loadLatestRelease());
  };

  const handleBackupChange = (value: string) => {
    if (value === BackupRestore.Clipboard) {
      Clipboard.setString(compressed);
      toast.show({ title: '复制成功' });
    }
    if (value === BackupRestore.Qrcode) {
      onQrcodeOpen();
    }
  };
  const handleRestoreChange = (value: string) => {
    if (value === BackupRestore.Clipboard) {
      Clipboard.hasString().then((hasContent: boolean) => {
        if (hasContent) {
          Clipboard.getString().then((data) => dispatch(restore(data)));
        }
      });
    }
    if (value === BackupRestore.Qrcode) {
      navigation.navigate('Scan');
    }
  };

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
    openClearing();
    CacheManager.clearCache().finally(() => {
      setTimeout(closeClearing, 500);
    });
  };
  const handleStorageCacheClear = () => {
    dispatch(clearCache());
    onModalClose();
  };

  const handleAlbumPathClose = (path: string) => {
    onAlbumPathClose();
    dispatch(setAndroidDownloadPath(path));
  };

  return (
    <ScrollView>
      <VStack space={6} px={6} py={8} safeAreaBottom>
        <VStack alignItems="center">
          <Text fontSize="3xl" fontWeight="bold" color="purple.900">
            {release.name}
          </Text>
          <Text fontSize="md" fontWeight="bold" color="purple.900">
            {`${release.publishTime}  ${release.version}`}
          </Text>
        </VStack>

        {release.loadStatus === AsyncStatus.Pending && <SpinLoading />}
        {release.loadStatus === AsyncStatus.Rejected && (
          <ErrorWithRetry color="black" onRetry={handleRetry} />
        )}
        {release.loadStatus === AsyncStatus.Fulfilled && release.latest === undefined && (
          <Center alignItems="center">
            <Image
              w={24}
              h={32}
              resizeMode="contain"
              resizeMethod="resize"
              fadeDuration={0}
              source={christmasGif}
              alt="christmas"
            />
            <Text pb={4} fontWeight="bold">
              暂无更新
            </Text>
          </Center>
        )}
        {release.loadStatus === AsyncStatus.Fulfilled && release.latest !== undefined && (
          <Fragment>
            <Text fontSize="lg" fontWeight="bold">
              {release.latest.publishTime} {release.latest.version}
            </Text>
            <Text pb={4} fontSize="md" fontWeight="bold">
              {release.latest.changeLog}
            </Text>

            <Button
              shadow={2}
              _text={{ fontWeight: 'bold' }}
              leftIcon={<Icon as={MaterialIcons} name="android" size="lg" />}
              onPress={handleApkDownload}
            >
              APK下载
            </Button>
            <Button
              shadow={2}
              _text={{ fontWeight: 'bold' }}
              leftIcon={<Icon as={MaterialIcons} name="build" size="lg" />}
              onPress={handleIpaDownload}
            >
              IPA下载
            </Button>
          </Fragment>
        )}

        <Button
          shadow={2}
          _text={{ fontWeight: 'bold' }}
          leftIcon={<Icon as={MaterialIcons} name="backup" size="lg" />}
          onPress={onBackupOpen}
        >
          备份
        </Button>
        <Button
          shadow={2}
          isLoading={restoreStatus === AsyncStatus.Pending}
          _text={{ fontWeight: 'bold' }}
          leftIcon={<Icon as={MaterialIcons} name="restore" size="lg" />}
          onPress={onRestoreOpen}
        >
          恢复
        </Button>
        {(Platform.OS === 'android' || __DEV__) && (
          <Button
            shadow={2}
            _text={{ fontWeight: 'bold' }}
            leftIcon={<Icon as={MaterialIcons} name="drive-file-move" size="lg" />}
            onPress={onAlbumPathOpen}
          >
            {`${androidDownloadPath}`}
          </Button>
        )}
        <Button
          shadow={2}
          isLoading={isClearing}
          colorScheme="warning"
          _text={{ fontWeight: 'bold' }}
          leftIcon={<Icon as={MaterialIcons} name="image-not-supported" size="lg" />}
          onPress={handleImageCacheClear}
        >
          清除图片缓存
        </Button>
        {__DEV__ && (
          <Button
            shadow={2}
            isLoading={clearStatus === AsyncStatus.Pending}
            colorScheme="danger"
            _text={{ fontWeight: 'bold' }}
            leftIcon={<Icon as={MaterialIcons} name="clear-all" size="lg" />}
            onPress={onModalOpen}
          >
            清除本地离线数据
          </Button>
        )}
      </VStack>

      <ActionsheetSelect
        isOpen={isBackupOpen}
        onClose={onBackupClose}
        options={BackupRestoreOptions}
        onChange={handleBackupChange}
        headerComponent={
          <Text w="full" pl={4} color="gray.500" fontSize={16}>
            备份
          </Text>
        }
      />
      <ActionsheetSelect
        isOpen={isRestoreOpen}
        onClose={onRestoreClose}
        options={BackupRestoreOptions}
        onChange={handleRestoreChange}
        headerComponent={
          <Text w="full" pl={4} color="gray.500" fontSize={16}>
            恢复
          </Text>
        }
      />
      <Modal size="xl" isOpen={isModalOpen} onClose={onModalClose}>
        <Modal.Content>
          <Modal.Header>警告</Modal.Header>
          <Modal.Body>此操作会清空收藏列表、漫画数据、插件和观看设置，请谨慎！</Modal.Body>
          <Modal.Footer>
            <Button.Group size="sm" space="sm">
              <Button px={5} variant="outline" colorScheme="coolGray" onPress={onModalClose}>
                取消
              </Button>
              <Button px={5} colorScheme="danger" onPress={handleStorageCacheClear}>
                确认
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      <PathModal
        isOpen={isAlbumPathOpen}
        defaultValue={androidDownloadPath}
        onClose={handleAlbumPathClose}
      />
      <QrcodeModal isOpen={isQrcodeOpen} value={compressed} onClose={onQrcodeClose} />
    </ScrollView>
  );
};

export default About;
