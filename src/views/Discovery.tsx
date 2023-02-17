import React, { useMemo, useState, useCallback, Fragment } from 'react';
import { Icon, Text, Input, Button, HStack, IconButton, useDisclose } from 'native-base';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { nonNullable, AsyncStatus } from '~/utils';
import { Plugin, PluginMap } from '~/plugins';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Bookshelf from '~/components/Bookshelf';
import * as RootNavigation from '~/utils/navigation';

const { loadDiscovery, setSource, setDiscoveryFilter } = action;

const Discovery = ({ navigation: { navigate } }: StackDiscoveryProps) => {
  const dispatch = useAppDispatch();
  const dict = useAppSelector((state) => state.dict.manga);
  const list = useAppSelector((state) => state.discovery.list);
  const source = useAppSelector((state) => state.plugin.source);
  const loadStatus = useAppSelector((state) => state.discovery.loadStatus);
  const updateList = useMemo(
    () => list.map((item) => dict[item]).filter(nonNullable),
    [dict, list]
  );

  useFocusEffect(
    useCallback(() => {
      loadStatus === AsyncStatus.Default && dispatch(loadDiscovery({ isReset: true, source }));
    }, [dispatch, loadStatus, source])
  );

  const handleLoadMore = useCallback(() => {
    dispatch(loadDiscovery({ source }));
  }, [dispatch, source]);
  const handleDetail = useCallback(
    (mangaHash: string) => {
      navigate('Detail', { mangaHash });
    },
    [navigate]
  );

  return (
    <Fragment>
      <SearchOption />
      <Bookshelf
        list={updateList}
        loadMore={handleLoadMore}
        itemOnPress={handleDetail}
        loading={loadStatus === AsyncStatus.Pending}
      />
    </Fragment>
  );
};

export const SearchOption = () => {
  const dispatch = useAppDispatch();
  const { source } = useAppSelector((state) => state.plugin);
  const { filter } = useAppSelector((state) => state.discovery);
  const { isOpen, onOpen, onClose } = useDisclose();
  const [key, setKey] = useState<string>('');
  const [options, setOptions] = useState<OptionItem[]>([]);

  const discoveryOptions = useMemo(() => {
    return (PluginMap.get(source)?.option.discovery || []).map((item) => {
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
    dispatch(setDiscoveryFilter({ [key]: newVal }));
    dispatch(loadDiscovery({ source, isReset: true }));
  };

  if (discoveryOptions.length <= 0) {
    return null;
  }

  return (
    <HStack px={2} pb={2} bg="purple.500">
      {discoveryOptions.map((item) => {
        return (
          <Button
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

export const PluginSelect = () => {
  const { isOpen, onOpen: handleOpen, onClose: handleClose } = useDisclose();
  const { source, list } = useAppSelector((state) => state.plugin);
  const route = useRoute<RouteProp<RootStackParamList, 'Discovery' | 'Search'>>();
  const dispatch = useAppDispatch();
  const options = useMemo<{ label: string; value: string }[]>(() => {
    return list
      .filter((item) => !item.disabled)
      .map((item) => ({ label: item.label, value: item.value }));
  }, [list]);
  const plugin = useMemo(() => {
    if (route.name === 'Discovery') {
      return source;
    }
    if (route.name === 'Search') {
      return route.params?.source;
    }
    return source;
  }, [route.name, route.params?.source, source]);
  const pluginLabel = useMemo(() => {
    return list.find((item) => item.value === plugin)?.label || plugin;
  }, [list, plugin]);

  const handleChange = (newSource: string) => {
    if (route.name === 'Discovery') {
      dispatch(setSource(newSource as Plugin));
    }
    if (route.name === 'Search') {
      RootNavigation.setParams({ source: newSource as Plugin });
    }
  };
  const handleSetting = () => {
    handleClose();
    RootNavigation.navigate('Plugin');
  };

  return (
    <>
      <Button
        pr={2}
        variant="ghost"
        _text={{ color: 'white', fontSize: 'sm', fontWeight: 'bold' }}
        onPress={handleOpen}
      >
        {pluginLabel}
      </Button>
      <ActionsheetSelect
        isOpen={isOpen}
        options={options}
        onClose={handleClose}
        onChange={handleChange}
        headerComponent={
          <HStack w="full" pl={4} alignItems="center" justifyContent="space-between">
            <Text color="gray.500" fontSize={16}>
              选择插件
            </Text>
            <IconButton
              icon={<Icon as={MaterialIcons} name="settings" size="lg" color="gray.500" />}
              onPress={handleSetting}
            />
          </HStack>
        }
      />
    </>
  );
};

export const SearchAndPlugin = () => {
  const [keyword, setKeyword] = useState('');
  const source = useAppSelector((state) => state.plugin.source);

  const handleSearch = () => {
    RootNavigation.navigate('Search', { keyword, source });
  };

  return (
    <HStack space={2} flex={1} alignItems="center">
      <Input
        pl={1}
        w={0}
        flex={1}
        size="xl"
        bg="purple.500"
        color="white"
        variant="underlined"
        placeholder="请输入漫画名"
        onChangeText={setKeyword}
        onSubmitEditing={handleSearch}
      />
      <PluginSelect />
    </HStack>
  );
};

export default Discovery;
