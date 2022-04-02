import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { Provider } from 'react-redux';
import { store } from '~redux';

import Header from '~components/Header';
import Home from '~views/Home';
import Collection from '~views/Collection';
import Search from '~views/Search';
import Detail from '~views/Detail';
import About from '~views/About';

const { Navigator, Screen } = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
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
            <Screen name="Search" component={Search} />
            <Screen
              name="Detail"
              options={{
                title: 'loading...',
              }}
              component={Detail}
            />
            <Screen name="About" component={About} />
          </Navigator>
        </NavigationContainer>
      </NativeBaseProvider>
    </Provider>
  );
};

export default App;
