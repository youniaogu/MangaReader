import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import copy from '../src/plugins/copy';
import { Options } from '../src/plugins/base';
import { AESDecrypt } from '../src/utils';

jest.mock('../src/utils', () => ({
  AESDecrypt: jest.fn(() => '[]'),
  MangaStatus: { Unknown: 0, Serial: 1, End: 2 },
  ErrorMessage: { WrongResponse: 'Unexpected response: ' },
  clearAllCookie: jest.fn(),
}));

describe('CopyManga website responses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads raw HTML data before the website renders any comic cards', () => {
    const html = `<div class="exemptComic-box" total="1"
      list="[{'path_word':'example','name':'Reader\\'s &amp; 漫画',
      'cover':'https://example.com/cover.jpg','author':[{'name':'作者'}]}]"></div>`;
    expect(copy.handleDiscovery(html).discovery).toEqual([
      expect.objectContaining({
        mangaId: 'example',
        title: "Reader's & 漫画",
        bookCover: 'https://example.com/cover.jpg',
        author: ['作者'],
      }),
    ]);
  });

  it('distinguishes valid empty results from an unexpected or executable response', () => {
    expect(copy.handleDiscovery('<div class="exemptComic-box" list="[]"></div>').discovery).toEqual(
      []
    );
    expect(() => copy.handleDiscovery('<html>Verify your browser</html>')).toThrow();
    expect(() =>
      copy.handleDiscovery('<div class="exemptComic-box" list="alert(1)"></div>')
    ).toThrow();
  });

  it('preserves filter values and uses the website pagination size', () => {
    expect(
      copy.prepareDiscoveryFetch(2, { type: 'aiqing', region: 'japan', sort: 'popular' })
    ).toMatchObject({
      url: 'https://www.mangacopy.com/comics',
      body: { theme: 'aiqing', region: '0', ordering: 'popular', offset: 50, limit: 50 },
    });
    expect(
      copy.prepareDiscoveryFetch(1, {
        type: Options.Default,
        region: 'finish',
        sort: Options.Default,
      })
    ).toMatchObject({ body: { status: '1', ordering: '-datetime_updated' } });
  });

  it('uses the current website search API and parses its JSON response', () => {
    expect(copy.prepareSearchFetch('漫画', 2, {})).toMatchObject({
      url: 'https://www.mangacopy.com/api/kb/web/searchcl/comics',
      body: { q: '漫画', platform: 2, limit: 12, offset: 12 },
    });
    expect(
      copy.handleSearch({
        code: 200,
        results: {
          list: [{ path_word: 'example', name: '漫画', cover: 'https://example.com/cover.jpg' }],
        },
      }).search?.[0]
    ).toMatchObject({ mangaId: 'example', title: '漫画', author: [] });
    expect(() => copy.handleSearch({ code: 403, message: 'Forbidden' })).toThrow('Forbidden');
  });

  it.each(['ccx', 'ccz'])('recognizes %s and forwards the chapter request token', (keyName) => {
    copy.handleMangaInfo(
      `<script>var ${keyName} = "example-key";</script>
      <input id="dnt" value="3">`,
      'example'
    );
    expect(copy.key).toBe('example-key');
    const request = copy.prepareChapterListFetch('example', 1);
    expect(request && request.headers?.get('dnts')).toBe('3');
    copy.handleMangaInfo('<script>var ccz = "example-key";</script>', 'example');
    const nextRequest = copy.prepareChapterListFetch('example', 1);
    expect(nextRequest && nextRequest.headers?.has('dnts')).toBe(false);
  });

  it.each(['ccy', 'cct'])('recognizes %s and the inline image data', (keyName) => {
    copy.handleChapter(
      `<script>var ${keyName} = 'example-key';
      var contentKey = 'encrypted-images';</script>`,
      'example',
      'chapter',
      1
    );
    expect(AESDecrypt).toHaveBeenCalledWith('encrypted-images', 'example-key');
  });
});
