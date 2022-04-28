import React, { Fragment, useMemo, useState } from 'react';
import { Box, StatusBar, HStack, IconButton, Icon, Input } from 'native-base';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { action, useAppDispatch } from '~/redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { loadSearch } = action;

const SearchHeader = ({ navigation }: NativeStackHeaderProps) => {
  const [keyword, setKeyword] = useState('');
  const canGoBack = useMemo(() => navigation.canGoBack(), [navigation]);
  const dispatch = useAppDispatch();

  const handleGoBack = () => {
    navigation.goBack();
  };
  const handleSearch = () => {
    dispatch(loadSearch({ keyword, isReset: true }));
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
          placeholder="press enter to search"
          onChangeText={setKeyword}
          onSubmitEditing={handleSearch}
        />
      </HStack>
    </Fragment>
  );
};

export default SearchHeader;
