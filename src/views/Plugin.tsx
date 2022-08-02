import React from 'react';
import { Text, VStack, HStack, Divider, Switch, ScrollView } from 'native-base';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { Plugin as PluginType } from '~/plugins';
import ScoreRate from '~/components/ScoreRate';

const { disablePlugin } = action;

const Plugin = () => {
  const dispatch = useAppDispatch();
  const list = useAppSelector((state) => state.plugin.list);

  const handleToggle = (plugin: PluginType) => {
    return () => {
      dispatch(disablePlugin(plugin));
    };
  };

  return (
    <ScrollView>
      <VStack divider={<Divider />}>
        {list.map((item) => (
          <HStack
            space={6}
            key={item.value}
            alignItems="center"
            flexDirection="row"
            pl={5}
            pr={3}
            py={3}
          >
            <VStack space={1} flexGrow={1} w={0}>
              <Text fontSize="lg" fontWeight="bold">
                {item.label} - {item.name}
              </Text>
              <Text fontSize="sm">{item.description}</Text>
              <HStack alignItems="center">
                <Text fontSize="sm">推荐指数：</Text>
                <ScoreRate score={item.score} />
              </HStack>
            </VStack>
            <Switch
              size="md"
              onTrackColor="purple.500"
              value={!item.disabled}
              onToggle={handleToggle(item.value)}
            />
          </HStack>
        ))}
      </VStack>
    </ScrollView>
  );
};

export default Plugin;
