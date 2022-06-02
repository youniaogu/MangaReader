import React, { useCallback, useEffect, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isManga } from '~/utils';
import { Plugin } from '~/plugins';
import Bookshelf from '~/components/Bookshelf';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

const { loadSearch } = action;
const { LoadStatus } = window;

const Search = ({ navigation }: StackResultProps) => {
  const { list } = useAppSelector((state) => state.search);
  const dict = useAppSelector((state) => state.dict.manga);
  const loadStatus = useAppSelector((state) => state.search.loadStatus);
  const keyword = useAppSelector((state) => state.search.keyword);
  const dispatch = useAppDispatch();
  const searchList = useMemo(() => list.map((item) => dict[item]).filter(isManga), [dict, list]);

  useEffect(() => {
    navigation.setOptions({ title: keyword });
  }, [keyword, navigation]);

  const handleLoadMore = useCallback(() => {
    dispatch(loadSearch({ keyword, source: Plugin.MHGM }));
  }, [dispatch, keyword]);
  const handleDetail = useCallback(
    (mangaHash: string) => {
      navigation.navigate('Detail', { mangaHash });
    },
    [navigation]
  );

  if (loadStatus === LoadStatus.Pending && list.length === 0) {
    return <Loading />;
  }
  if (loadStatus === LoadStatus.Fulfilled && list.length === 0) {
    return <Empty />;
  }

  return <Bookshelf list={searchList} loadMore={handleLoadMore} itemOnPress={handleDetail} />;
};

export default Search;
