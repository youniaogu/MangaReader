import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import queryString from 'query-string';
import LZString from 'lz-string';
import * as cheerio from 'cheerio';

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
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
    ],
  },
  {
    name: 'region',
    options: [
      { label: '选择地区', value: Options.Default },
      { label: '日本', value: 'japan' },
      { label: '港台', value: 'hongkong' },
      { label: '其他', value: 'other' },
      { label: '欧美', value: 'europe' },
      { label: '内地', value: 'china' },
      { label: '韩国', value: 'korea' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '连载中', value: 'lianzai' },
      { label: '已完结', value: 'wanjie' },
    ],
  },
  {
    name: 'sort',
    options: [
      { label: '添加时间', value: Options.Default },
      { label: '更新时间', value: 'update' },
      { label: '浏览次数', value: 'view' },
      { label: '评分最高', value: 'rate' },
    ],
  },
];

const PATTERN_MANGA_ID = /^https:\/\/www\.mhgui\.com\/comic\/([0-9]+)/;
const PATTERN_MANGA_INFO = /{ id: ([0-9]*), status:[0-9]*,block_cc:'.*', name: '(.+)', url: '.*' }/;
const PATTERN_CHAPTER_ID = /^https:\/\/www\.mhgui\.com\/comic\/[0-9]+\/([0-9]+)(?=\.html|$)/;
const PATTERN_SCRIPT = /window\["\\x65\\x76\\x61\\x6c"\](.+)(?=$)/;
const PATTERN_READER_DATA = /^SMH\.imgData\((.+)(?=\)\.preInit\(\);)/;
const PATTERN_FULL_TIME = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;

