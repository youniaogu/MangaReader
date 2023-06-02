import React from 'react';
import { Modal, Center, useToast } from 'native-base';
import { useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Empty from '~/components/Empty';

interface QrcodeModalProps {
  isOpen?: boolean;
  value: string;
  onClose?: () => void;
}

const QrcodeModal = ({ isOpen = true, value, onClose }: QrcodeModalProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const toast = useToast();
  const handleError = (error: Error) => {
    // Warning: Cannot update a component (`ToastProvider`) while rendering a different component (`QRCode`)
    setTimeout(() => {
      toast.show({ title: error.message });
    }, 0);
  };

  if (value === '') {
    return null;
  }

  return (
    <Modal useRNModal isOpen={isOpen} onClose={onClose} size="full">
      <Modal.Content w={windowWidth} h={windowWidth}>
        <Modal.Body p={0}>
          {isOpen ? (
            <Center>
              <QRCode quietZone={12} size={windowWidth} value={value} onError={handleError} />
            </Center>
          ) : (
            <Empty />
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};

export default QrcodeModal;
