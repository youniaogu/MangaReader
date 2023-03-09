import React, { Fragment, useMemo } from 'react';
import { StatusBar, HStack, Text, useTheme } from 'native-base';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle } from '@react-navigation/elements';
import VectorIcon from '~/components/VectorIcon';
import Shake from '~/components/Shake';

interface HeaderProps extends NativeStackHeaderProps {
  enableShake?: boolean;
}

const Header = ({ navigation, options, route, enableShake = false }: HeaderProps) => {
  const { colors } = useTheme();
  const title = getHeaderTitle(options, route.name);
  const canGoBack = useMemo(() => navigation.canGoBack(), [navigation]);

  const handleAbout = () => {
    navigation.navigate('About');
  };
  const handleBack = () => {
    navigation.goBack();
  };

  const { headerLeft, headerRight } = options;

  const Left = headerLeft ? headerLeft({ canGoBack }) : null;
  const Right = headerRight ? headerRight({ canGoBack }) : null;

  return (
    <Fragment>
      <StatusBar animated backgroundColor={colors.purple[500]} barStyle="light-content" />
      <HStack
        bg="purple.500"
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
            <VectorIcon name="arrow-back" size="2xl" onPress={handleBack} />
          ) : (
            <Shake enable={enableShake}>
              <VectorIcon name="home" size="2xl" onPress={handleAbout} />
            </Shake>
          )}
          {title !== '' && (
            <Text flex={1} color="white" fontSize={25} fontWeight="bold" numberOfLines={1}>
              {title}
            </Text>
          )}
          {Left}
        </HStack>

        {Right}
      </HStack>
    </Fragment>
  );
};

export default Header;
