# MangaReader

a manga app📱, build by react-native, work on ios and android platforms.

all data come from [manhuagui](https://m.manhuagui.com/)

## How to get the app?

for android user, i will build and upload a package on github [releases](https://github.com/youniaogu/MangaReader/releases), also you can build by yourself

for ios user, you need a machine that have macos, use xcode to build and install to you phone. if you meet some trouble when building app, tell me [here](https://github.com/youniaogu/MangaReader/issues), i will try to fix it

## How to install dependencies?

cooming soon...

## attention of developer

react-native-reanimated@v2 can't use remote debug, the version higher than v2.3.1 useless in iOS simulator when remote debug is on, see detail on this [doc](https://docs.swmansion.com/react-native-reanimated/docs/#known-problems-and-limitations), and issues on github

- [If expo react native debugger open, swipe doesn't respond in IOS](https://github.com/software-mansion/react-native-gesture-handler/issues/1302)
- [app crashes if debugging mode is enabled](https://github.com/software-mansion/react-native-reanimated/issues/1674)

so we need to use [Flipper](https://fbflipper.com/) instead of remote debug
