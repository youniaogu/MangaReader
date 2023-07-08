import React, { FC, memo, ReactNode, useEffect } from 'react';
import { Actionsheet, ScrollView } from 'native-base';
import { Keyboard } from 'react-native';
import Delay from './Delay';

interface ActionsheetSelectProps {
  isOpen?: boolean;
  options: { label: string; value: string; disabled?: boolean }[];
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
                {item.label}
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </Delay>
  );
};

export default memo(ActionsheetSelect);
