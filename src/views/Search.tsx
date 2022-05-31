import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isManga } from '~/utils';
import { Plugin } from '~/plugins';
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
  const updateList = useMemo(() => list.map((item) => dict[item]).filter(isManga), [dict, list]);

  useEffect(() => {
    loadStatus === LoadStatus.Default && dispatch(loadUpdate({ source: Plugin.MHGM }));
  }, [dispatch, loadStatus]);

  const handleLoadMore = useCallback(() => {
    dispatch(loadUpdate({ source: Plugin.MHGM }));
  }, [dispatch]);
  const handleDetail = useCallback(
    (mangaHash: string) => {
      navigate('Detail', { mangaHash });
    },
    [navigate]
  );

  if (loadStatus === LoadStatus.Pending && list.length === 0) {
    return <Loading />;
  }
  if (loadStatus === LoadStatus.Fulfilled && list.length === 0) {
    return <Empty />;
  }

  return <Bookshelf list={updateList} loadMore={handleLoadMore} itemOnPress={handleDetail} />;
};

export const SearchInput = () => {
  const [keyword, setKeyword] = useState('');
  const dispatch = useAppDispatch();

  const handleSearch = () => {
    dispatch(loadSearch({ source: Plugin.MHGM, keyword, isReset: true }));
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
      placeholder="Press Enter To Search"
      onChangeText={setKeyword}
      onSubmitEditing={handleSearch}
    />
  );
};

export default Search;
