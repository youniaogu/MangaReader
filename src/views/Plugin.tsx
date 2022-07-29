import React from 'react';
import { useAppSelector } from '~/redux';
import { Text, VStack, HStack, Divider, Switch } from 'native-base';
import ScoreRate from '~/components/ScoreRate';

const Plugin = () => {
  const list = useAppSelector((state) => state.plugin.list);

  const handleToggle = () => {};

  return (
    <VStack divider={<Divider />}>
      {list.map((item) => (
        <HStack key={item.value} alignItems="center" flexDirection="row" px={5} py={3}>
          <VStack space={1} flexGrow={1}>
            <Text fontSize="lg" fontWeight="bold">
              {item.label}【{item.name}】
            </Text>
            <Text fontSize="sm">Description</Text>
            <HStack alignItems="center">
              <Text fontSize="sm">推荐指数：</Text>
              <ScoreRate score={3} />
            </HStack>
          </VStack>
          <Switch
            size="md"
            onTrackColor="purple.500"
            value={!item.disabled}
            onToggle={handleToggle}
          />
        </HStack>
      ))}
    </VStack>
  );
};

export default Plugin;
