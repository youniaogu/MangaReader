import React from 'react';
import { Image, Center } from 'native-base';

const readingGif = require('~/assets/reading.gif');

const Loading = () => {
  return (
    <Center w="full" h="full" pb={48}>
      <Image w="1/3" h="1/3" resizeMode="contain" source={readingGif} alt="bee" />
    </Center>
  );
};

export default Loading;
