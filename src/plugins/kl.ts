import Base, { Plugin, Options } from './base';
import { MangaStatus, ErrorMessage } from '~/utils';
import * as cheerio from 'cheerio';

const splitSymbol = '*';
const options = {
  type: [
    { label: '选择分类', value: Options.Default },
    { label: '4 Koma', value: '4 Koma' },
    { label: 'Action', value: 'Action' },
    { label: 'Adult', value: 'Adult' },
    { label: 'Adventure', value: 'Adventure' },
    { label: 'Comedy', value: 'Comedy' },
    { label: 'Doujinshi', value: 'Doujinshi' },
    { label: 'Demons', value: 'Demons' },
    { label: 'Drama', value: 'Drama' },
    { label: 'Ecchi', value: 'Ecchi' },
    { label: 'Fantasy', value: 'Fantasy' },
    { label: 'Gender Bender', value: 'Gender Bender' },
    { label: 'Harem', value: 'Harem' },
    { label: 'Historical', value: 'Historical' },
    { label: 'Horror', value: 'Horror' },
    { label: 'Josei', value: 'Josei' },
    { label: 'Magic', value: 'Magic' },
    { label: 'Manhua', value: 'Manhua' },
    { label: 'Martial Art', value: 'Martial Art' },
    { label: 'Mature', value: 'Mature' },
    { label: 'Mecha', value: 'Mecha' },
    { label: 'Mystery', value: 'Mystery' },
    { label: 'One shot', value: 'One shot' },
    { label: 'Psychological', value: 'Psychological' },
    { label: 'Romance', value: 'Romance' },
    { label: 'School Life', value: 'School Life' },
    { label: 'Sci-fi', value: 'Sci-fi' },
    { label: 'Seinen', value: 'Seinen' },
    { label: 'Super Power', value: 'Super Power' },
    { label: 'Shoujo', value: 'Shoujo' },
    { label: 'Shoujo Ai', value: 'Shoujo Ai' },
    { label: 'Shounen', value: 'Shounen' },
    { label: 'Shounen Ai', value: 'Shounen Ai' },
    { label: 'Slice of Life', value: 'Slice of Life' },
    { label: 'Smut', value: 'Smut' },
    { label: 'Sports', value: 'Sports' },
    { label: 'Supernatural', value: 'Supernatural' },
    { label: 'Tragedy', value: 'Tragedy' },
    { label: 'Yaoi', value: 'Yaoi' },
  ],
  region: [{ label: '选择地区', value: Options.Default }],
  status: [
    { label: '选择状态', value: Options.Default },
    { label: 'Complete', value: '1' },
    { label: 'Incomplete', value: '2' },
  ],
  sort: [
    { label: '选择排序', value: Options.Default },
    { label: 'Name⬇️', value: ['name', 'DESC'].join(splitSymbol) },
    { label: 'Name⬆️', value: ['name', 'ASC'].join(splitSymbol) },
    { label: 'Most Views⬇️', value: ['views', 'DESC'].join(splitSymbol) },
    { label: 'Most Views⬆️', value: ['views', 'ASC'].join(splitSymbol) },
    { label: 'Last Update⬇️', value: ['last_update', 'DESC'].join(splitSymbol) },
    { label: 'Last Update⬆️', value: ['last_update', 'ASC'].join(splitSymbol) },
  ],
};

const PATTERN_HREF_ID = /([^/]*)\.html$/;
const PATTERN_LATEST_CHAPTER = /Last chapter: (.+)/;
const PATTERN_CHAPTER_NUMBER = /Chapter (.+)/;

class KL extends Base {
  readonly userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36';
  readonly defaultHeaders = {
    referer: 'https://klmanga.net/',
    'user-agent': this.userAgent,
  };

  constructor() {
    super({
      id: Plugin.KL,
      name: 'klmanga',
      shortName: 'KL',
      description: 'klmanga，国外的生肉漫画网站',
      score: 4,
      config: {
        origin: { label: '域名', value: 'https://klmanga.net' },
      },
      typeOptions: options.type,
      regionOptions: options.region,
      statusOptions: options.status,
      sortOptions: options.sort,
    });
  }

