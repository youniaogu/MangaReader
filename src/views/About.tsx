import React from 'react';
import { action, useAppDispatch } from '~/redux';
import { Button, VStack } from 'native-base';

const { clearCache } = action;

const About = () => {
  const dispatch = useAppDispatch();

  const handleCacheClear = () => {
    dispatch(clearCache());
  };

  return (
    <VStack pt="9" space={9} alignItems="center">
      <Button shadow={2} onPress={handleCacheClear}>
        Clear Cache
      </Button>
    </VStack>
  );
};

export default About;
