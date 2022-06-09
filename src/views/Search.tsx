import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input, Button, HStack, Actionsheet, Box, useDisclose } from 'native-base';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isManga, AsyncStatus } from '~/utils';
import { Plugin } from '~/plugins';
import Bookshelf from '~/components/Bookshelf';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';
import * as RootNavigation from '~/utils/navigation';

const { loadUpdate, setCurrent } = action;

const Search = ({ navigation: { navigate } }: StackHomeProps) => {
  const { list } = useAppSelector((state) => state.update);
  const { source } = useAppSelector((state) => state.plugin);
  const dict = useAppSelector((state) => state.dict.manga);
  const loadStatus = useAppSelector((state) => state.update.loadStatus);
  const dispatch = useAppDispatch();
  const updateList = useMemo(() => list.map((item) => dict[item]).filter(isManga), [dict, list]);

  useEffect(() => {
    loadStatus === AsyncStatus.Default && dispatch(loadUpdate({ isReset: true, source }));
  }, [dispatch, loadStatus, source]);

  const handleLoadMore = useCallback(() => {
    dispatch(loadUpdate({ source }));
  }, [dispatch, source]);
  const handleDetail = useCallback(
    (mangaHash: string) => {
      navigate('Detail', { mangaHash });
    },
    [navigate]
  );

  if (loadStatus === AsyncStatus.Pending && list.length === 0) {
    return <Loading />;
  }
  if (loadStatus === AsyncStatus.Fulfilled && list.length === 0) {
    return <Empty />;
  }

  return <Bookshelf list={updateList} loadMore={handleLoadMore} itemOnPress={handleDetail} />;
};

export const SearchInput = () => {
  const [keyword, setKeyword] = useState('');
  const { isOpen, onOpen, onClose } = useDisclose();
  const { source, list } = useAppSelector((state) => state.plugin);
  const dispatch = useAppDispatch();

  const handleSearch = () => {
    RootNavigation.navigate('Result', { keyword });
  };
  const handleDisOpen = () => {
    onOpen();
  };
  const handleDisClose = () => {
    onClose();
  };
  const setPlugin = (plugin: Plugin) => {
    return () => {
      dispatch(setCurrent(plugin));
      handleDisClose();
    };
  };

  return (
    <HStack pl={1} pr={2} space={2} flex={1} alignItems="center">
      <Input
        w={0}
        flex={1}
        size="xl"
        bg="#6200ee"
        color="white"
        variant="underlined"
        placeholder="Enter To Search"
        onChangeText={setKeyword}
        onSubmitEditing={handleSearch}
      />
      <Button
        p={0}
        variant="ghost"
        _text={{ color: 'white', fontSize: 'sm', fontWeight: 'bold' }}
        onPress={handleDisOpen}
      >
        {source}
      </Button>

      <Actionsheet isOpen={isOpen} onClose={handleDisClose}>
        <Actionsheet.Content>
          <Box
            w="100%"
            h={60}
            px={4}
            _text={{ color: 'gray.500', fontSize: 16 }}
            justifyContent="center"
          >
            Select Plugin
          </Box>
          {list.map((item) => {
            return (
              <Actionsheet.Item key={item.value} onPress={setPlugin(item.value)}>
                {item.label}
              </Actionsheet.Item>
            );
          })}
        </Actionsheet.Content>
      </Actionsheet>
    </HStack>
  );
};

export default Search;
