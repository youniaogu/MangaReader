import React from 'react';
import { Center, Heading, Image, Pressable } from 'native-base';
import { ColorType } from 'native-base/lib/typescript/components/types';

const taptapGif = require('~/assets/tap_tap.gif');

interface EmptyProps {
  bg?: ColorType;
  color?: ColorType;
  text?: string;
  onPress?: () => void;
}

const Empty = ({
  bg = 'white',
  color = 'gray.500',
  text = 'Nothing Here',
  onPress,
}: EmptyProps) => {
  return (
    <Center w="full" h="full" pb={32} bg={bg}>
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
        <Heading color={color} fontWeight="bold" fontSize="md">
          {text}
        </Heading>
      </Pressable>
    </Center>
  );
};

export default Empty;
