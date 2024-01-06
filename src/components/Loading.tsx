import React from 'react';
import { Image, Center } from 'native-base';

const readingGif = require('~/assets/reading.gif');

const Loading = () => {
  return (
    <Center w="full" h="full" safeAreaX safeAreaBottom>
      <Image
        w={32}
        resizeMode="contain"
        resizeMethod="resize"
        fadeDuration={0}
        source={readingGif}
        alt="reading"
      />
    </Center>
  );
};

export default Loading;
