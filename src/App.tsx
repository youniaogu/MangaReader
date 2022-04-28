import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from '~/redux';

import Header from '~/components/Header';
import Home from '~/views/Home';
import Collection from '~/views/Collection';
import SearchHeader from '~/views/SearchHeader';
import Search from '~/views/Search';
import Detail from '~/views/Detail';
import Chapter from '~/views/Chapter';
import About from '~/views/About';

const styles = StyleSheet.create({ wrapper: { flex: 1 } });
const { Navigator, Screen } = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <GestureHandlerRootView style={styles.wrapper}>
      <Provider store={store}>
        <NativeBaseProvider>
          <NavigationContainer>
            <Navigator
              initialRouteName="Home"
              screenOptions={{
                header: (props) => <Header {...props} />,
              }}
            >
              <Screen name="Home" component={Home} />
              <Screen name="Collection" component={Collection} />
              <Screen
                name="Search"
                options={{
                  header: (props) => <SearchHeader {...props} />,
                }}
                component={Search}
              />
              <Screen
                name="Detail"
                options={{
                  title: 'loading...',
                }}
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
