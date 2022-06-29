import React, { useCallback, useEffect, useMemo } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isManga, AsyncStatus } from '~/utils';
import Bookshelf from '~/components/Bookshelf';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

const { loadSearch } = action;

const Search = ({ route, navigation }: StackSearchProps) => {
  const keyword = route.params.keyword;
  const dict = useAppSelector((state) => state.dict.manga);
  const loadStatus = useAppSelector((state) => state.search.loadStatus);
  const { list } = useAppSelector((state) => state.search);
  const { source } = useAppSelector((state) => state.plugin);
  const dispatch = useAppDispatch();
  const searchList = useMemo(() => list.map((item) => dict[item]).filter(isManga), [dict, list]);

  useEffect(() => {
    navigation.setOptions({ title: keyword });
  }, [keyword, navigation]);
  useEffect(() => {
    dispatch(loadSearch({ keyword, source, isReset: true }));
  }, [dispatch, keyword, source]);

  const handleLoadMore = useCallback(() => {
    loadStatus !== AsyncStatus.Pending && dispatch(loadSearch({ keyword, source }));
  }, [dispatch, keyword, source, loadStatus]);
  const handleDetail = useCallback(
    (mangaHash: string) => {
      navigation.navigate('Detail', { mangaHash });
    },
    [navigation]
  );

  if (loadStatus === AsyncStatus.Pending && list.length === 0) {
    return <Loading />;
  }
  if (loadStatus === AsyncStatus.Fulfilled && list.length === 0) {
    return <Empty />;
  }

  return <Bookshelf list={searchList} loadMore={handleLoadMore} itemOnPress={handleDetail} />;
};

export default Search;
