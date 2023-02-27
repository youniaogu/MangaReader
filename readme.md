# MangaReader

![platform](https://img.shields.io/badge/platform-android%20%7C%20ios-lightgrey)
![last-modified](https://img.shields.io/aur/last-modified/MangaReader)

一个漫画 APP📱，基于 react-native 构建，兼容 Android、Ios 平台

- 插件式设计
- 收藏、搜索、批量更新
- 图片手势控制、本地缓存

<p align="center">
  <img src="./demo.gif" alt="demo" />
</p>

## Installation

```bash
> git clone https://github.com/youniaogu/MangaReader.git
> cd MangaReader
> yarn install
> cd ios
> pod install
```

## Download

Android：[下载](https://github.com/youniaogu/MangaReader/releases)

Ios：[未签名 ipa](https://github.com/youniaogu/MangaReader/releases)

## TodoList

- [x] 更多的插件

  - [x] ~~[manhuagui](https://www.mhgui.com/)（大陆版，访问 403，已失效）~~

  - [x] [manhuaguimobile](https://m.manhuagui.com/)（需要代理）

  - [x] [copymanga](https://www.copymanga.org/)

  - [x] [manhuadb](https://www.manhuadb.com/)

  - [x] [jmcomic](https://18comic.vip)（屏蔽日本 ip，目前主站到国内站点的自动跳转失效，需要代理）

  - [x] [dongmanzhijia](https://m.dmzj.com/)

  - [x] ~~[manhuamao](https://www.maofly.com/)（网站挂了，已失效）~~

  - [x] [klmanga](https://klmanga.net/)

  - [x] [nhentai](https://nhentai.net/)（需要代理，安卓版本要求 9 及以上）

- [x] 漫画批量更新

- [x] 发现页支持分类搜索

- [ ] 章节预加载

- [ ] 夜间模式

- [x] 插件配置页

- [x] 竖屏模式

- [x] 检查 app 更新

- [x] 过滤批量更新

- [ ] 插件支持配置

## NHentai

nhentai 开启了 cloudflare 的 ddos 保护，在使用此插件前，请遵循下面流程在 webview 里通过 cloudflare 校验并获得 cookie

<img title="step1" src="./step1.png" alt="step1" width="200">

<img title="step2" src="./step2.png" alt="step2" width="200">

<img title="step3" src="./step3.jpg" alt="step3" width="200">

## About

很喜欢看漫画，能在一个 APP 里看完所有的漫画，是我一直以来的想法

这个项目是在工作之余开发的，时间有限，如果遇到问题，欢迎 Issues

最后感谢 Star，你的 Star 是我更新的动力

## License

[MIT](https://github.com/youniaogu/MangaReader/blob/master/LICENSE)
