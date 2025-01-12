import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import { Platform } from 'react-native';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';

interface BaseResponse<T> {
  data: T;
  msg: string;
  status: number;
  u: any[];
}
interface ChapterData {
  chapter_name: string;
  hn: boolean;
  id: number;
  isEn: boolean;
  manga_code: string;
  manga_cover: string;
  manga_id: number;
  manga_name: string;
  scans: {
    height: number;
    n: number;
    r: number;
    url: string;
    width: number;
  }[];
  show: boolean;
}
interface DiscoveryResponse
  extends BaseResponse<{
    isEnd: boolean;
    items: {
      cover: string;
      last_chapter: string;
      manga_code: string;
      name: string;
    }[];
  }> {}
interface SearchResponse
  extends BaseResponse<{
    isEnd: boolean;
    items: {
      author: string;
      cover: string;
      /** e.g. 热血、悬疑、都市 */
      genre_ids: string;
      id: string;
      manga_code: string;
      name: string;
      /** e.g. spooky times,全球诡异时代（彩蛋日更中）,全球诡异时代（日更中） */
      other_names: string;
    }[];
  }> {}
interface ChapterDetailData {
  ascSort: boolean;
  descSort: boolean;
  chapterList: {
    chapterName: string;
    id: string;
    isNew: boolean;
  }[];
  originUrl: string;
  serie_code: string;
  serie_cover: string;
  serie_name: string;
}
interface ChapterResponse extends BaseResponse<ChapterData> {}

