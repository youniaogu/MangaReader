import React, { useState } from 'react';
import { Text, Modal, Input, InputGroup } from 'native-base';
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
    <Modal useRNModal isOpen={isOpen} onClose={handleClose} size="full">
      <Modal.Content w="full" p={3}>
        <Text fontSize="sm" color="gray.500" pb={2}>
          漫画导出目录：
        </Text>
        <InputGroup w="full">
          <Input fontSize="sm" flex={1} borderRightWidth={0} value={path} onChangeText={setPath} />
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
