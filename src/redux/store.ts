import { persistStore, persistReducer } from 'redux-persist';
import { configureStore } from '@reduxjs/toolkit';
import { reducer } from './slice';
import createSagaMiddleware from 'redux-saga';
import saga from './saga';
import { mmkvStorage } from './storage';

const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware];

if (__DEV__) {
  const { logger } = require('redux-logger');
  middleware.push(logger);
}

const persistedReducer = persistReducer({ key: 'root', storage: mmkvStorage }, reducer);

sagaMiddleware.run(saga);

export const store = configureStore({
  reducer: persistedReducer,
  middleware,
  devTools: __DEV__,
});
export const persistor = persistStore(store);
