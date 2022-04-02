import React, { Fragment, useMemo } from 'react';
import { Box, StatusBar, HStack, IconButton, Icon, Input } from 'native-base';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SearchHeader = ({ navigation }: NativeStackHeaderProps) => {
  const canGoBack = useMemo(() => navigation.canGoBack(), [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <Fragment>
      <StatusBar animated barStyle="light-content" />
      <Box safeAreaTop bg="#6200ee" />
      <HStack bg="#6200ee" px={1} py={3} w="100%" justifyContent="flex-start" alignItems="center">
        {canGoBack ? (
          <IconButton
            icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
            onPress={handleGoBack}
          />
        ) : (
          <IconButton icon={<Icon as={MaterialIcons} name="home" size={30} color="white" />} />
        )}

        <Input
          ml={1}
          mr={3}
          flexGrow={1}
          size="2xl"
          bg="#6200ee"
          color="white"
          variant="underlined"
          placeholder="Underlined"
        />
      </HStack>
    </Fragment>
  );
};

export default SearchHeader;
