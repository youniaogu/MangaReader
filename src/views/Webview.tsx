import React from 'react';
import { WebView } from 'react-native-webview';

const Webview = ({ navigation, route }: StackWebviewProps) => {
  const { uri, userAgent } = route.params || {};

  return (
    <WebView
      source={{ uri }}
      userAgent={userAgent}
      onLoadProgress={({ nativeEvent }) => {
        navigation.setOptions({ title: nativeEvent.title });
      }}
    />
  );
};

export default Webview;
