import React, { Fragment, useMemo } from 'react';
import { Box, StatusBar, HStack, IconButton, Icon, Text } from 'native-base';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle } from '@react-navigation/elements';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const Header = (headerProps: NativeStackHeaderProps) => {
  const { navigation, options, route } = headerProps;
  const title = getHeaderTitle(options, route.name);
  const canGoBack = useMemo(() => navigation.canGoBack(), [navigation]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const { headerLeft, headerRight } = options;

  const Left = headerLeft ? headerLeft({ tintColor: '#6200ee', canGoBack }) : null;
  const Right = headerRight ? headerRight({ tintColor: '#6200ee', canGoBack }) : null;

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
        <HStack flex="1" justifyContent="flex-start" alignItems="center">
          {canGoBack ? (
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={handleGoBack}
            />
          ) : (
            <IconButton icon={<Icon as={MaterialIcons} name="home" size={30} color="white" />} />
          )}
          <Text maxW="5/6" color="white" fontSize="25" fontWeight="bold" numberOfLines={1}>
            {title}
          </Text>
          {Left}
        </HStack>

        {Right}
      </HStack>
    </Fragment>
  );
};

export default Header;
