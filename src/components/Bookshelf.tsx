import React, { memo, useMemo } from 'react';
import { useDelayRender, useSplitWidth } from '~/hooks';
import { Box, Text, Icon, Pressable } from 'native-base';
import { coverAspectRatio } from '~/utils';
import { CachedImage } from '@georstat/react-native-image-cache';
import { StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import WhiteCurtain from '~/components/WhiteCurtain';
import SpinLoading from '~/components/SpinLoading';
import Loading from '~/components/Loading';
import Empty from '~/components/Empty';

interface BookshelfProps {
  list: Manga[];
  trendList?: string[];
  activeList?: string[];
  negativeList?: string[];
  loadMore?: () => void;
  reload?: () => void;
  itemOnPress: (hash: string) => void;
  loading?: boolean;
  emptyText?: string;
}

const Bookshelf = ({
  list,
  trendList,
  activeList,
  negativeList,
  loadMore,
  reload,
  itemOnPress,
  loading = false,
  emptyText,
}: BookshelfProps) => {
  const { gap, insets, splitWidth, numColumns, windowWidth, windowHeight } = useSplitWidth({
    gap: 8,
    minNumColumns: 3,
    maxSplitWidth: 180,
  });
  const render = useDelayRender(loading && list.length === 0);
  const extraData = useMemo(
    () => ({
      width: splitWidth,
      trend: trendList || [],
      active: activeList || [],
      negative: negativeList || [],
    }),
    [splitWidth, activeList, trendList, negativeList]
  );

  const handlePress = (hash: string) => {
    return () => {
      itemOnPress(hash);
    };
  };
  const handleEndReached = () => {
    !loading && loadMore && loadMore();
  };

  if ((loading && list.length === 0) || !render) {
    return <Loading />;
  }
  if (!loading && list.length === 0) {
    return <Empty text={emptyText} onPress={reload} />;
  }

  return (
    <FlashList
      data={list}
      extraData={extraData}
      numColumns={numColumns}
      estimatedItemSize={splitWidth / coverAspectRatio}
      estimatedListSize={{ width: windowWidth, height: windowHeight }}
      contentContainerStyle={{
        padding: gap / 2,
        paddingLeft: gap / 2 + insets.left,
        paddingRight: gap / 2 + insets.right,
      }}
      onEndReached={handleEndReached}
      onEndReachedThreshold={1}
      keyExtractor={(item) => item.hash}
      ListFooterComponent={
        loading ? <SpinLoading height={24} safeAreaBottom /> : <Box height={0} safeAreaBottom />
      }
      renderItem={({ item, extraData: { width, active, trend, negative } }) => (
        <Pressable _pressed={{ opacity: 0.8 }} onPress={handlePress(item.hash)}>
          <Box width={width + gap} flexDirection="column" p={`${gap / 2}px`}>
            <Box position="relative" shadow={0} bg="white" borderRadius={6}>
              <CachedImage
                options={{ headers: item.headers }}
                source={item.cover}
                style={{ ...styles.img, height: width / coverAspectRatio }}
                resizeMode="cover"
              />
              {trend.includes(item.hash) && (
                <Box
                  shadow={0}
                  position="absolute"
                  left={0}
                  bottom={0}
                  borderRadius={3}
                  borderBottomLeftRadius={6}
                  px={2}
                  bg="purple.500"
                >
                  <Text fontSize="xs" fontWeight="bold" color="white">
                    New
                  </Text>
                </Box>
              )}
              {negative.includes(item.hash) && (
                <Icon
                  shadow="icon"
                  position="absolute"
                  top={1}
                  right={1}
                  as={MaterialIcons}
                  name="lock"
                  size="sm"
                  color="purple.700"
                />
              )}
              <WhiteCurtain actived={active.includes(item.hash)}>
                <Box
                  position="absolute"
                  w="full"
                  h="full"
                  top={0}
                  left={0}
                  backgroundColor="white"
                  opacity={0.3}
                />
                <SpinLoading />
              </WhiteCurtain>
            </Box>
            <Text pt={1} fontSize="md" fontWeight="bold" numberOfLines={1}>
              {item.title || item.hash}
            </Text>
          </Box>
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  img: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 6,
  },
});

export default memo(Bookshelf);
