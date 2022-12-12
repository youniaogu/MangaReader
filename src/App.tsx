import React, { useState, useEffect } from 'react';
import { navigationRef, customTheme, AsyncStatus } from '~/utils';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, useAppSelector } from '~/redux';
import { useErrorMessageToast } from '~/hooks';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import RNBootSplash from 'react-native-bootsplash';
import loadable from '@loadable/component';

interface NavigationScreenProps {
  ready?: boolean;
}

const Header = loadable(() => import('~/components/Header'));
const Home = loadable(() => import('~/views/Home'));
const SearchAndAbout = loadable(() => import('~/views/Home'), {
  resolveComponent: (components) => components.SearchAndAbout,
});
const Search = loadable(() => import('~/views/Search'));
const Discovery = loadable(() => import('~/views/Discovery'));
const SearchAndPlugin = loadable(() => import('~/views/Discovery'), {
  resolveComponent: (components) => components.SearchAndPlugin,
});
const PluginSelect = loadable(() => import('~/views/Discovery'), {
  resolveComponent: (components) => components.PluginSelect,
});
const Detail = loadable(() => import('~/views/Detail'));
const HeartAndBrowser = loadable(() => import('~/views/Detail'), {
  resolveComponent: (components) => components.HeartAndBrowser,
});
const Chapter = loadable(() => import('~/views/Chapter'));
const Plugin = loadable(() => import('~/views/Plugin'));
const About = loadable(() => import('~/views/About'));

const styles = StyleSheet.create({ wrapper: { flex: 1 } });
const { Navigator, Screen } = createNativeStackNavigator<RootStackParamList>();

const NavigationScreen = ({ ready = false }: NavigationScreenProps) => {
  const launchStatus = useAppSelector((state) => state.app.launchStatus);
  const latestRelease = useAppSelector((state) => state.release.latest);
  const haveUpdate = Boolean(latestRelease);

  useEffect(() => {
    if (ready && launchStatus === AsyncStatus.Fulfilled) {
      RNBootSplash.hide();
    }
  }, [ready, launchStatus]);
  useErrorMessageToast();

  return (
    <Navigator
      initialRouteName="Home"
      screenOptions={{ header: (props) => <Header {...props} enableShake={haveUpdate} /> }}
    >
      <Screen name="Home" options={{ headerRight: () => <SearchAndAbout /> }} component={Home} />
      <Screen
        name="Discovery"
        options={{ title: '', headerLeft: () => <SearchAndPlugin /> }}
        component={Discovery}
      />
      <Screen name="Search" options={{ headerRight: () => <PluginSelect /> }} component={Search} />
      <Screen
        name="Detail"
        options={{ title: 'loading...', headerRight: () => <HeartAndBrowser /> }}
        component={Detail}
      />
      <Screen name="Chapter" options={{ headerShown: false }} component={Chapter} />
      <Screen name="Plugin" component={Plugin} />
      <Screen name="About" component={About} />
    </Navigator>
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
          </NavigationContainer>
        </NativeBaseProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
