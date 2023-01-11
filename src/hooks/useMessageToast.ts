import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Toast } from 'native-base';

const { throwMessage } = action;

export const useMessageToast = () => {
  const dispatch = useAppDispatch();
  const message = useAppSelector((state) => state.app.message);

  useFocusEffect(
    useCallback(() => {
      if (message.length > 0) {
        message.forEach((text) => {
          Toast.show({ title: text, placement: 'bottom' });
        });
        dispatch(throwMessage());
      }
    }, [message, dispatch])
  );
};
