import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { navigationRef } from '~/utils';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '~/redux';
import loadable from '@loadable/component';

const Header = loadable(() => import('~/components/Header'));
const Home = loadable(() => import('~/views/Home'));
const SearchAndAbout = loadable(() => import('~/views/Home'), {
  resolveComponent: (components) => components.SearchAndAbout,
});
const Search = loadable(() => import('~/views/Search'));
const Discovery = loadable(() => import('~/views/Discovery'));
const SearchInput = loadable(() => import('~/views/Discovery'), {
  resolveComponent: (components) => components.SearchInput,
});
const Detail = loadable(() => import('~/views/Detail'));
const Heart = loadable(() => import('~/views/Detail'), {
  resolveComponent: (components) => components.Heart,
});
const Chapter = loadable(() => import('~/views/Chapter'));
const Plugin = loadable(() => import('~/views/Plugin'));
const About = loadable(() => import('~/views/About'));

const styles = StyleSheet.create({ wrapper: { flex: 1 } });
const { Navigator, Screen } = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <GestureHandlerRootView style={styles.wrapper}>
      <Provider store={store}>
        <NativeBaseProvider>
          <NavigationContainer ref={navigationRef}>
            <Navigator
              initialRouteName="Home"
              screenOptions={{ header: (props) => <Header {...props} /> }}
            >
              <Screen
                name="Home"
                options={{
                  headerRight: () => <SearchAndAbout />,
                }}
                component={Home}
              />
              <Screen
                name="Discovery"
                options={{ title: '', headerLeft: () => <SearchInput /> }}
                component={Discovery}
              />
              <Screen name="Search" component={Search} />
              <Screen
                name="Detail"
                options={{ title: 'loading...', headerRight: () => <Heart /> }}
                component={Detail}
              />
              <Screen name="Chapter" options={{ headerShown: false }} component={Chapter} />
              <Screen name="Plugin" component={Plugin} />
              <Screen name="About" component={About} />
            </Navigator>
          </NavigationContainer>
        </NativeBaseProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
