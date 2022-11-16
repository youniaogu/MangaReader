import React from 'react';
import { Center, Heading, Image } from 'native-base';

const beeGif = require('~/assets/tap_tap.gif');

interface EmptyProps {
  text?: string;
}

const Empty = ({ text = 'Nothing Here' }: EmptyProps) => {
  return (
    <Center w="full" h="full" pb={48}>
      <Image w="1/3" h="1/3" resizeMode="contain" source={beeGif} alt="bee" />
      <Heading color="gray.500" fontWeight="bold" fontSize="2xl" pt={1}>
        {text}
      </Heading>
    </Center>
  );
};

export default Empty;