class ManHuaGui extends Base {
  constructor() {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
    super({
      disabled: true,
      score: 0,
      id: Plugin.MHG,
      name: '漫画柜',
      shortName: 'MHG',
      description: '已失效',
      href: 'https://www.mhgui.com',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent },
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, { type, region, status, sort }) => {
    const query = [region, type, status].filter((item) => item !== Options.Default).join('_');
    return {
      url: `https://www.mhgui.com/list${query ? '/' + query : ''}/${
        sort === Options.Default ? 'index' : sort
      }_p${page}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: `https://www.mhgui.com/s/${keyword}_p${page}.html`,
      method: 'POST',
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://www.mhgui.com/comic/${mangaId}/`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://www.mhgui.com/comic/${mangaId}/${chapterId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    $('ul#contList li')
      .toArray()
      .forEach((li) => {
        const $$ = cheerio.load(li);
        const a = $$('a:first-child').first();
        const img = $$('img').first();

        const href = `https://www.mhgui.com${a.attr('href')}/`;
        const title = a.attr('title');
        const cover = 'https:' + (img.attr('data-src') || img.attr('src'));
        const latest = $$('span.tt').first().text();
        const updateTimeLabel = $$('span.dt').first().text() || '';
        const [updateTime = ''] = updateTimeLabel.match(PATTERN_FULL_TIME) || [];
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

        let status = MangaStatus.Unknown;
        if ($$('span.sl').toArray().length > 0) {
          status = MangaStatus.Serial;
        }
        if ($$('span.fd').toArray().length > 0) {
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
        });
      });

    return { discovery: list };
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const list: IncreaseManga[] = [];

    $('div.book-result ul li.cf')
      .toArray()
      .forEach((li) => {
        const $$ = cheerio.load(li);
        const a = $$('div.book-cover a.bcover').first();
        const img = $$('div.book-cover a.bcover img').first();

        const href = `https://www.mhgui.com${a.attr('href')}`;
        const title = a.attr('title');
        const cover = 'https:' + (img.attr('data-src') || img.attr('src'));
        const fullUpdateTime = $$('div.book-detail dd.status span.red').last().text() || '';
        const latest = $$('div.book-detail dd.status a.blue').first().text();
        const [updateTime = ''] = fullUpdateTime.match(PATTERN_FULL_TIME) || [];
        const [, mangaId] = href.match(PATTERN_MANGA_ID) || [];

        const author = (
          $$('div.book-detail dd:nth-child(4) a').toArray() as cheerio.TagElement[]
        ).map((item) => item.attribs.title);
        const tag = (
          $$(
            'div.book-detail dd:nth-child(3) span:nth-child(3) a'
          ).toArray() as cheerio.TagElement[]
        ).map((item) => item.attribs.title);

        let status = MangaStatus.Unknown;
        if ($$('div.book-cover span.sl').toArray().length > 0) {
          status = MangaStatus.Serial;
        }
        if ($$('div.book-cover span.fd').toArray().length > 0) {
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
      ($('script:not([src])').get($('script:not([src])').length - 2) as cheerio.TagElement)
        .children[0].data || '';
    const [, mangaId, title] = scriptContent.match(PATTERN_MANGA_INFO) || [];
    const latest = $('div.chapter-bar a.blue').first().text();
    const updateTimeLabel = $('div.chapter-bar span.fr span.red').last().text() || '';
    const [updateTime = ''] = updateTimeLabel.match(PATTERN_FULL_TIME) || [];
    const author = (
      $(
        'div.book-detail ul.detail-list li:nth-child(2) span:nth-child(2) a'
      ).toArray() as cheerio.TagElement[]
    ).map((a) => a.attribs.title);
    const tag = (
      $(
        'div.book-detail ul.detail-list li:nth-child(2) span:nth-child(1) a'
      ).toArray() as cheerio.TagElement[]
    ).map((a) => a.attribs.title);
    const cover = 'https:' + $('p.hcover img').first().attr('src');

    const isAudit = $('#erroraudit_show').length > 0;

    if (isAudit) {
      const encodeHtml = $('#__VIEWSTATE').first().attr('value') || '';
      const decodeHtml = LZString.decompressFromBase64(encodeHtml);

      if (decodeHtml) {
        const $$ = cheerio.load(decodeHtml);

        $$('div.chapter-list')
          .toArray()
          .forEach((div) => {
            const $$$ = cheerio.load(div);

            $$$('ul')
              .toArray()
              .reverse()
              .forEach((ul) => {
                const $$$$ = cheerio.load(ul);

                ($$$$('li a').toArray() as cheerio.TagElement[]).forEach((a) => {
                  const href = 'https://www.mhgui.com' + a.attribs.href;
                  const chapterTitle = (a.children[0] as cheerio.TagElement).children[0].data || '';
                  const [, chapterId] = href.match(PATTERN_CHAPTER_ID) || [];

                  chapters.push({
                    hash: Base.combineHash(this.id, mangaId, chapterId),
                    mangaId,
                    chapterId,
                    href,
                    title: chapterTitle,
                  });
                });
              });
          });
      }
    } else {
      $('div.chapter-list')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);

          $$('ul')
            .toArray()
            .reverse()
            .forEach((ul) => {
              const $$$ = cheerio.load(ul);

              ($$$('li a').toArray() as cheerio.TagElement[]).forEach((a) => {
                const href = 'https://www.mhgui.com' + a.attribs.href;
                const chapterTitle = (a.children[0] as cheerio.TagElement).children[0].data || '';
                const [, chapterId] = href.match(PATTERN_CHAPTER_ID) || [];

                chapters.push({
                  hash: Base.combineHash(this.id, mangaId, chapterId),
                  mangaId,
                  chapterId,
                  href,
                  title: chapterTitle,
                });
              });
            });
        });
    }

    if ($('p.hcover span.serial').toArray().length > 0) {
      manga.status = MangaStatus.Serial;
    }
    if ($('p.hcover span.finish').toArray().length > 0) {
      manga.status = MangaStatus.End;
    }

    manga.href = `https://www.mhgui.com/comic/${mangaId}`;
    manga.mangaId = mangaId;
    manga.hash = Base.combineHash(this.id, mangaId);
    manga.title = title;
    manga.infoCover = cover;
    manga.latest = latest;
    manga.updateTime = updateTime;
    manga.author = author;
    manga.tag = tag;
    manga.chapters = chapters;

    return { manga };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    const scriptAfterFilter = ($('script:not([src])').toArray() as cheerio.TagElement[]).filter(
      (script) => PATTERN_SCRIPT.test(script.children[0].data || '')
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

    const { bid, cid, bname, cname, files = [], path, sl } = data;

    return {
      canLoadMore: false,
      chapter: {
        hash: Base.combineHash(this.id, bid, cid),
        mangaId: bid,
        chapterId: cid,
        name: bname,
        title: cname,
        headers: {
          ...this.defaultHeaders,
          host: 'i.hamreus.com',
          referer: 'https://www.mhgui.com/',
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        images: files.map((item: string) => ({
          uri: encodeURI(
            decodeURI('https://i.hamreus.com/' + path + item + '?' + queryString.stringify(sl))
          ),
        })),
      },
    };
  };
}

export default new ManHuaGui();
