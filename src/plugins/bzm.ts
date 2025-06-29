import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import { Platform } from 'react-native';
import queryString from 'query-string';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

interface DiscoveryResponse {
  items: {
    author: string;
    comic_id: string;
    name: string;
    region: 'cn' | 'jp' | 'kr' | 'en';
    region_name: string;
    /** e.g. yinianshiguang-iciyuandongman.jpg */
    topic_img: string;
    type_names: string[];
  }[];
  next: string;
}

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { value: '全部', label: 'all' },
      { value: '恋爱', label: 'lianai' },
      { value: '纯爱', label: 'chunai' },
      { value: '古风', label: 'gufeng' },
      { value: '异能', label: 'yineng' },
      { value: '悬疑', label: 'xuanyi' },
      { value: '剧情', label: 'juqing' },
      { value: '科幻', label: 'kehuan' },
      { value: '奇幻', label: 'qihuan' },
      { value: '玄幻', label: 'xuanhuan' },
      { value: '穿越', label: 'chuanyue' },
      { value: '冒险', label: 'mouxian' },
      { value: '推理', label: 'tuili' },
      { value: '武侠', label: 'wuxia' },
      { value: '格斗', label: 'gedou' },
      { value: '战争', label: 'zhanzheng' },
      { value: '热血', label: 'rexie' },
      { value: '搞笑', label: 'gaoxiao' },
      { value: '大女主', label: 'danuzhu' },
      { value: '都市', label: 'dushi' },
      { value: '总裁', label: 'zongcai' },
      { value: '后宫', label: 'hougong' },
      { value: '日常', label: 'richang' },
      { value: '韩漫', label: 'hanman' },
      { value: '少年', label: 'shaonian' },
      { value: '其它', label: 'qita' },
    ],
  },
  {
    name: 'region',
    options: [
      { label: '选择地区', value: Options.Default },
      { label: '国漫', value: 'cn' },
      { label: '日本', value: 'jp' },
      { label: '韩国', value: 'kr' },
      { label: '欧美', value: 'en' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '連載中', value: 'serial' },
      { label: '完結', value: 'pub' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '选择排序', value: Options.Default },
      { label: 'ABCD', value: 'ABCD' },
      { label: 'EFGH', value: 'EFGH' },
      { label: 'IJKL', value: 'IJKL' },
      { label: 'MNOP', value: 'MNOP' },
      { label: 'QRST', value: 'QRST' },
      { label: 'UVW', value: 'UVW' },
      { label: 'XYZ', value: 'XYZ' },
      { label: '0-9', value: '0-9' },
    ],
  },
];

const PATTERN_MANGA_ID = /\/comic\/([^_]+)/;
const PATTERN_HOUR_TIME = /([0-9]+)小时前 更新/;
const PATTERN_FULL_TIME = /([0-9]{4}年[0-9]{2}月[0-9]{2}日)/;
const PATTERN_SLOT = /section_slot=([0-9]*)&chapter_slot=([0-9]*)/;
const PATTERN_SLOT_HTML = /\/[^_/]+_?([^/]*)\/([0-9]*)_([0-9]*)_?([0-9]*)\.html/;

class BaoziManga extends Base {
  constructor() {
    const userAgent =
      Platform.OS === 'android'
        ? 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
    super({
      score: 4,
      id: Plugin.BZM,
      name: '包子漫画',
      shortName: 'BZM',
      description: '国漫',
      href: 'https://cn.baozimhcn.com/',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent, Referer: 'https://cn.baozimhcn.com/' },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (
    page,
    { type, region, status, filter }
  ) => {
    const body = {
      type,
      region,
      filter,
      page,
      state: status,
      limit: 36,
      language: 'cn',
      __amp_source_origin: this.href,
    };

    if (filter === Options.Default) {
      body.filter = '*';
    }
    if (region === Options.Default) {
      body.region = 'all';
    }
    if (status === Options.Default) {
      body.state = 'all';
    }
    if (type === Options.Default) {
      body.type = 'all';
    }

    return {
      url: 'https://cn.baozimhcn.com/api/bzmhq/amp_comic_list',
      body,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, _page) => {
    return {
      url: `https://cn.baozimhcn.com/search?q=${keyword}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://cn.baozimhcn.com/comic/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId, page, extra) => {
    return {
      url:
        typeof extra.hash === 'string'
          ? `https://cn.dzmanga.com/comic/chapter/${mangaId}_${extra.hash}/${chapterId}_${page}.html`
          : `https://cn.dzmanga.com/comic/chapter/${mangaId}/${chapterId}_${page}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (res: DiscoveryResponse) => {
    const $ = cheerio.load((res || '') as unknown as string);
    this.checkCloudFlare($);
    return {
      discovery: res.items.map((item) => ({
        href: `https://cn.baozimhcn.com/comic/${item.comic_id}`,
        hash: Base.combineHash(this.id, String(item.comic_id)),
        source: this.id,
        sourceName: this.name,
        mangaId: item.comic_id,
        bookCover: `https://static-tw.baozimh.com/cover/${item.topic_img}`,
        title: item.name,
        author: [item.author],
        tag: item.type_names,
        status: MangaStatus.Unknown,
      })),
    };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);

