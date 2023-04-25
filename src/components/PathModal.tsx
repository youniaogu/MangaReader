import React from 'react';
import { Text, Modal, Input, InputGroup, InputLeftAddon, InputRightAddon } from 'native-base';

interface PathModalProps {
  leftAddon?: string;
  rightAddon?: string;
  isOpen?: boolean;
  value?: string;
  onClose?: () => void;
  onChange?: (value: string) => void;
}

const PathModal = ({
  leftAddon,
  rightAddon,
  isOpen = true,
  value,
  onClose,
  onChange,
}: PathModalProps) => {
  if (value === '') {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <Modal.Content w="full" p={2}>
        <Text fontSize="xs" color="gray.500" pb={1}>
          漫画下载目录：
        </Text>
        <InputGroup w="full">
          {leftAddon && <InputLeftAddon children={leftAddon} />}
          <Input flex={1} defaultValue={value} onChangeText={onChange} />
          {rightAddon && <InputRightAddon children={rightAddon} />}
        </InputGroup>
      </Modal.Content>
    </Modal>
  );
};

export default PathModal;
