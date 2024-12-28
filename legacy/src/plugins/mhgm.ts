import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import queryString from 'query-string';
import LZString from 'lz-string';
import * as cheerio from 'cheerio';

const hostnames = [
  { h: 'i', w: 0.1 },
  { h: 'eu', w: 5 },
  { h: 'eu1', w: 5 },
  { h: 'us', w: 1 },
  { h: 'us1', w: 1 },
  { h: 'us2', w: 1 },
  { h: 'us3', w: 1 },
];

const randomHostname = (n = hostnames) => {
  for (var i = [n[0].w], r, t = 1; t < n.length; t++) {
    i[t] = n[t].w + i[t - 1];
  }
  for (r = Math.random() * i[i.length - 1], t = 0; t < i.length; t++) {
    if (i[t] > r) {
      break;
    }
  }
  return n[t].h;
};

const hostname = randomHostname(hostnames);

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      { label: '连载', value: 'lianzai' },
      { label: '完结', value: 'wanjie' },
      { label: '日本', value: 'japan' },
      { label: '港台', value: 'hongkong' },
      { label: '其他', value: 'other' },
      { label: '欧美', value: 'europe' },
      { label: '内地', value: 'china' },
      { label: '韩国', value: 'korea' },
      { label: '热血', value: 'rexue' },
      { label: '冒险', value: 'maoxian' },
      { label: '魔幻', value: 'mohuan' },
      { label: '神鬼', value: 'shengui' },
      { label: '搞笑', value: 'gaoxiao' },
      { label: '萌系', value: 'mengxi' },
      { label: '爱情', value: 'aiqing' },
      { label: '科幻', value: 'kehuan' },
      { label: '魔法', value: 'mofa' },
      { label: '格斗', value: 'gedou' },
      { label: '武侠', value: 'wuxia' },
      { label: '机战', value: 'jizhan' },
      { label: '战争', value: 'zhanzheng' },
      { label: '竞技', value: 'jingji' },
      { label: '体育', value: 'tiyu' },
      { label: '校园', value: 'xiaoyuan' },
      { label: '生活', value: 'shenghuo' },
      { label: '励志', value: 'lizhi' },
      { label: '历史', value: 'lishi' },
      { label: '伪娘', value: 'weiniang' },
      { label: '宅男', value: 'zhainan' },
      { label: '腐女', value: 'funv' },
      { label: '耽美', value: 'danmei' },
      { label: '百合', value: 'baihe' },
      { label: '后宫', value: 'hougong' },
      { label: '治愈', value: 'zhiyu' },
      { label: '美食', value: 'meishi' },
      { label: '推理', value: 'tuili' },
      { label: '悬疑', value: 'xuanyi' },
      { label: '恐怖', value: 'kongbu' },
      { label: '四格', value: 'sige' },
      { label: '职场', value: 'zhichang' },
      { label: '侦探', value: 'zhentan' },
      { label: '社会', value: 'shehui' },
      { label: '音乐', value: 'yinyue' },
      { label: '舞蹈', value: 'wudao' },
      { label: '杂志', value: 'zazhi' },
      { label: '黑道', value: 'heidao' },
      { label: '少女', value: 'shaonv' },
      { label: '少年', value: 'shaonian' },
      { label: '青年', value: 'qingnian' },
      { label: '儿童', value: 'ertong' },
      { label: '通用', value: 'tongyong' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '添加时间', value: Options.Default },
      { label: '更新时间', value: 'update' },
      { label: '浏览次数', value: 'view' },
    ],
  },
];
const searchOptions = [
  {
    name: 'sort',
    options: [
      { label: '添加时间', value: Options.Default },
      { label: '更新时间', value: '1' },
      { label: '浏览次数', value: '2' },
    ],
  },
];

const PATTERN_MANGA_ID = /^https:\/\/m\.manhuagui\.com\/comic\/([0-9]+)/;
const PATTERN_MANGA_INFO = /{ bid:([0-9]*), status:[0-9]*,block_cc:'' }/;
const PATTERN_CHAPTER_ID = /^https:\/\/m\.manhuagui\.com\/comic\/[0-9]+\/([0-9]+)(?=\.html|$)/;
const PATTERN_SCRIPT = /^window\["\\x65\\x76\\x61\\x6c"\](.+)(?=$)/;
const PATTERN_READER_DATA = /^SMH\.reader\((.+)(?=\)\.preInit\(\);)/;
const PATTERN_FULL_TIME = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const PATTERN_AUTHOR = /作者：(.*)/;
const PATTERN_TAG = /类别：(.*)/;

