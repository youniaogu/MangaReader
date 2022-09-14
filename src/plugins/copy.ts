import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';

interface BaseResponse<T> {
  code: number;
  message: string;
  results: T;
}
interface DiscoveryResponse
  extends BaseResponse<{
    total: number;
    list: {
      name: string;
      cover: string;
      path_word: string;
      datetime_updated: string;
      author: { name: string; path_word: string }[];
      theme: { name: string; path_word: string }[];
    }[];
  }> {}
interface SearchResponse
  extends BaseResponse<{
    limit: number;
    list: {
      name: string;
      cover: string;
      path_word: string;
      author: { name: string; path_word: string }[];
      theme: { name: string; path_word: string }[];
    }[];
  }> {}
interface MangaInfoResponse
  extends BaseResponse<{
    comic: {
      name: string;
      path_word: string;
      status: { value: 0 | 1; display: string };
      author: { name: string; path_word: string }[];
      theme: { name: string; path_word: string }[];
      datetime_updated: string;
      cover: string;
      last_chapter: { uuid: string; name: string };
    };
  }> {}
interface ChapterListResponse
  extends BaseResponse<{
    total: number;
    limit: number;
    offset: number;
    list: { uuid: string; name: string; comic_path_word: string }[];
  }> {}
interface ChapterResponse
  extends BaseResponse<{
    comic: {
      name: string;
      path_word: string;
    };
    chapter: {
      name: string;
      uuid: string;
      contents: { url: string }[];
      words: number[];
    };
  }> {}

const options = {
  type: [
    { label: '选择分类', value: Options.Default },
    { label: '愛情', value: 'aiqing' },
    { label: '歡樂向', value: 'huanlexiang' },
    { label: '冒险', value: 'maoxian' },
    { label: '奇幻', value: 'qihuan' },
    { label: '百合', value: 'baihe' },
    { label: '校园', value: 'xiaoyuan' },
    { label: '科幻', value: 'kehuan' },
    { label: '東方', value: 'dongfang' },
    { label: '生活', value: 'shenghuo' },
    { label: '轻小说', value: 'qingxiaoshuo' },
    { label: '格鬥', value: 'gedou' },
    { label: '耽美', value: 'danmei' },
    { label: '悬疑', value: 'xuanyi' },
    { label: '神鬼', value: 'shengui' },
    { label: '其他', value: 'qita' },
    { label: '职场', value: 'zhichang' },
    { label: '萌系', value: 'mengxi' },
    { label: '治愈', value: 'zhiyu' },
    { label: '長條', value: 'changtiao' },
    { label: '四格', value: 'sige' },
    { label: '舰娘', value: 'jianniang' },
    { label: '节操', value: 'jiecao' },
    { label: 'TL', value: 'teenslove' },
    { label: '竞技', value: 'jingji' },
    { label: '搞笑', value: 'gaoxiao' },
    { label: '伪娘', value: 'weiniang' },
    { label: '热血', value: 'rexue' },
    { label: '後宮', value: 'hougong' },
    { label: '美食', value: 'meishi' },
    { label: '性转换', value: 'xingzhuanhuan' },
    { label: '侦探', value: 'zhentan' },
    { label: '励志', value: 'lizhi' },
    { label: 'AA', value: 'aa' },
    { label: '彩色', value: 'COLOR' },
    { label: '音乐舞蹈', value: 'yinyuewudao' },
    { label: '异世界', value: 'yishijie' },
    { label: '战争', value: 'zhanzheng' },
    { label: '历史', value: 'lishi' },
    { label: '机战', value: 'jizhan' },
    { label: '惊悚', value: 'jingsong' },
    { label: 'C99', value: 'comiket99' },
    { label: '恐怖', value: '恐怖' },
    { label: '都市', value: 'dushi' },
    { label: 'C97', value: 'comiket97' },
    { label: '穿越', value: 'chuanyue' },
    { label: 'C96', value: 'comiket96' },
    { label: '重生', value: 'chongsheng' },
    { label: '魔幻', value: 'mohuan' },
    { label: '宅系', value: 'zhaixi' },
    { label: '武侠', value: 'wuxia' },
    { label: 'C98', value: 'C98' },
    { label: '生存', value: 'shengcun' },
    { label: 'C95', value: 'comiket95' },
    { label: 'FATE', value: 'fate' },
    { label: '無修正', value: 'Uncensored' },
    { label: '转生', value: 'zhuansheng' },
    { label: 'LoveLive', value: 'loveLive' },
    { label: '男同', value: 'nantong' },
    { label: '仙侠', value: 'xianxia' },
    { label: '玄幻', value: 'xuanhuan' },
    { label: '真人', value: 'zhenren' },
  ],
  region: [
    { label: '选择地区', value: Options.Default },
    { label: '日本', value: 'japan' },
    { label: '韩国', value: 'korea' },
    { label: '欧美', value: 'west' },
    { label: '完结', value: 'finish' },
  ],
  status: [{ label: '选择状态', value: Options.Default }],
  sort: [
    { label: '更新时间⬇️', value: Options.Default },
    { label: '更新时间⬆️', value: 'datetime_updated' },
    { label: '热度⬇️', value: '-popular' },
    { label: '热度⬆️', value: 'popular' },
  ],
};

class CopyManga extends Base {
  readonly userAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
  readonly defaultHeaders = {
    webp: '1',
    region: '1',
    platform: '1',
    version: '2022.08.14',
    pragma: 'no-cache',
    accept: 'application/json',
    origin: 'https://copymanga.site',
    referer: 'https://copymanga.site/',
    'user-agent': this.userAgent,
    'cache-control': 'no-cache',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'content-encoding': 'gzip, compress, br',
  };

