import React, { useState, useEffect, useCallback } from 'react';
import { createNativeStackNavigator, NativeStackHeaderProps } from '@react-navigation/native-stack';
import { navigationRef, customTheme, AsyncStatus } from '~/utils';
import { HeartAndBrowser, PrehandleDrawer } from '~/views/Detail';
import { SearchAndPlugin, PluginSelect } from '~/views/Discovery';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, useAppSelector } from '~/redux';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { useMessageToast } from '~/hooks';
import { ErrorBoundary } from 'react-error-boundary';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import ErrorFallback from '~/components/ErrorFallback';
import RNBootSplash from 'react-native-bootsplash';
import loadable from '@loadable/component';
import Header from '~/components/Header';

interface NavigationScreenProps {
  ready?: boolean;
}

const Home = loadable(() => import('~/views/Home'));
const Search = loadable(() => import('~/views/Search'));
const Discovery = loadable(() => import('~/views/Discovery'));
const Detail = loadable(() => import('~/views/Detail'));
const Chapter = loadable(() => import('~/views/Chapter'));
const Plugin = loadable(() => import('~/views/Plugin'));
const Webview = loadable(() => import('~/views/Webview'));
const About = loadable(() => import('~/views/About'));

const styles = StyleSheet.create({ wrapper: { flex: 1 } });
const { Navigator, Screen } = createNativeStackNavigator<RootStackParamList>();

const NavigationScreen = ({ ready = false }: NavigationScreenProps) => {
  const launchStatus = useAppSelector((state) => state.app.launchStatus);
  const latestRelease = useAppSelector((state) => state.release.latest);
  const haveUpdate = Boolean(latestRelease);

  const DefaultHeader = useCallback(
    (props: NativeStackHeaderProps) => <Header {...props} enableShake={haveUpdate} />,
    [haveUpdate]
  );

  useEffect(() => {
    if (ready && launchStatus === AsyncStatus.Fulfilled) {
      RNBootSplash.hide();
    }
  }, [ready, launchStatus]);
  useMessageToast();

  return (
    <ErrorBoundary fallbackRender={ErrorFallback}>
      <Navigator
        initialRouteName="Home"
        screenOptions={{ header: DefaultHeader, freezeOnBlur: true }}
      >
        <Screen name="Home" component={Home} />
        <Screen
          name="Discovery"
          options={{ title: '', headerLeft: SearchAndPlugin }}
          component={Discovery}
        />
        <Screen name="Search" options={{ headerRight: PluginSelect }} component={Search} />
        <Screen
          name="Detail"
          options={{ title: 'loading...', headerRight: HeartAndBrowser }}
          component={Detail}
        />
        <Screen name="Chapter" options={{ headerShown: false }} component={Chapter} />
        <Screen name="Plugin" component={Plugin} />
        <Screen name="Webview" component={Webview} />
        <Screen name="About" component={About} />
      </Navigator>
    </ErrorBoundary>
  );
};

const App = () => {
  const [ready, setReady] = useState(false);

  return (
    <GestureHandlerRootView style={styles.wrapper}>
      <Provider store={store}>
        <NativeBaseProvider theme={customTheme}>
          <NavigationContainer ref={navigationRef} onReady={() => setReady(true)}>
            <NavigationScreen ready={ready} />
            <PrehandleDrawer />
          </NavigationContainer>
        </NativeBaseProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

/** for the json schema generate */
/** https://github.com/YousefED/typescript-json-schema/issues/307 */
export type RootStateType = RootState;
export type DictStateType = RootState['dict'];
export type TaskStateType = RootState['task'];
export type PluginStateType = RootState['plugin'];
export type SettingStateType = RootState['setting'];
export type FavoritesStateType = RootState['favorites'];
export default App;
