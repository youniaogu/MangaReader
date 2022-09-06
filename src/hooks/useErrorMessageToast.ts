import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Toast } from 'native-base';

const { throwError } = action;

export const useErrorMessageToast = () => {
  const dispatch = useAppDispatch();
  const errorMessage = useAppSelector((state) => state.app.errorMessage);

  useFocusEffect(
    useCallback(() => {
      if (errorMessage.length > 0) {
        errorMessage.forEach((message) => {
          Toast.show({
            title: message,
            placement: 'bottom',
          });
        });
        dispatch(throwError());
      }
    }, [errorMessage, dispatch])
  );
};
