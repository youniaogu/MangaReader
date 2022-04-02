import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { action, reducer } from './slice';
import saga from './saga';
import store from './store';

const useAppDispatch = () => useDispatch<typeof store.dispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export { action, reducer, store, saga, useAppSelector, useAppDispatch };
