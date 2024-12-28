import React from 'react';
import { action, useAppDispatch } from '~/redux';
import { WebView } from 'react-native-webview';

const { setExtra } = action;

const Webview = ({ navigation, route }: StackWebviewProps) => {
  const dispatch = useAppDispatch();
  const { uri, source, userAgent, injectedJavascript } = route.params || {};

  return (
    <WebView
      source={{ uri }}
      userAgent={userAgent}
      originWhitelist={['*']}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      injectedJavaScript={injectedJavascript}
      onMessage={(event) => {
        if (source && injectedJavascript) {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            typeof data === 'object' && dispatch(setExtra({ source, data }));
          } catch {}
        }
      }}
      onLoadProgress={({ nativeEvent }) => {
        navigation.setOptions({ title: nativeEvent.title });
      }}
    />
  );
};

export default Webview;
