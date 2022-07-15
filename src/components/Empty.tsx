import React from 'react';
import { Center, Heading, Image } from 'native-base';

const beeGif = require('~/assets/tap_tap.gif');

const Empty = () => {
  return (
    <Center w="full" h="full" pb={48}>
      <Image w="1/3" h="1/3" resizeMode="contain" source={beeGif} alt="bee" />
      <Heading color="gray.500" fontWeight="bold" fontSize="2xl" pt={1}>
        404 - Not Found
      </Heading>
    </Center>
  );
};

export default Empty;
