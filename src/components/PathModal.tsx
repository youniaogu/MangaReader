import React, { useState } from 'react';
import { Text, Modal, Input, InputGroup, InputRightAddon } from 'native-base';
import { initialState } from '~/redux/slice';
import VectorIcon from '~/components/VectorIcon';

interface PathModalProps {
  isOpen?: boolean;
  defaultValue?: string;
  onClose?: (path: string) => void;
}

const PathModal = ({ isOpen = true, defaultValue = '', onClose }: PathModalProps) => {
  const [path, setPath] = useState(defaultValue);

  const handleClose = () => {
    onClose && onClose(path);
  };
  const handleReset = () => {
    setPath(initialState.setting.androidDownloadPath);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <Modal.Content w="full" p={2}>
        <Text fontSize="xs" color="gray.500" pb={1}>
          漫画下载目录：
        </Text>
        <InputGroup w="full">
          <Input flex={1} value={path} onChangeText={setPath} />
          <InputRightAddon children="/{chapter}" background="gray.100" borderRightWidth={0} />
          <VectorIcon
            size="md"
            name="restore"
            color="gray.500"
            borderWidth={1}
            borderColor="gray.300"
            onPress={handleReset}
          />
        </InputGroup>
      </Modal.Content>
    </Modal>
  );
};

export default PathModal;