  prepareDiscoveryFetch: Base['prepareDiscoveryFetch'] = (page, type, region, status, sort) => {
    let sortType;
    let sortOrder;
    if (type === Options.Default) {
      type = '';
    }
    if (region === Options.Default) {
      region = '';
    }
    if (status === Options.Default) {
      status = '';
    }
    if (sort === Options.Default) {
      sortType = '';
      sortOrder = '';
    } else {
      const [a = '', b = ''] = sort.split(splitSymbol) as [string, string];
      sortType = a;
      sortOrder = b;
    }

    return {
      url: `https://klmanga.net/manga-list.html?listType=pagination&page=${page}&artist=&author=&group=&m_status=${status}&genre=${type}&sort=${sortType}&sort_type=${sortOrder}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareSearchFetch: Base['prepareSearchFetch'] = (keyword, page) => {
    return {
      url: `https://klmanga.net/manga-list.html?name=${keyword}&page=${page}`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareMangaInfoFetch: Base['prepareMangaInfoFetch'] = (mangaId) => {
    return {
      url: `https://klmanga.net/${mangaId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };
  prepareChapterListFetch: Base['prepareChapterListFetch'] = () => {};
  prepareChapterFetch: Base['prepareChapterFetch'] = (_mangaId, chapterId) => {
    return {
      url: `https://klmanga.net/${chapterId}.html`,
      headers: new Headers(this.defaultHeaders),
    };
  };

  handleDiscovery: Base['handleDiscovery'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: IncreaseManga[] = [];

      $('div.bodythumb div.thumb-item-flow')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);

          const href = $$('div.series-title > a').attr('href') || '';
          const bg = $$('div.thumb-wrapper div.content').attr('data-bg') || '';
          const title = $$('div.series-title .title-thumb').text() || '';
          const updateTime = $$('time.timeago').text() || '';
          const [, mangaId] = href.match(PATTERN_HREF_ID) || [];
          const [, latest] =
            ($$('div.thumb-detail a').text() || '').match(PATTERN_LATEST_CHAPTER) || [];

          let cover = bg;
          if (bg !== '' && !cover.includes('http')) {
            cover = 'https://klmanga.net' + bg;
          }

          list.push({
            href: 'https://klmanga.net/' + href,
            hash: Base.combineHash(this.id, mangaId),
            source: this.id,
            sourceName: this.name,
            headers: this.defaultHeaders,
            mangaId,
            title,
            status: MangaStatus.Unknown,
            cover,
            latest,
            updateTime,
          });
        });

      return { discovery: list };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleSearch: Base['handleSearch'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');
      const list: IncreaseManga[] = [];

      $('div.bodythumb div.thumb-item-flow')
        .toArray()
        .forEach((div) => {
          const $$ = cheerio.load(div);

          const href = $$('div.series-title > a').attr('href') || '';
          const bg = $$('div.thumb-wrapper div.content').attr('data-bg') || '';
          const title = $$('div.series-title .title-thumb').text() || '';
          const updateTime = $$('time.timeago').text() || '';
          const [, mangaId] = href.match(PATTERN_HREF_ID) || [];
          const [, latest] =
            ($$('div.thumb-detail a').text() || '').match(PATTERN_LATEST_CHAPTER) || [];

          let cover = bg;
          if (bg !== '' && !bg.includes('http')) {
            cover = 'https://klmanga.net' + bg;
          }

          list.push({
            href: 'https://klmanga.net/' + href,
            hash: Base.combineHash(this.id, mangaId),
            source: this.id,
            sourceName: this.name,
            mangaId,
            title,
            status: MangaStatus.Unknown,
            cover,
            latest,
            updateTime,
          });
        });

      return { search: list };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleMangaInfo: Base['handleMangaInfo'] = (text: string | null) => {
    try {
      const $ = cheerio.load(text || '');

      const isChecking = $('title').first().text() === 'KLManga is checking.... ';
      if (isChecking) {
        throw new Error(ErrorMessage.DDoSRetry);
      }

      const href = $('link[rel=alternate]').attr('href') || '';
      const [, mangaId] = href.match(PATTERN_HREF_ID) || [];
      const bg = $('div.info-cover img.thumbnail').attr('src') || '';
      const title = $('ul.manga-info h3').text();
      const updateTime = $('ul.manga-info i > span').text();
      const li = $('ul.manga-info > li').toArray();
      const statusList = li
        .filter((item) => cheerio.load(item)('b').text().includes('Status'))
        .map((item) => cheerio.load(item)('a').text());
      const author = li
        .filter((item) => cheerio.load(item)('b').text().includes('Magazine'))
        .map((item) => cheerio.load(item)('a').text());
      const tag = li
        .filter((item) => cheerio.load(item)('b').text().includes('Genre'))
        .map((item) =>
          (cheerio.load(item)('a').toArray() as cheerio.TagElement[]).map(
            (a) => a.children[0].data || ''
          )
        );
      const chapters = ($('div#tab-chapper tr a.chapter').toArray() as cheerio.TagElement[]).map(
        (a) => {
          const $$ = cheerio.load(a);
          const chapterHref = a.attribs.href;
          const [, chapterTitle] = $$('b').text().match(PATTERN_CHAPTER_NUMBER) || [];
          const [, chapterId] = chapterHref.match(PATTERN_HREF_ID) || [];

          return {
            hash: Base.combineHash(this.id, mangaId, chapterId),
            mangaId,
            chapterId,
            href: `https://klmanga.net/${chapterHref}`,
            title: chapterTitle,
          };
        }
      );
      const latest = chapters[0].title || '';

      let cover = bg;
      if (bg !== '' && !bg.includes('http')) {
        cover = 'https://klmanga.net' + bg;
      }

      let status = MangaStatus.Unknown;
      if (statusList.includes('Incomplete')) {
        status = MangaStatus.Serial;
      } else if (statusList.includes('Complete')) {
        status = MangaStatus.End;
      }

      return {
        manga: {
          href,
          hash: Base.combineHash(this.id, mangaId),
          source: this.id,
          sourceName: this.name,
          mangaId: mangaId,
          cover,
          title,
          latest,
          updateTime,
          author,
          tag: tag.flat(),
          status,
          chapters,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };

  handleChapterList: Base['handleChapterList'] = () => {
    return { error: new Error(ErrorMessage.NoSupport + 'handleChapterList') };
  };

  handleChapter: Base['handleChapter'] = (text: string | null, mangaId, chapterId) => {
    try {
      const $ = cheerio.load(text || '');

      const [, , name = '', title = ''] = (
        $('div.chapter-content-top li span[itemprop=name]').toArray() as cheerio.TagElement[]
      ).map((span) => span.children[0].data);
      const images = ($('div.chapter-content p img').toArray() as cheerio.TagElement[]).map(
        (img) => img.attribs['data-aload']
      );

      return {
        chapter: {
          hash: Base.combineHash(this.id, mangaId, chapterId),
          mangaId,
          chapterId,
          name,
          title,
          headers: this.defaultHeaders,
          images: images.map((uri) => ({ uri: uri.replaceAll('\n', '') })),
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        return { error };
      } else {
        return { error: new Error(ErrorMessage.Unknown) };
      }
    }
  };
}

export default new KL();
