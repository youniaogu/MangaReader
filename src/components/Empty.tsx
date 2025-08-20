import React from 'react';
import { Center, Text, Image, Pressable } from 'native-base';
import { ColorType } from 'native-base/lib/typescript/components/types';

const taptapGif = require('~/assets/tap_tap.gif');
interface EmptyProps {
  bg?: ColorType;
  color?: ColorType;
  text?: string;
  onPress?: () => void;
}

const Empty = ({ bg = 'white', color = 'gray.500', text = '', onPress }: EmptyProps) => {
  return (
    <Center w="full" h="full" safeAreaX safeAreaBottom bg={bg}>
      <Pressable onPress={onPress}>
        <Image
          w={32}
          h={32}
          resizeMode="contain"
          resizeMethod="resize"
          fadeDuration={0}
          source={taptapGif}
          alt="taptap"
        />
        {text && (
          <Text color={color} textAlign="center" fontWeight="bold" fontSize="md">
            {text}
          </Text>
        )}
      </Pressable>
    </Center>
  );
};

export default Empty;
