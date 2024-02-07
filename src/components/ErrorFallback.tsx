import React from 'react';
import { Button, VStack, Image, Text } from 'native-base';
import { FallbackProps } from 'react-error-boundary';

const thisIsTrueGif = require('~/assets/this_is_true.gif');

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <VStack w="full" h="full" px={1} space={1} alignItems="center" justifyContent="center">
      <Image
        w={32}
        h={32}
        resizeMode="contain"
        resizeMethod="resize"
        fadeDuration={0}
        source={thisIsTrueGif}
        alt="this_is_true"
      />
      <Text pt={3} pb={1} fontSize="md" fontWeight="bold">
        非常抱歉，应用遇到未知错误:
      </Text>
      <Text fontSize="md" color="red.500">
        {error.message}
      </Text>
      <Button variant="link" size="lg" onPress={resetErrorBoundary}>
        重试
      </Button>
    </VStack>
  );
};

export default ErrorFallback;
