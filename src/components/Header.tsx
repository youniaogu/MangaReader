import React, { Fragment, useMemo } from 'react';
import { StatusBar, HStack, IconButton, Icon, Text } from 'native-base';
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
      <StatusBar animated backgroundColor="black" barStyle="light-content" />
      <HStack
        bg="#6200ee"
        p={1}
        w="full"
        justifyContent="space-between"
        alignItems="center"
        safeAreaTop
        safeAreaLeft
        safeAreaRight
      >
        <HStack flex={1} flexGrow={1} justifyContent="flex-start" alignItems="center">
          {canGoBack ? (
            <IconButton
              icon={<Icon as={MaterialIcons} name="arrow-back" size={30} color="white" />}
              onPress={handleGoBack}
            />
          ) : (
            <IconButton icon={<Icon as={MaterialIcons} name="home" size={30} color="white" />} />
          )}
          <Text maxW="5/6" color="white" fontSize={25} fontWeight="bold" numberOfLines={1}>
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
