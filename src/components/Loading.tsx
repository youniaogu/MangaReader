import React from 'react';
import { Image, Center } from 'native-base';

const readingGif = require('~/assets/reading.gif');

const Loading = () => {
  return (
    <Center w="full" h="full" pb={32}>
      <Image w={32} h={48} resizeMode="contain" source={readingGif} alt="reading" />
    </Center>
  );
};

export default Loading;
