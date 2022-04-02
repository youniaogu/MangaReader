import { configureStore } from '@reduxjs/toolkit';
import { reducer } from './slice';
import createSagaMiddleware from 'redux-saga';
import saga from './saga';

const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware];

if (process.env.NODE_ENV === 'development') {
  const { logger } = require('redux-logger');
  middleware.push(logger);
}

const store = configureStore({
  reducer,
  middleware,
  devTools: process.env.NODE_ENV === 'development',
});
sagaMiddleware.run(saga);

export default store;
