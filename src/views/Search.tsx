import React, { useMemo, useCallback } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isManga, AsyncStatus } from '~/utils';
import { useFocusEffect } from '@react-navigation/native';
import Bookshelf from '~/components/Bookshelf';

const { loadSearch } = action;

const Search = ({ route, navigation }: StackSearchProps) => {
  const keyword = route.params.keyword;
  const dispatch = useAppDispatch();
  const dict = useAppSelector((state) => state.dict.manga);
  const loadStatus = useAppSelector((state) => state.search.loadStatus);
  const { list } = useAppSelector((state) => state.search);
  const { source } = useAppSelector((state) => state.plugin);
  const searchList = useMemo(() => list.map((item) => dict[item]).filter(isManga), [dict, list]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: keyword });
    }, [keyword, navigation])
  );

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