  constructor(
    pluginID: Plugin,
    pluginName: string,
    pluginScore: number,
    pluginShortName: string,
    pluginDescription: string
  ) {
    super(
      pluginID,
      pluginName,
      pluginScore,
      pluginShortName,
      pluginDescription,
      options.type,
      options.region,
      options.status,
      options.sort
    );
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, type, region, _status, sort) => {
    return {
      url: 'https://api.copymanga.net/api/v3/comics',
      body: {
        free_type: 1,
        limit: 21,
        offset: (page - 1) * 21,
        ordering: sort === Options.Default ? '-datetime_updated' : sort,
        theme: type === Options.Default ? undefined : type,
        top: region === Options.Default ? undefined : region,
        _update: 'true',
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: 'https://api.copymanga.net/api/v3/search/comic',
      body: {
        platform: 1,
        q: keyword,
        limit: 20,
        offset: (page - 1) * 20,
        q_type: '',
        _update: 'true',
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://api.copymanga.net/api/v3/comic2/${mangaId}`,
      body: {
        platform: 1,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = (mangaId, page) => {
    return {
      url: `https://api.copymanga.net/api/v3/comic/${mangaId}/group/default/chapters`,
      body: {
        limit: 100,
        offset: (page - 1) * 100,
      },
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterFetch: Base['prepareChapterFetch'] = (mangaId, chapterId) => {
    return {
      url: `https://api.copymanga.net/api/v3/comic/${mangaId}/chapter2/${chapterId}`,
      body: {
        platform: 1,
        _update: 'true',
      },
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (res: DiscoveryResponse) => {
    try {
      if (res.code === 200) {
        return {
          discovery: res.results.list.map((item) => {
            return {
              href: `https://copymanga.site/h5/details/comic/${item.path_word}`,
              hash: Base.combineHash(this.id, item.path_word),
              source: this.id,
              sourceName: this.name,
              mangaId: item.path_word,
              cover: item.cover,
              title: item.name,
              latest: '',
              updateTime: item.datetime_updated,
              author: item.author.map((obj) => obj.name),
              tag: item.theme.map((obj) => obj.name),
              status: MangaStatus.Unknown,
              chapters: [],
            };
          }),
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleSearch: Base['handleSearch'] = (res: SearchResponse) => {
    try {
      if (res.code === 200) {
        return {
          search: res.results.list.map((item) => {
            return {
              href: `https://copymanga.site/h5/details/comic/${item.path_word}`,
              hash: Base.combineHash(this.id, item.path_word),
              source: this.id,
              sourceName: this.name,
              mangaId: item.path_word,
              cover: item.cover,
              title: item.name,
              latest: '',
              updateTime: '',
              author: [],
              tag: [],
              status: MangaStatus.Unknown,
              chapters: [],
            };
          }),
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleMangaInfo: Base['handleMangaInfo'] = (res: MangaInfoResponse) => {
    try {
      if (res.code === 200) {
        const { name, status, cover, path_word, author, theme, datetime_updated, last_chapter } =
          res.results.comic;

        let mangaStatus = MangaStatus.Unknown;
        if (status.value === 0) {
          mangaStatus = MangaStatus.Serial;
        }
        if (status.value === 1) {
          mangaStatus = MangaStatus.End;
        }

        return {
          manga: {
            href: `https://copymanga.site/h5/details/comic/${path_word}`,
            hash: Base.combineHash(this.id, path_word),
            source: this.id,
            sourceName: this.name,
            mangaId: path_word,
            cover,
            title: name,
            latest: last_chapter.name,
            updateTime: datetime_updated,
            author: author.map((obj) => obj.name),
            tag: theme.map((obj) => obj.name),
            status: mangaStatus,
            chapters: [],
          },
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleChapterList: Base['handleChapterList'] = (res: ChapterListResponse) => {
    try {
      if (res.code === 200) {
        const { list, total, limit, offset } = res.results;

        return {
          chapterList: list.reverse().map((item) => {
            const { name, comic_path_word, uuid } = item;

            return {
              hash: Base.combineHash(this.id, comic_path_word, uuid),
              mangaId: comic_path_word,
              chapterId: uuid,
              href: `https://copymanga.site/h5/comicContent/${comic_path_word}/${uuid}`,
              title: name,
            };
          }),
          canLoadMore: total > limit + offset,
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleChapter: Base['handleChapter'] = (res: ChapterResponse) => {
    try {
      if (res.code === 200) {
        const { comic, chapter } = res.results;
        const { contents, words } = chapter;

        const ziped = words.map((item, index: number) => {
          return {
            url: contents[index].url,
            index: item,
          };
        });
        const sorted = ziped.sort((a, b) => a.index - b.index);

        return {
          chapter: {
            hash: Base.combineHash(this.id, comic.path_word, chapter.uuid),
            mangaId: comic.path_word,
            chapterId: chapter.uuid,
            name: comic.name,
            title: chapter.name,
            headers: {
              ...this.defaultHeaders,
              accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
            images: sorted.map((item) => ({ uri: item.url })),
          },
        };
      } else {
        throw new Error(ErrorMessage.WrongResponse + res.message);
      }
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };
}

export default new CopyManga(
  Plugin.COPY,
  'copymanga',
  5,
  'COPY',
  '拷贝漫画，资源全，甚至有本子分类'
);