    const list: IncreaseManga[] = (
      $('.classify-items > div').toArray() as cheerio.TagElement[]
    ).map((div) => {
      const $$ = cheerio.load(div);

      const href = $$('.comics-card__poster').first().attr('href') || '';
      const cover = $$('.comics-card__poster > amp-img').attr('src') || '';
      const author = $$('.comics-card__info .tags').text().trim();
      const title = $$('.comics-card__info .comics-card__title').text().trim();
      const tags = ($$('.comics-card__poster .tabs .tab').toArray() as cheerio.TagElement[]).map(
        (span) => (span.children[0].data || '').trim()
      );
      const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

      return {
        href: `https://cn.baozimhcn.com/comic/${mangaId}`,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId,
        title,
        status: MangaStatus.Unknown,
        bookCover: queryString.parseUrl(cover).url,
        author: [author],
        tag: tags,
      };
    });

    return { search: list };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);
    const manga: IncreaseManga = {
      href: '',
      hash: '',
      source: this.id,
      sourceName: this.name,
      mangaId: '',
      title: '',
      latest: '',
      updateTime: '',
      author: [],
      tag: [],
      status: MangaStatus.Unknown,
      chapters: [],
    };

    const [, mangaId] =
      ($('meta[name=og:url]').attr('content') || '').match(PATTERN_MANGA_ID) || [];
    const cover = $('.comics-detail .l-content amp-img').first().attr('src') || '';
    const title = $('.comics-detail .l-content .comics-detail__info .comics-detail__title')
      .first()
      .text()
      .trim();
    const author = $('.comics-detail .l-content .comics-detail__info .comics-detail__author')
      .first()
      .text()
      .trim();
    const tags = (
      $(
        '.comics-detail .l-content .comics-detail__info .tag-list .tag'
      ).toArray() as cheerio.TagElement[]
    )
      .map((span) => (span.children[0].data || '').trim())
      .filter((item) => item !== '');
    const latest =
      $('.comics-detail .l-content .supporting-text > div:not(.tag-list) a').first().text() || '';
    const updateTimeLabel =
      $('.comics-detail .l-content .supporting-text > div:not(.tag-list) em').first().text() || '';

    let updateTime;
    if (PATTERN_FULL_TIME.test(updateTimeLabel)) {
      updateTime = (updateTimeLabel.match(PATTERN_FULL_TIME) || [])[1];
      updateTime = dayjs(updateTime, 'YYYY年MM月DD日').format('YYYY-MM-DD');
    } else if (PATTERN_HOUR_TIME.test(updateTimeLabel)) {
      updateTime = (updateTimeLabel.match(PATTERN_HOUR_TIME) || [])[1];
      updateTime = dayjs()
        .subtract(Number(updateTime) || 0, 'h')
        .format('YYYY-MM-DD');
    } else if (updateTimeLabel.includes('今天 更新')) {
      updateTime = dayjs().format('YYYY-MM-DD');
    }

    const chapters = (
      [
        ...$('#chapter-items > div').toArray(),
        ...$('#chapters_other_list > div').toArray(),
        ...$('.l-content .pure-g > div.comics-chapters').toArray(),
      ] as cheerio.TagElement[]
    )
      .map((div) => {
        const $$ = cheerio.load(div);
        const [, sectionSlot, chapterSlot] =
          ($$('a').first().attr('href') || '').match(PATTERN_SLOT) || [];
        const chapterId = sectionSlot + '_' + chapterSlot;
        const chapterTitle = $$('span').first().text();

        return {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          href: `https://cn.dzmanga.com/comic/chapter/${mangaId}/${chapterId}.html`,
          title: chapterTitle,
        };
      })
      .reverse();

    if (tags.includes('连载中')) {
      manga.status = MangaStatus.Serial;
    }
    if (tags.includes('已完结')) {
      manga.status = MangaStatus.End;
    }

    manga.href = `https://cn.baozimhcn.com/comic/${mangaId}`;
    manga.mangaId = mangaId;
    manga.hash = Base.combineHash(this.id, mangaId);
    manga.title = title;
    manga.infoCover = queryString.parseUrl(cover).url;
    manga.latest = latest;
    manga.updateTime = updateTime;
    manga.author = [author];
    manga.tag = tags.filter((tag) => tag !== '连载中' && tag !== '已完结');
    manga.chapters = chapters;

    return { manga };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null, mangaId, chapterId, page) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);

    const next = ($('div.next_chapter a').toArray() as cheerio.TagElement[]).find((a) =>
      (a.children[0].data || '').includes('下一页')
    );
    const href = next ? next.attribs.href : '';
    const [, hash, _sectionSlot, _chapterSlot, pageSlot] = href.match(PATTERN_SLOT_HTML) || [];
    const title = $('.comic-chapter .header .l-content .title').first().text();
    const images = (
      $('.comic-contain > div:not(#div_top_ads):not(.mobadsq)').toArray() as cheerio.TagElement[]
    ).map((div) => {
      const $$ = cheerio.load(div);
      return {
        uri: $$('amp-img').first().attr('src') || '',
      };
    });

    return {
      canLoadMore: Number(pageSlot) > page,
      chapter: {
        hash: Base.combineHash(this.id, mangaId, chapterId),
        mangaId,
        chapterId,
        title,
        headers: this.defaultHeaders,
        images,
      },
      nextExtra: { hash },
    };
  };
}

export default new BaoziManga();
