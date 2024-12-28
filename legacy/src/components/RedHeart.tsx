import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Icon, Pressable } from 'native-base';
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
  const handleTap = () => {
    scale.value = withSequence(withSpring(biggerScale), withSpring(defaultScale));
    handlePress();
  };

  return (
    <Pressable onPress={handleTap}>
      <Animated.View style={animatedStyle}>
        <Icon
          m={2}
          size="2xl"
          as={MaterialIcons}
          name={actived ? 'favorite' : 'favorite-outline'}
          color={actived ? Color.Actived : Color.Default}
        />
      </Animated.View>
    </Pressable>
  );
};

export default RedHeart;