const discoveryOptions = [
  {
    name: 'type',
    options: [
      { label: '选择分类', value: Options.Default },
      /** 网站上有些 key 重复了，我也不知道为什么... */
      { label: '热血', value: 'rexue' },
      { label: '格斗', value: 'gedou' },
      { label: '武侠', value: 'wuxia' },
      { label: '魔幻', value: 'mohuan' },
      { label: '魔法', value: 'mofa' },
      { label: '冒险', value: 'maoxian' },
      { label: '爱情', value: 'aiqing' },
      { label: '搞笑', value: 'gaoxiao' },
      { label: '校园', value: 'xiaoyuan' },
      { label: '科幻', value: 'kehuan' },
      { label: '后宫', value: 'hougong' },
      { label: '励志', value: 'lizhi' },
      { label: '职场', value: 'zhichang' },
      { label: '美食', value: 'meishi' },
      { label: '社会', value: 'shehui' },
      { label: '黑道', value: 'heidao' },
      { label: '战争', value: 'zhanzheng' },
      { label: '历史', value: 'lishi' },
      { label: '悬疑', value: 'xuanyi' },
      { label: '竞技', value: 'jingji' },
      { label: '体育', value: 'tiyu' },
      { label: '恐怖', value: 'kongbu' },
      { label: '推理', value: 'tuili' },
      { label: '生活', value: 'shenghuo' },
      { label: '伪娘', value: 'weiniang' },
      { label: '治愈', value: 'zhiyu' },
      { label: '神鬼', value: 'shengui' },
      { label: '四格', value: 'sige' },
      { label: '百合', value: 'baihe' },
      { label: '耽美', value: 'danmei' },
      { label: '舞蹈', value: 'wudao' },
      { label: '侦探', value: 'zhentan' },
      { label: '宅男', value: 'zhainan' },
      { label: '音乐', value: 'yinyue' },
      { label: '萌系', value: 'mengxi' },
      { label: '古风', value: 'gufeng' },
      { label: '恋爱', value: 'lianai' },
      { label: '都市', value: 'dushi' },
      { label: '性转', value: 'xingzhuan' },
      { label: '穿越', value: 'chuanyue' },
      { label: '游戏', value: 'youxi' },
      { label: '其他', value: 'qita' },
      { label: '爱妻', value: 'aiqi' },
      { label: '日常', value: 'richang' },
      { label: '腹黑', value: 'fuhei' },
      { label: '古装', value: 'guzhuang' },
      { label: '仙侠', value: 'xianxia' },
      { label: '生化', value: 'shenghua' },
      { label: '修仙', value: 'xiuxian' },
      { label: '情感', value: 'qinggan' },
      { label: '改编', value: 'gaibian' },
      { label: '纯爱', value: 'chunai' },
      { label: '唯美', value: 'weimei' },
      { label: '蔷薇', value: 'qiangwei' },
      { label: '明星', value: 'mingxing' },
      { label: '猎奇', value: 'lieqi' },
      { label: '青春', value: 'qingchun' },
      { label: '幻想', value: 'huanxiang' },
      { label: '惊奇', value: 'jingqi' },
      { label: '彩虹', value: 'caihong' },
      { label: '奇闻', value: 'qiwen' },
      { label: '权谋', value: 'quanmou' },
      { label: '宅斗', value: 'zhaidou' },
      { label: '限制级', value: 'xianzhiji' },
      { label: '装逼', value: 'zhuangbi' },
      { label: '浪漫', value: 'langman' },
      { label: '偶像', value: 'ouxiang' },
      { label: '大女主', value: 'danvzhu' },
      { label: '复仇', value: 'fuchou' },
      { label: '虐心', value: 'nuexin' },
      { label: '恶搞', value: 'egao' },
      { label: '灵异', value: 'lingyi' },
      { label: '惊险', value: 'jingxian' },
      { label: '宠爱', value: 'chongai' },
      { label: '逆袭', value: 'nixi' },
      { label: '妖怪', value: 'yaoguai' },
      { label: '暧昧', value: 'aimei' },
      { label: '同人', value: 'tongren' },
      { label: '架空', value: 'jiakong' },
      { label: '真人', value: 'zhenren' },
      { label: '动作', value: 'dongzuo' },
      { label: '橘味', value: 'juwei' },
      { label: '宫斗', value: 'gongdou' },
      { label: '脑洞', value: 'naodong' },
      { label: '漫改', value: 'mangai' },
      { label: '战斗', value: 'zhandou' },
      { label: '丧尸', value: 'sangshi' },
      { label: '美少女', value: 'meishaonv' },
      { label: '怪物', value: 'guaiwu' },
      { label: '系统', value: 'xitong' },
      { label: '智斗', value: 'zhidou' },
      { label: '机甲', value: 'jijia' },
      { label: '高甜', value: 'gaotian' },
      { label: '僵尸', value: 'jiangshi' },
      // { label: '致郁', value: 'zhiyu' },
      { label: '电竞', value: 'dianjing' },
      { label: '神魔', value: 'shenmo' },
      { label: '异能', value: 'yineng' },
      { label: '末日', value: 'mori' },
      { label: '乙女', value: 'yinv' },
      { label: '豪快', value: 'haokuai' },
      { label: '奇幻', value: 'qihuan' },
      { label: '绅士', value: 'shenshi' },
      { label: '正能量', value: 'zhengnengliang' },
      { label: '宫廷', value: 'gongting' },
      { label: '亲情', value: 'qinqing' },
      { label: '养成', value: 'yangcheng' },
      { label: '剧情', value: 'juqing' },
      { label: '韩漫', value: 'hanman' },
      { label: '轻小说', value: 'qingxiaoshuo' },
      { label: '暗黑', value: 'anhei' },
      { label: '长条', value: 'changtiao' },
      { label: '玄幻', value: 'xuanhuan' },
      { label: '霸总', value: 'bazong' },
      { label: '欧皇', value: 'ouhuang' },
      { label: '生存', value: 'shengcun' },
      { label: '萌宠', value: 'mengchong' },
      { label: '异世界', value: 'yishijie' },
      // { label: '其它', value: 'qita' },
      { label: 'C99', value: 'C99' },
      { label: '节操', value: 'jiecao' },
      { label: 'AA', value: 'AA' },
      { label: '影视化', value: 'yingshihua' },
      { label: '欧风', value: 'oufeng' },
      { label: '女神', value: 'nvshen' },
      { label: '爽感', value: 'shuanggan' },
      { label: '转生', value: 'zhuansheng' },
      { label: '成长', value: 'chengzhang' },
      { label: '异形', value: 'yixing' },
      { label: '血族', value: 'xuezu' },
      { label: '团宠', value: 'tuanchong' },
      { label: '反套路', value: 'fantaolu' },
      { label: '双男主', value: 'shuangnanzhu' },
      { label: '无敌流', value: 'wudiliu' },
      { label: '心理', value: 'xinli' },
      { label: '颜艺', value: 'yanyi' },
    ],
  },
  {
    name: 'region',
    options: [
      { label: '选择地区', value: Options.Default },
      { label: '内地', value: 'china' },
      { label: '日本', value: 'japan' },
      { label: '港台', value: 'hongkong' },
      { label: '欧美', value: 'europe' },
      { label: '韩国', value: 'korea' },
      { label: '其他', value: 'other' },
    ],
  },
  {
    name: 'audience',
    options: [
      { label: '选择观众', value: Options.Default },
      { label: '少年', value: 'shaonian' },
      { label: '少女', value: 'shaonv' },
      { label: '青年', value: 'qingnian' },
    ],
  },
  {
    name: 'status',
    options: [
      { label: '选择状态', value: Options.Default },
      { label: '连载中', value: '0' },
      { label: '已完结', value: '1' },
    ],
  },
];

