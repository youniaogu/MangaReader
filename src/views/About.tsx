import React from 'react';
import { Button, VStack } from 'native-base';
import { CacheManager } from '@georstat/react-native-image-cache';

const About = () => {
  const handleImageCacheClear = () => {
    CacheManager.clearCache();
  };

  return (
    <VStack pt={9} space={9} alignItems="center">
      <Button shadow={2} onPress={handleImageCacheClear}>
        Clear Image Cache
      </Button>
    </VStack>
  );
};

export default About;
