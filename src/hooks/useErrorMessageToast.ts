import { action, useAppSelector, useAppDispatch } from '~/redux';
import { useEffect } from 'react';
import { Toast } from 'native-base';

const { throwError } = action;

export const useErrorMessageToast = () => {
  const dispatch = useAppDispatch();
  const errorMessage = useAppSelector((state) => state.app.errorMessage);

  useEffect(() => {
    if (errorMessage.length > 0) {
      errorMessage.forEach((message) => {
        Toast.show({
          title: message,
          placement: 'bottom',
        });
      });
      dispatch(throwError());
    }
  }, [errorMessage, dispatch]);
};
