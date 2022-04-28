import React from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import Bookshelf from '~/components/Bookshelf';

const { loadSearch } = action;

const Search = ({ navigation: { navigate } }: StackHomeProps) => {
  const { list } = useAppSelector((state) => state.search);
  const dict = useAppSelector((state) => state.dict.manga);
  const keyword = useAppSelector((state) => state.search.keyword);
  const dispatch = useAppDispatch();

  const handleLoadMore = () => {
    dispatch(loadSearch({ keyword }));
  };
  const handleDetail = (id: string) => {
    navigate('Detail', { id });
  };

  return (
    <Bookshelf
      list={list.map((item) => dict[item])}
      loadMore={handleLoadMore}
      itemOnPress={handleDetail}
    />
  );
};

export default Search;
