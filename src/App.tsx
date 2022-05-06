import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { navigationRef } from '~/utils';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '~/redux';

import Header from '~/components/Header';
import Home, { SearchAndAbout } from '~/views/Home';
import Result from '~/views/Result';
import Search, { SearchInput } from '~/views/Search';
import Detail, { Heart } from '~/views/Detail';
import Chapter from '~/views/Chapter';
import About from '~/views/About';

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
                name="Search"
                options={{ title: '', headerLeft: () => <SearchInput /> }}
                component={Search}
              />
              <Screen name="Result" component={Result} />
              <Screen
                name="Detail"
                options={{ title: 'loading...', headerRight: () => <Heart /> }}
                component={Detail}
              />
              <Screen name="Chapter" options={{ headerShown: false }} component={Chapter} />
              <Screen name="About" component={About} />
            </Navigator>
          </NavigationContainer>
        </NativeBaseProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
