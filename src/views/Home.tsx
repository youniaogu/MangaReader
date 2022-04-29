import React, { useEffect } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import Bookshelf from '~/components/Bookshelf';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

const { loadUpdate } = action;
const { LoadStatus } = window;

const Home = ({ navigation: { navigate } }: StackHomeProps) => {
  const { list } = useAppSelector((state) => state.update);
  const loadStatus = useAppSelector((state) => state.update.loadStatus);
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

export default Home;
