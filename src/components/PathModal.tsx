import React from 'react';
import { Text, Modal, Input, InputGroup, InputLeftAddon } from 'native-base';

interface PathModalProps {
  leftAddon?: string;
  isOpen?: boolean;
  value?: string;
  onClose?: () => void;
  onChange?: (value: string) => void;
}

const PathModal = ({ leftAddon, isOpen = true, value, onClose, onChange }: PathModalProps) => {
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
          {leftAddon && <InputLeftAddon background="gray.200" children={leftAddon} />}
          <Input minW={20} flex={1} flexShrink={0} defaultValue={value} onChangeText={onChange} />
        </InputGroup>
      </Modal.Content>
    </Modal>
  );
};

export default PathModal;
