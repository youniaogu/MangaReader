import React, { FC, memo, ReactNode, useEffect } from 'react';
import { Actionsheet, ScrollView, HStack, Icon, Text } from 'native-base';
import { sourceMap } from './VectorIcon';
import { Keyboard } from 'react-native';
import Delay from './Delay';

export interface ActionsheetSelectProps {
  isOpen?: boolean;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
    icon?: { source: keyof typeof sourceMap; name: string };
  }[];
  onClose?: () => void;
  onChange?: (value: string) => void;
  headerComponent?: ReactNode;
}

const ActionsheetSelect: FC<ActionsheetSelectProps> = ({
  options,
  isOpen,
  onClose,
  onChange,
  headerComponent,
}) => {
  useEffect(() => {
    isOpen && Keyboard.dismiss();
  }, [isOpen]);

  const handleClose = () => {
    onClose && onClose();
  };
  const handleChange = (value: string) => {
    return () => {
      onChange && onChange(value);
      handleClose();
    };
  };

  return (
    <Delay>
      <Actionsheet isOpen={isOpen} onClose={handleClose}>
        <Actionsheet.Content>
          {headerComponent}
          <ScrollView w="full">
            {options.map((item) => (
              <Actionsheet.Item
                key={item.value}
                disabled={item.disabled}
                onPress={handleChange(item.value)}
              >
                <HStack space={2}>
                  {item.icon && (
                    <Icon as={sourceMap[item.icon.source]} size="md" name={item.icon.name} />
                  )}
                  <Text>{item.label}</Text>
                </HStack>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </Delay>
  );
};

export default memo(ActionsheetSelect);
