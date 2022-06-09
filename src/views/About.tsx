import React, { useEffect, useState } from 'react';
import { action, useAppDispatch, useAppSelector } from '~/redux';
import { Button, VStack, Icon } from 'native-base';
import { CacheManager } from '@georstat/react-native-image-cache';
import { AsyncStatus } from '~/utils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { clearCache } = action;

const About = () => {
  const [clearImage, setClearImage] = useState(false);
  const [clearRedux, setClearRedux] = useState(false);
  const clearStatus = useAppSelector((state) => state.app.clearStatus);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (clearStatus !== AsyncStatus.Pending) {
      setTimeout(() => setClearRedux(false), 500);
    }
  }, [clearStatus]);

  const handleImageCacheClear = () => {
    setClearImage(true);
    CacheManager.clearCache().finally(() => {
      setTimeout(() => setClearImage(false), 500);
    });
  };
  const handleReduxCacheClear = () => {
    setClearRedux(true);
    dispatch(clearCache());
  };

  return (
    <VStack pt={20} space={10} alignItems="center">
      <Button
        shadow={2}
        isLoading={clearImage}
        isLoadingText="Cleaning"
        _text={{ fontWeight: 'bold' }}
        leftIcon={<Icon as={MaterialIcons} name="image-not-supported" size="lg" />}
        onPress={handleImageCacheClear}
      >
        Clear Image Cache
      </Button>
      <Button
        shadow={2}
        colorScheme="danger"
        isLoading={clearRedux}
        isLoadingText="Cleaning"
        _text={{ fontWeight: 'bold' }}
        leftIcon={<Icon as={MaterialIcons} name="hourglass-disabled" size="lg" />}
        onPress={handleReduxCacheClear}
      >
        Clear Redux Cache
      </Button>
    </VStack>
  );
};

export default About;
