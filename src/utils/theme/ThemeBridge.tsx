import { ColorMode, StorageManager } from 'native-base';
import { store } from '~/redux';
import { LightSwitch } from '~/utils';

const ThemeBridge: StorageManager = {
  get: async () => {
    const light = store.getState().setting.light;
    return light === LightSwitch.On ? 'light' : 'dark';
  },
  set: async (value: ColorMode) => {
    // 这里可以 dispatch 你的 Redux action，保持同步
    store.dispatch({
      type: 'setting/setLight',
      payload: value === 'light' ? LightSwitch.On : LightSwitch.Off,
    });
  },
};

export default ThemeBridge;
