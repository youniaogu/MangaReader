import React, { Fragment, useMemo } from 'react';
import { Box, StatusBar, HStack, IconButton, Icon, Text } from 'native-base';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle } from '@react-navigation/elements';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Header = ({ navigation, options, route }: NativeStackHeaderProps) => {
  const title = getHeaderTitle(options, route.name);
  const canGoBack = useMemo(() => navigation.canGoBack(), [navigation]);

  const handleSearch = () => {
    navigation.navigate('Search');
  };
  const handleGoBack = () => {
    navigation.goBack();
  };
  const handleAbout = () => {
    navigation.navigate('About');
  };

  return (
    <Fragment>
      <StatusBar animated barStyle="light-content" />
      <Box safeAreaTop bg="#6200ee" />
      <HStack
        bg="#6200ee"
        px="1"
        py="3"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <HStack flex="1" flexGrow="1" alignItems="center">
          {canGoBack ? (
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={handleGoBack}
            />
          ) : (
            <IconButton icon={<Icon as={MaterialIcons} name="home" size={30} color="white" />} />
          )}
          <Text w="5/6" color="white" fontSize="25" fontWeight="bold" numberOfLines={1}>
            {title}
          </Text>
        </HStack>

        <HStack flexShrink="0">
          <IconButton
            icon={<Icon as={MaterialIcons} name="search" size={30} color="white" />}
            onPress={handleSearch}
          />
          <IconButton
            icon={<Icon as={MaterialIcons} name="info-outline" size={30} color="white" />}
            onPress={handleAbout}
          />
        </HStack>
      </HStack>
    </Fragment>
  );
};

export default Header;
