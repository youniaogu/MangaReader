import React from 'react';
import { Icon, IconButton, IIconButtonProps } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const sourceMap = {
  materialIcons: MaterialIcons,
  materialCommunityIcons: MaterialCommunityIcons,
  octicons: Octicons,
  ionicons: Ionicons,
};

interface VectorIconProps extends IIconButtonProps {
  source?: keyof typeof sourceMap;
}

const VectorIcon = ({
  name = 'check',
  size = 'xl',
  color = 'white',
  onPress,
  shadow,
  source = 'materialIcons',
  ...props
}: VectorIconProps) => {
  return (
    <IconButton
      p={2}
      icon={<Icon shadow={shadow} as={sourceMap[source]} name={name} size={size} color={color} />}
      onPress={onPress}
      {...props}
    />
  );
};

export default VectorIcon;
