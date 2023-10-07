import { configureStore } from '@reduxjs/toolkit';
import { reducer } from './slice';
import createSagaMiddleware from 'redux-saga';
import saga from './saga';

const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware];

if (__DEV__) {
  // const { logger } = require('redux-logger');
  // middleware.push(logger);
}

const store = configureStore({
  reducer,
  middleware,
  devTools: __DEV__,
});
sagaMiddleware.run(saga);

export default store;
