import React from 'react';
import { Icon, IconButton, IIconButtonProps } from 'native-base';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const VectorIcon = ({
  name = 'check',
  size = 'xl',
  color = 'white',
  onPress,
  shadow,
  ...props
}: IIconButtonProps) => {
  return (
    <IconButton
      p={2}
      icon={<Icon shadow={shadow} as={MaterialIcons} name={name} size={size} color={color} />}
      onPress={onPress}
      {...props}
    />
  );
};

export default VectorIcon;
