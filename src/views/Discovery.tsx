import React, { useMemo, useState, useCallback, Fragment } from 'react';
import { Icon, Text, Input, Button, HStack, IconButton, useDisclose } from 'native-base';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { isManga, AsyncStatus } from '~/utils';
import { Plugin, PluginMap } from '~/plugins';
import { useFocusEffect } from '@react-navigation/native';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Bookshelf from '~/components/Bookshelf';
import * as RootNavigation from '~/utils/navigation';

const { loadDiscovery, setSource, setType, setRegion, setStatus, setSort } = action;

const Discovery = ({ navigation: { navigate } }: StackDiscoveryProps) => {
  const dispatch = useAppDispatch();
  const dict = useAppSelector((state) => state.dict.manga);
  const list = useAppSelector((state) => state.discovery.list);
  const source = useAppSelector((state) => state.plugin.source);
  const loadStatus = useAppSelector((state) => state.discovery.loadStatus);
  const updateList = useMemo(() => list.map((item) => dict[item]).filter(isManga), [dict, list]);

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
  const { type, region, status, sort } = useAppSelector((state) => state.discovery);
  const { isOpen: isTypeOpen, onOpen: onTypeOpen, onClose: onTypeClose } = useDisclose();
  const { isOpen: isRegionOpen, onOpen: onRegionOpen, onClose: onRegionClose } = useDisclose();
  const { isOpen: isStatusOpen, onOpen: onStatusOpen, onClose: onStatusClose } = useDisclose();
  const { isOpen: isSortOpen, onOpen: onSortOpen, onClose: onSortClose } = useDisclose();
  const [typeOptions = [], regionOptions = [], statusOptions = [], sortOptions = []] =
    useMemo(() => {
      const plugin = PluginMap.get(source);
      return [
        plugin?.typeOptions,
        plugin?.regionOptions,
        plugin?.statusOptions,
        plugin?.sortOptions,
      ];
    }, [source]);
  const typeLabel = useMemo(() => {
    return typeOptions.find((item) => item.value === type)?.label || type;
  }, [type, typeOptions]);
  const regionLabel = useMemo(() => {
    return regionOptions.find((item) => item.value === region)?.label || region;
  }, [region, regionOptions]);
  const statusLabel = useMemo(() => {
    return statusOptions.find((item) => item.value === status)?.label || status;
  }, [status, statusOptions]);
  const sortLabel = useMemo(() => {
    return sortOptions.find((item) => item.value === sort)?.label || sort;
  }, [sort, sortOptions]);

  const handleTypeChange = (newType: string) => {
    dispatch(setType(newType));
    dispatch(loadDiscovery({ source, isReset: true }));
  };
  const handleRegionChange = (newRegion: string) => {
    dispatch(setRegion(newRegion));
    dispatch(loadDiscovery({ source, isReset: true }));
  };
  const handleStatusChange = (newStatus: string) => {
    dispatch(setStatus(newStatus));
    dispatch(loadDiscovery({ source, isReset: true }));
  };
  const handleSortChange = (newSort: string) => {
    dispatch(setSort(newSort));
    dispatch(loadDiscovery({ source, isReset: true }));
  };

  return (
    <HStack px={2} pb={2} bg="purple.500">
      {typeOptions.length > 1 && (
        <Button variant="ghost" _text={{ color: 'white', fontWeight: 'bold' }} onPress={onTypeOpen}>
          {typeLabel}
        </Button>
      )}
      {regionOptions.length > 1 && (
        <Button
          variant="ghost"
          _text={{ color: 'white', fontWeight: 'bold' }}
          onPress={onRegionOpen}
        >
          {regionLabel}
        </Button>
      )}
      {statusOptions.length > 1 && (
        <Button
          variant="ghost"
          _text={{ color: 'white', fontWeight: 'bold' }}
          onPress={onStatusOpen}
        >
          {statusLabel}
        </Button>
      )}
      {sortOptions.length > 1 && (
        <Button variant="ghost" _text={{ color: 'white', fontWeight: 'bold' }} onPress={onSortOpen}>
          {sortLabel}
        </Button>
      )}

      <ActionsheetSelect
        isOpen={isTypeOpen}
        onClose={onTypeClose}
        options={typeOptions}
        onChange={handleTypeChange}
      />
      <ActionsheetSelect
        isOpen={isRegionOpen}
        onClose={onRegionClose}
        options={regionOptions}
        onChange={handleRegionChange}
      />
      <ActionsheetSelect
        isOpen={isStatusOpen}
        onClose={onStatusClose}
        options={statusOptions}
        onChange={handleStatusChange}
      />
      <ActionsheetSelect
        isOpen={isSortOpen}
        onClose={onSortClose}
        options={sortOptions}
        onChange={handleSortChange}
      />
    </HStack>
  );
};

export const PluginSelect = () => {
  const { source, list } = useAppSelector((state) => state.plugin);
  const { isOpen, onOpen, onClose } = useDisclose();
  const dispatch = useAppDispatch();
  const options = useMemo<{ label: string; value: string }[]>(() => {
    return list
      .filter((item) => !item.disabled)
      .map((item) => ({ label: item.label, value: item.value }));
  }, [list]);
  const pluginLabel = useMemo(() => {
    return list.find((item) => item.value === source)?.label || source;
  }, [list, source]);

  const handleOpen = () => {
    onOpen();
  };
  const handleClose = () => {
    onClose();
  };
  const handleChange = (newSource: string) => {
    dispatch(setSource(newSource as Plugin));
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

  const handleSearch = () => {
    RootNavigation.navigate('Search', { keyword });
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
