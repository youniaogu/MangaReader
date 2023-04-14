import React from 'react';
import { Center, Heading, Image, Pressable } from 'native-base';

const taptapGif = require('~/assets/tap_tap.gif');

interface EmptyProps {
  text?: string;
  onPress?: () => void;
}

const Empty = ({ text = 'Nothing Here', onPress }: EmptyProps) => {
  return (
    <Center w="full" h="full" pb={32}>
      <Pressable onPress={onPress}>
        <Image
          w={32}
          h={48}
          resizeMode="contain"
          resizeMethod="resize"
          fadeDuration={0}
          source={taptapGif}
          alt="taptap"
        />
        <Heading color="gray.500" fontWeight="bold" fontSize="md">
          {text}
        </Heading>
      </Pressable>
    </Center>
  );
};

export default Empty;
