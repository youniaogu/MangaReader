import React, { useState, useEffect } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { Input } from 'native-base';
import Bookshelf from '~/components/Bookshelf';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';
import * as RootNavigation from '~/utils/navigation';

const { loadUpdate, loadSearch } = action;
const { LoadStatus } = window;

const Search = ({ navigation: { navigate } }: StackHomeProps) => {
  const { list } = useAppSelector((state) => state.update);
  const dict = useAppSelector((state) => state.dict.manga);
  const loadStatus = useAppSelector((state) => state.update.loadStatus);
  const dispatch = useAppDispatch();

  useEffect(() => {
    loadStatus === LoadStatus.Default && dispatch(loadUpdate(true));
  }, [dispatch, loadStatus]);

  const handleLoadMore = () => {
    dispatch(loadUpdate());
  };
  const handleDetail = (id: string) => {
    navigate('Detail', { id });
  };

  if (loadStatus === LoadStatus.Pending && list.length === 0) {
    return <Loading />;
  }
  if (loadStatus === LoadStatus.Fulfilled && list.length === 0) {
    return <Empty />;
  }

  return (
    <Bookshelf
      list={list.map((item) => dict[item]).filter((item) => item !== undefined)}
      loadMore={handleLoadMore}
      itemOnPress={handleDetail}
    />
  );
};

export const SearchInput = () => {
  const [keyword, setKeyword] = useState('');
  const dispatch = useAppDispatch();

  const handleSearch = () => {
    dispatch(loadSearch({ keyword, isReset: true }));
    RootNavigation.navigate('Result');
  };

  return (
    <Input
      ml={1}
      mr={30}
      w="4/5"
      size="2xl"
      bg="#6200ee"
      color="white"
      variant="underlined"
      placeholder="press enter to search"
      onChangeText={setKeyword}
      onSubmitEditing={handleSearch}
    />
  );
};

export default Search;
