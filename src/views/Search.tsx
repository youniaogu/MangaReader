import React from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import Bookshelf from '~/components/Bookshelf';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

const { loadSearch } = action;
const { LoadStatus } = window;

const Search = ({ navigation: { navigate } }: StackHomeProps) => {
  const { list } = useAppSelector((state) => state.search);
  const dict = useAppSelector((state) => state.dict.manga);
  const loadStatus = useAppSelector((state) => state.search.loadStatus);
  const keyword = useAppSelector((state) => state.search.keyword);
  const dispatch = useAppDispatch();

  const handleLoadMore = () => {
    dispatch(loadSearch({ keyword }));
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
      list={list.map((item) => dict[item])}
      loadMore={handleLoadMore}
      itemOnPress={handleDetail}
    />
  );
};

export default Search;
