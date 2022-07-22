import React, { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { Input, Button, HStack, useDisclose } from 'native-base';
import { isManga, AsyncStatus } from '~/utils';
import { Plugin, PluginMap } from '~/plugins';
import ActionsheetSelect from '~/components/ActionsheetSelect';
import Bookshelf from '~/components/Bookshelf';
import * as RootNavigation from '~/utils/navigation';

const { loadDiscovery, loadSearch, setSource, setType, setRegion, setStatus, setSort } = action;

const Discovery = ({ navigation: { navigate } }: StackHomeProps) => {
  const { list } = useAppSelector((state) => state.discovery);
  const { source } = useAppSelector((state) => state.plugin);
  const dict = useAppSelector((state) => state.dict.manga);
  const loadStatus = useAppSelector((state) => state.discovery.loadStatus);
  const dispatch = useAppDispatch();
  const updateList = useMemo(() => list.map((item) => dict[item]).filter(isManga), [dict, list]);

  useEffect(() => {
    loadStatus === AsyncStatus.Default && dispatch(loadDiscovery({ isReset: true, source }));
  }, [dispatch, loadStatus, source]);

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
      <Button variant="ghost" _text={{ color: 'white', fontWeight: 'bold' }} onPress={onTypeOpen}>
        {typeLabel}
      </Button>
      <Button variant="ghost" _text={{ color: 'white', fontWeight: 'bold' }} onPress={onRegionOpen}>
        {regionLabel}
      </Button>
      <Button variant="ghost" _text={{ color: 'white', fontWeight: 'bold' }} onPress={onStatusOpen}>
        {statusLabel}
      </Button>
      <Button variant="ghost" _text={{ color: 'white', fontWeight: 'bold' }} onPress={onSortOpen}>
        {sortLabel}
      </Button>

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

export const SearchInput = () => {
  const [keyword, setKeyword] = useState('');
  const { source, list } = useAppSelector((state) => state.plugin);
  const { isOpen, onOpen, onClose } = useDisclose();
  const dispatch = useAppDispatch();
  const options = useMemo<{ label: string; value: string }[]>(() => {
    return list.map((item) => ({ label: item.label, value: item.value }));
  }, [list]);
  const pluginLabel = useMemo(() => {
    return list.find((item) => item.value === source)?.label || source;
  }, [list, source]);

  const handleSearch = () => {
    dispatch(loadSearch({ keyword, source, isReset: true }));
    RootNavigation.navigate('Search', { keyword });
  };
  const handleOpen = () => {
    onOpen();
  };
  const handleClose = () => {
    onClose();
  };
  const handleChange = (newSource: string) => {
    dispatch(setSource(newSource as Plugin));
  };

  return (
    <HStack pl={1} pr={2} space={2} flex={1} alignItems="center">
      <Input
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
      <Button
        p={0}
        variant="ghost"
        _text={{ color: 'white', fontSize: 'sm', fontWeight: 'bold' }}
        onPress={handleOpen}
      >
        {pluginLabel}
      </Button>
      <ActionsheetSelect
        isOpen={isOpen}
        onClose={handleClose}
        title="选择插件"
        options={options}
        onChange={handleChange}
      />
    </HStack>
  );
};

export default Discovery;
