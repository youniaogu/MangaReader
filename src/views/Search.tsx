import React, { useMemo, useEffect, useCallback } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { nonNullable, AsyncStatus } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import Bookshelf from '~/components/Bookshelf';

const { loadSearch } = action;

const Search = ({ route, navigation }: StackSearchProps) => {
  const keyword = route.params.keyword;
  const dispatch = useAppDispatch();
  const dict = useAppSelector((state) => state.dict.manga);
  const list = useAppSelector((state) => state.search.list);
  const source = useAppSelector((state) => state.plugin.source);
  const loadStatus = useAppSelector((state) => state.search.loadStatus);
  const searchList = useMemo(
    () => list.map((item) => dict[item]).filter(nonNullable),
    [dict, list]
  );

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: keyword });
    }, [keyword, navigation])
  );
  useEffect(() => {
    dispatch(loadSearch({ keyword, source, isReset: true }));
  }, [dispatch, keyword, source]);

  const handleLoadMore = useCallback(() => {
    dispatch(loadSearch({ keyword, source }));
  }, [dispatch, keyword, source]);
  const handleDetail = useCallback(
    (mangaHash: string) => {
      navigation.navigate('Detail', { mangaHash });
    },
    [navigation]
  );

  return (
    <Bookshelf
      list={searchList}
      loadMore={handleLoadMore}
      itemOnPress={handleDetail}
      loading={loadStatus === AsyncStatus.Pending}
    />
  );
};

export default Search;
