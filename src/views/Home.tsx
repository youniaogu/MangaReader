import React, { useEffect } from 'react';
import { action, useAppSelector, useAppDispatch } from '~redux';
import Bookshelf from '~components/Bookshelf';

const { loadUpdate } = action;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const { list } = useAppSelector((state) => state.update);
  const dict = useAppSelector((state) => state.dict.manga);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadUpdate(true));
  }, [dispatch]);

  const handleLoadMore = () => {
    dispatch(loadUpdate());
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

export default Home;
