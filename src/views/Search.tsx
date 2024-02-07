import React, { useMemo, useState, useEffect, useCallback, Fragment } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { Button, HStack, useDisclose } from 'native-base';
import { nonNullable, AsyncStatus } from '~/utils';
import { PluginMap } from '~/plugins';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import Bookshelf from '~/components/Bookshelf';

const { loadSearch, setSearchFilter } = action;

const Search = ({ route, navigation }: StackSearchProps) => {
  const { keyword, source } = route.params;
  const dispatch = useAppDispatch();
  const dict = useAppSelector((state) => state.dict.manga);
  const list = useAppSelector((state) => state.search.list);
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

  const handleReload = useCallback(() => {
    dispatch(loadSearch({ keyword, source, isReset: true }));
  }, [dispatch, keyword, source]);
  const handleLoadMore = useCallback(() => {
    dispatch(loadSearch({ keyword, source }));
  }, [dispatch, keyword, source]);
  const handleDetail = useCallback(
    (mangaHash: string) => {
      navigation.push('Detail', { mangaHash });
    },
    [navigation]
  );

  return (
    <Fragment>
      <SearchOption />
      <Bookshelf
        emptyText="没找到相关漫画~"
        list={searchList}
        reload={handleReload}
        loadMore={handleLoadMore}
        itemOnPress={handleDetail}
        loading={loadStatus === AsyncStatus.Pending}
      />
    </Fragment>
  );
};

export const SearchOption = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const source = route.params.source;
  const dispatch = useAppDispatch();
  const filter = useAppSelector((state) => state.search.filter);
  const keyword = useAppSelector((state) => state.search.keyword);
  const { isOpen, onOpen, onClose } = useDisclose();
  const [key, setKey] = useState<string>('');
  const [options, setOptions] = useState<OptionItem[]>([]);

  const searchOptions = useMemo(() => {
    return (PluginMap.get(source)?.option.search || []).map((item) => {
      const value = filter[item.name] || item.defaultValue;
      const label = item.options.find((option) => option.value === value)?.label || '';
      return {
        ...item,
        value,
        label,
      };
    });
  }, [source, filter]);

  const handlePress = (name: string, newOptions: OptionItem[]) => {
    return () => {
      setKey(name);
      setOptions(newOptions);
      onOpen();
    };
  };
  const handleChange = (newVal: string) => {
    dispatch(setSearchFilter({ [key]: newVal }));
    dispatch(loadSearch({ keyword, source, isReset: true }));
  };

  if (searchOptions.length <= 0) {
    return null;
  }

  return (
    <HStack safeAreaX px={2} pb={2} bg="purple.500">
      {searchOptions.map((item) => {
        return (
          <Button
            key={item.name}
            variant="ghost"
            _text={{ color: 'white', fontWeight: 'bold' }}
            onPress={handlePress(item.name, item.options)}
          >
            {item.label}
          </Button>
        );
      })}

      <ActionsheetSelect
        isOpen={isOpen}
        onClose={onClose}
        options={options}
        onChange={handleChange}
      />
    </HStack>
  );
};

export default Search;