const PATTERN_YYYY_MM_DD = /[0-9]{4}-[0-9]{2}-[0-9]{2}/;
const PATTERN_MM_DD = /[0-9]{2}-[0-9]{2}/;

class HappyManga extends Base {
  constructor() {
    const userAgent =
      Platform.OS === 'android'
        ? 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
    super({
      disabled: true,
      score: 0,
      id: Plugin.HAPPY,
      name: '嗨皮漫画',
      shortName: 'HAPPY',
      description: '已失效',
      // description: '需要代理，图片有 CF 校验',
      href: 'https://m.happymh.com/',
      userAgent,
      defaultHeaders: { 'User-Agent': userAgent, Referer: 'https://m.happymh.com/', Cookie: '' },
      injectedJavaScript: `(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ cookie: document.cookie }));
      })();`,
      option: { discovery: discoveryOptions, search: [] },
    });
  }

  private v = 'v2.13';
  // 单独的漫画version
  private readv = 'v3.1613134';
  private checkProxy<T = any>(res: T | string): res is T {
    if (typeof res === 'string') {
      this.checkCloudFlare(cheerio.load(res || ''));
      return false;
    }
    return true;
  }

  syncExtraData = (data: Record<string, any>) => {
    this.defaultHeaders.Cookie = data.cookie || '';
  };

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (
    page,
    { type, region, audience, status }
  ) => {
    return {
      url: 'https://m.happymh.com/apis/c/index',
      body: {
        pn: page,
        genre: type === Options.Default ? undefined : type,
        area: region === Options.Default ? undefined : region,
        audience: audience === Options.Default ? undefined : audience,
        series_status: status === Options.Default ? '-1' : status,
        order: 'last_date',
      },
      headers: new Headers({ ...this.defaultHeaders, Referer: 'https://m.happymh.com/latest' }),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword) => {
    return {
      url: 'https://m.happymh.com/v2.0/apis/manga/ssearch',
      method: 'POST',
      body: {
        searchkey: keyword,
        v: this.v,
      },
      headers: new Headers({
        ...this.defaultHeaders,
        Origin: 'https://m.happymh.com',
        Referer: 'https://m.happymh.com/sssearch',
      }),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://m.happymh.com/manga/${mangaId}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: 'https://m.happymh.com/v2.0/apis/manga/reading',
      body: {
        code: mangaId,
        cid: chapterId,
        v: this.readv,
      },
      headers: new Headers({
        ...this.defaultHeaders,
        Referer: `https://m.happymh.com/mangaread/${mangaId}/${chapterId}`,
        /** 不是 XML 请求会返回 403 */
        'X-Requested-With': 'XMLHttpRequest',
      }),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (res: DiscoveryResponse | string) => {
    if (!this.checkProxy(res)) {
      throw new Error(ErrorMessage.AccessSourceFail);
    }

    if (res.status === 0) {
      return {
        discovery: res.data.items.map((item) => {
          const mangaId = item.manga_code;
          return {
            source: this.id,
            sourceName: this.name,
            href: `https://m.happymh.com/manga/${mangaId}`,
            hash: Base.combineHash(this.id, mangaId),
            mangaId,
            bookCover: item.cover,
            title: item.name,
            latest: item.last_chapter,
            headers: this.defaultHeaders,
          };
        }),
      };
    } else {
      return { error: new Error(ErrorMessage.WrongResponse + res.msg) };
    }
  };

  handleSearch: Base['handleSearch'] = (res: SearchResponse | string) => {
    if (!this.checkProxy(res)) {
      throw new Error(ErrorMessage.AccessSourceFail);
    }

    if (res.status === 0) {
      return {
        search: res.data.items.map((item) => {
          const mangaId = item.manga_code;
          return {
            source: this.id,
            sourceName: this.name,
            href: `https://m.happymh.com/manga/${mangaId}`,
            hash: Base.combineHash(this.id, mangaId),
            mangaId,
            bookCover: item.cover,
            title: item.name,
            tag: item.genre_ids.split('、'),
            author: [item.author],
            headers: this.defaultHeaders,
          };
        }),
      };
    } else {
      return { error: new Error(ErrorMessage.WrongResponse + res.msg) };
    }
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    const $ = cheerio.load(text || '');
    this.checkCloudFlare($);

    const chapterScriptContent =
      ($('mip-data:not([id]) script:not([src])').first()[0] as cheerio.TagElement).children[0]
        .data || '';
    const data: ChapterDetailData = JSON.parse(chapterScriptContent);
    const mangaId = data.serie_code;
    const statusLabel = $('div.chapter-info div.ongoing-status').first().text().trim();
    const updateTimeLabel = $('div.update-time p.time').first().text().trim();
    const author = ($('p.mg-sub-title a').toArray() as cheerio.TagElement[]).map(
      (a) => a.children[0].data || ''
    );
    const tag = ($('p.mg-cate a').toArray() as cheerio.TagElement[]).map(
      (a) => a.children[0].data || ''
    );

    let updateTime;
    if (PATTERN_YYYY_MM_DD.test(updateTimeLabel)) {
      updateTime = dayjs(updateTimeLabel, 'YYYY-MM-DD').format('YYYY-MM-DD');
    } else if (PATTERN_MM_DD.test(updateTimeLabel)) {
      updateTime = dayjs(updateTimeLabel, 'MM-DD').format('YYYY-MM-DD');
    } else {
      updateTime = dayjs(updateTimeLabel).format('YYYY-MM-DD');
    }

    let status = MangaStatus.Unknown;
    if (statusLabel?.includes('连载中')) {
      status = MangaStatus.Serial;
    } else if (statusLabel?.includes('已完结')) {
      status = MangaStatus.End;
    }

    return {
      manga: {
        href: data.originUrl,
        hash: Base.combineHash(this.id, mangaId),
        source: this.id,
        sourceName: this.name,
        mangaId: mangaId,
        chapters: data.chapterList.map((item) => ({
          hash: Base.combineHash(this.id, mangaId, item.id),
          mangaId: mangaId,
          chapterId: item.id,
          href: `https://m.happymh.com/reads/${mangaId}/${item.id}`,
          title: item.chapterName,
        })),
        infoCover: data.serie_cover,
        title: data.serie_name,
        updateTime,
        author,
        tag,
        status,
      },
    };
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (res: ChapterResponse | string) => {
    if (!this.checkProxy(res)) {
      throw new Error(ErrorMessage.AccessSourceFail);
    }

    if (res.status === 0) {
      const mangaId = res.data.manga_code;
      const chapterId = String(res.data.id);
      return {
        canLoadMore: false,
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          name: res.data.manga_name,
          title: res.data.chapter_name,
          headers: { ...this.defaultHeaders, Referer: 'https://m.happymh.com/' },
          images: res.data.scans.map((item) => ({ uri: item.url, isBase64Image: true })),
        },
      };
    } else {
      return { error: new Error(ErrorMessage.WrongResponse + res.msg) };
    }
  };
}

export default new HappyManga();