class ManHuaGuiMobile extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    super({
      score: 5,
      id: Plugin.MHGM,
      name: '漫画柜mobile',
      shortName: 'MHGM',
      description: '需要代理，频繁访问会封IP',
      href: 'https://m.manhuagui.com',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent },
      option: { discovery: discoveryOptions, search: searchOptions },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, sort }) => {
    return {
      url: `https://m.manhuagui.com/list/${type !== Options.Default ? type + '/' : ''}`,
      body: {
        page,
        catid: 0,
        ajax: 1,
        order: sort === Options.Default ? '' : sort,
      },
      headers: new Headers({ ...this.defaultHeaders, host: 'm.manhuagui.com' }),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page, { sort }) => {
    const body = new FormData();
    body.append('key', keyword);
    body.append('page', String(page));
    body.append('ajax', '1');
    body.append('order', '1');

    return {
      url: `https://m.manhuagui.com/s/${keyword}_o${sort === Options.Default ? '0' : sort}.html/`,
      method: 'POST',
      body: page > 1 ? body : undefined,
      headers: new Headers({ ...this.defaultHeaders, host: 'm.manhuagui.com' }),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://m.manhuagui.com/comic/${mangaId}/`,
      headers: new Headers({ ...this.defaultHeaders, host: 'm.manhuagui.com' }),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://m.manhuagui.com/comic/${mangaId}/${chapterId}.html`,
      headers: new Headers({ ...this.defaultHeaders, host: 'm.manhuagui.com' }),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    ($('li > a').toArray() as cheerio.TagElement[]).forEach((a) => {
      const $$ = cheerio.load(a);
      const href = 'https://m.manhuagui.com' + a.attribs.href;
      const title = $$('h3').first().text();
      const statusLabel = $$('div.thumb i').first().text(); // 连载 or 完结
      const cover = 'https:' + $$('div.thumb img').first().attr('data-src');
      const [authorLabel, tagLabel, latestLabel, updateTimeLabel] = $$('dl')
        .toArray()
        .map((dl) => cheerio.load(dl)('dd').first().text().trim());
      const author = authorLabel.split(',');
      const tag = tagLabel.split(',');
      const latest = latestLabel !== '' ? latestLabel : undefined;
      const updateTime = PATTERN_FULL_TIME.test(updateTimeLabel) ? updateTimeLabel : undefined;
      const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

      let status = MangaStatus.Unknown;
      if (statusLabel === '连载') {
        status = MangaStatus.Serial;
      }
      if (statusLabel === '完结') {
        status = MangaStatus.End;
      }

      if (!mangaId || !title) {
        return;
      }

      list.push({
        href,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId,
        title,
        status,
        bookCover: cover,
        latest,
        updateTime,
        author,
        tag,
      });
    });

    return { discovery: list };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    ($('ul#detail > li > a').toArray() as cheerio.TagElement[]).forEach((a) => {
      const $$ = cheerio.load(a);
      const href = 'https://m.manhuagui.com' + a.attribs.href;
      const title = $$('h3').first().text();
      const statusLabel = $$('div.thumb i').first().text(); // 连载 or 完结
      const cover = 'https:' + $$('div.thumb img').first().attr('data-src');
      const [authorLabel, tagLabel, latestLabel, updateTimeLabel] = $$('dl')
        .toArray()
        .map((dl) => cheerio.load(dl)('dd').first().text().trim());
      const author = authorLabel.split(',');
      const tag = tagLabel.split(',');
      const latest = latestLabel !== '' ? latestLabel : undefined;
      const updateTime = PATTERN_FULL_TIME.test(updateTimeLabel) ? updateTimeLabel : undefined;
      const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

      let status = MangaStatus.Unknown;
      if (statusLabel === '连载') {
        status = MangaStatus.Serial;
      }
      if (statusLabel === '完结') {
        status = MangaStatus.End;
      }

      if (!mangaId || !title) {
        return;
      }

      list.push({
        href,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId,
        title,
        status,
        bookCover: cover,
        latest,
        updateTime,
        author,
        tag,
      });
    });

    return { search: list };
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
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
    const chapters: ChapterItem[] = [];

    const scriptContent =
      ($('script:not([src]):not([type])').toArray() as cheerio.TagElement[]).filter((script) =>
        PATTERN_MANGA_INFO.test(script.children[0].data || '')
      )[0].children[0].data || '';
    const [, mangaId] = scriptContent.match(PATTERN_MANGA_INFO) || [];
    const statusLabel = $('div.book-detail div.thumb i').first().text(); // 连载 or 完结

    const [latest, updateTimeLabel = '', authorLabel = '', tagLabel] = $('div.cont-list dl')
      .toArray()
      .map((dl) => cheerio.load(dl).root().text());
    const [, tag] = tagLabel.match(PATTERN_TAG) || [];
    const [, author] = authorLabel.match(PATTERN_AUTHOR) || [];
    const [updateTime = ''] = updateTimeLabel.match(PATTERN_FULL_TIME) || [];

    const isAudit = $('#erroraudit_show').length > 0;

    if (isAudit) {
      const encodeHtml = $('#__VIEWSTATE').first().attr('value') || '';
      const decodeHtml = LZString.decompressFromBase64(encodeHtml);

      if (decodeHtml) {
        const $$ = cheerio.load(decodeHtml);

        ($$('ul > li > a').toArray() as cheerio.TagElement[]).forEach((a) => {
          const $$$ = cheerio.load(a);
          const title = $$$('b').first().text();
          const href = 'https://m.manhuagui.com' + a.attribs.href;
          const [, chapterId] = href.match(PATTERN_CHAPTER_ID) || [];

          chapters.push({
            hash: Base.combineHash(this.id, mangaId, chapterId),
            mangaId,
            chapterId,
            href,
            title,
          });
        });
      }
    } else {
      ($('#chapterList > ul > li > a').toArray() as cheerio.TagElement[]).forEach((a) => {
        const $$ = cheerio.load(a);
        const title = $$('b').first().text();
        const href = 'https://m.manhuagui.com' + a.attribs.href;
        const [, chapterId] = href.match(PATTERN_CHAPTER_ID) || [];

        chapters.push({
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          href,
          title,
        });
      });
    }

    if (statusLabel === '连载') {
      manga.status = MangaStatus.Serial;
    }
    if (statusLabel === '完结') {
      manga.status = MangaStatus.End;
    }

    manga.href = 'https://m.manhuagui.com/comic/' + mangaId;
    manga.mangaId = mangaId;
    manga.hash = Base.combineHash(this.id, mangaId);
    manga.title = $('div.main-bar > h1').first().text();
    manga.infoCover = 'https:' + $('div.thumb img').first().attr('src');
    manga.latest = latest;
    manga.updateTime = updateTime;
    manga.author = author.split(',');
    manga.tag = tag.split(',');
    manga.chapters = chapters;

    return { manga };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const scriptAfterFilter = ($('script:not([src])').toArray() as cheerio.TagElement[]).filter(
      (item) => PATTERN_SCRIPT.test(item.children[0].data || '')
    );

    if (scriptAfterFilter.length <= 0) {
      throw new Error(ErrorMessage.MissingChapterInfo);
    }
    const script = scriptAfterFilter[0].children[0].data || '';
    const [, scriptContent] = script.match(PATTERN_SCRIPT) || [];

    // eslint-disable-next-line no-eval
    const readerScript = eval(scriptContent) as string;
    const [, stringifyData] = readerScript.match(PATTERN_READER_DATA) || [];
    const data = JSON.parse(stringifyData);

    const { bookId, chapterId, bookName, chapterTitle, images = [], sl } = data;

    return {
      canLoadMore: false,
      chapter: {
        hash: Base.combineHash(this.id, bookId, chapterId),
        mangaId: bookId,
        chapterId,
        name: bookName,
        title: chapterTitle,
        headers: {
          ...this.defaultHeaders,
          host: `${hostname}.hamreus.com`,
          referer: 'https://m.manhuagui.com/',
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        images: images.map((item: string) => ({
          uri: encodeURI(
            decodeURI(`https://${hostname}.hamreus.com${item}?${queryString.stringify(sl)}`)
          ),
        })),
      },
    };
  };
}

export default new ManHuaGuiMobile();
