import '~/utils/define';
import { AppRegistry, LogBox } from 'react-native';
import { proxy } from './package.json';
import { name } from './app.json';
import App from '~/App';

if (process.env.NODE_ENV === 'development') {
  process.env.PROXY = proxy;
}

LogBox.ignoreLogs(['Require cycle:', 'Remote debugger']);
AppRegistry.registerComponent(name, () => App);
