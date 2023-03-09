import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Icon } from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

enum Color {
  Default = '#ffffff',
  Actived = '#ef4444',
}

interface RedHeartProps {
  actived?: boolean;
  onPress?: () => void;
}

const defaultScale = 1;
const biggerScale = 1.5;

const RedHeart = ({ actived = false, onPress }: RedHeartProps) => {
  const scale = useSharedValue(defaultScale);

  const handlePress = () => {
    onPress && onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    justifyContent: 'center',
    transform: [{ scale: scale.value }],
  }));
  const singleTap = Gesture.Tap().onStart(() => {
    scale.value = withSequence(withSpring(biggerScale), withSpring(defaultScale));
    runOnJS(handlePress)();
  });
  const longPress = Gesture.LongPress()
    .onStart(() => {
      scale.value = withSpring(biggerScale);
      runOnJS(handlePress)();
    })
    .onEnd(() => {
      scale.value = withSequence(withSpring(biggerScale), withSpring(defaultScale));
    });

  return (
    <GestureDetector gesture={Gesture.Exclusive(longPress, singleTap)}>
      <Animated.View style={animatedStyle}>
        <Icon
          m={2}
          size="2xl"
          as={MaterialIcons}
          name={actived ? 'favorite' : 'favorite-outline'}
          color={actived ? Color.Actived : Color.Default}
        />
      </Animated.View>
    </GestureDetector>
  );
};

export default RedHeart;
