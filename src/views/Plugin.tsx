import React from 'react';
import { Text, VStack, HStack, Switch, ScrollView } from 'native-base';
import { action, useAppSelector, useAppDispatch } from '~/redux';
import { Plugin as PluginType } from '~/plugins';
import ScoreRate from '~/components/ScoreRate';

const { disablePlugin } = action;

const Plugin = ({ navigation: { navigate } }: StackPluginProps) => {
  const dispatch = useAppDispatch();
  const list = useAppSelector((state) => state.plugin.list);

  const handleToggle = (plugin: PluginType) => {
    dispatch(disablePlugin(plugin));
  };

  return (
    <ScrollView>
      <VStack safeAreaBottom>
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
              <Text
                fontSize="lg"
                fontWeight="bold"
                color="purple.500"
                onPress={() =>
                  navigate('Webview', {
                    uri: item.href,
                    source: item.value,
                    userAgent: item.userAgent,
                    injectedJavascript: item.injectedJavaScript,
                  })
                }
              >
                {item.name} - {item.label} 🔗
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
              onToggle={() => handleToggle(item.value)}
            />
          </HStack>
        ))}
      </VStack>
    </ScrollView>
  );
};

export default Plugin;
