import React, { useState } from 'react';
import { Text, Modal, Input, InputGroup, InputRightAddon } from 'native-base';
import { KeyboardTypeOptions } from 'react-native';

interface InputModalProps {
  title?: string;
  isOpen?: boolean;
  rightAddon?: string;
  defaultValue?: string;
  keyboardType?: KeyboardTypeOptions;
  onClose?: (value: string) => void;
}

const InputModal = ({
  title,
  isOpen = true,
  rightAddon,
  defaultValue = '',
  keyboardType,
  onClose,
}: InputModalProps) => {
  const [value, setValue] = useState(defaultValue);

  const handleClose = () => {
    onClose && onClose(value);
  };

  return (
    <Modal useRNModal isOpen={isOpen} onClose={handleClose} size="full">
      <Modal.Content w="full" p={3}>
        {title && (
          <Text fontSize="sm" color="gray.500" pb={2}>
            {title}
          </Text>
        )}
        <InputGroup w="full">
          <Input
            flex={1}
            fontSize="sm"
            value={value}
            keyboardType={keyboardType}
            onChangeText={setValue}
          />
          {rightAddon && <InputRightAddon px={2} children={rightAddon} background="gray.100" />}
        </InputGroup>
      </Modal.Content>
    </Modal>
  );
};

export default InputModal;
