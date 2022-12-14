import {
  all,
  put,
  take,
  fork,
  call,
  select,
  takeEvery,
  takeLatest,
  takeLeading,
  delay,
  race,
} from 'redux-saga/effects';
import {
  storageKey,
  fetchData,
  haveError,
  fixDictShape,
  getLatestRelease,
  ErrorMessage,
} from '~/utils';
import { nanoid, PayloadAction } from '@reduxjs/toolkit';
import { splitHash, PluginMap } from '~/plugins';
import { action } from './slice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {
  // app
  launch,
  launchCompletion,
  syncData,
  syncDataCompletion,
  clearCache,
  clearCacheCompletion,
  catchError,
  // release
  loadLatestRelease,
  loadLatestReleaseCompletion,
  // setting
  setMode,
  setDirection,
  syncSetting,
  // plugin
  setSource,
  disablePlugin,
  syncPlugin,
  // batch
  batchUpdate,
  startBatchUpdate,
  endBatchUpdate,
  inStack,
  outStack,
  cancelLoadManga,
  // search
  loadSearch,
  loadSearchCompletion,
  // discovery
  loadDiscovery,
  loadDiscoveryCompletion,
  // favorites
  addFavorites,
  removeFavorites,
  pushQueque,
  popQueue,
  syncFavorites,
  // manga
  loadManga,
  loadMangaCompletion,
  loadMangaInfo,
  loadMangaInfoCompletion,
  loadChapterList,
  loadChapterListCompletion,
  // chapter
  loadChapter,
  loadChapterCompletion,
  // dict
  viewChapter,
  viewPage,
  syncDict,
} = action;

function* initSaga() {
  yield put(launch());
}

function* launchSaga() {
  yield takeLatest(launch.type, function* () {
    yield put(syncData());
    yield take(syncDataCompletion.type);
    yield put(loadLatestRelease());

    yield put(launchCompletion({ error: undefined }));
  });
}
function* syncDataSaga() {
  yield takeLatest(syncData.type, function* () {
    try {
      const favoritesData: string | null = yield call(AsyncStorage.getItem, storageKey.favorites);
      const dictData: string | null = yield call(AsyncStorage.getItem, storageKey.dict);
      const pluginData: string | null = yield call(AsyncStorage.getItem, storageKey.plugin);
      const settingData: string | null = yield call(AsyncStorage.getItem, storageKey.setting);

      if (favoritesData) {
        const favorites: RootState['favorites'] = JSON.parse(favoritesData);
        yield put(
          syncFavorites(
            favorites.map((item) =>
              item.inQueue === undefined ? { ...item, inQueue: true } : item
            )
          )
        );
      }
      if (dictData) {
        const dict: RootState['dict'] = JSON.parse(dictData);
        yield put(syncDict(fixDictShape(dict)));
      }
      if (pluginData) {
        const pluginCache: RootState['plugin'] = JSON.parse(pluginData);
        const list: RootState['plugin']['list'] = [];

        PluginMap.forEach((item) => {
          const finded = pluginCache.list.find((obj) => obj.value === item.id);

          list.push({
            name: item.name,
            label: item.shortName,
            value: item.id,
            score: item.score,
            description: item.description,
            disabled: finded ? finded.disabled : true,
          });
        });
        yield put(
          syncPlugin({
            source: pluginCache.source,
            list,
          })
        );
      }
      if (settingData) {
        const setting: RootState['setting'] = JSON.parse(settingData);
        yield put(syncSetting(setting));
      }

      yield put(syncDataCompletion({ error: undefined }));
    } catch (error) {
      yield put(syncDataCompletion({ error: new Error(ErrorMessage.SyncFail) }));
    }
  });
}
function* storageDataSaga() {
  yield takeLatest(
    [
      setMode.type,
      setDirection.type,
      setSource.type,
      disablePlugin.type,
      viewChapter.type,
      viewPage.type,
      addFavorites.type,
      removeFavorites.type,
      pushQueque.type,
      popQueue.type,
      loadSearchCompletion.type,
      loadDiscoveryCompletion.type,
      loadMangaCompletion.type,
      loadChapterCompletion.type,
    ],
    function* () {
      yield delay(3000);
      const favorites = ((state: RootState) => state.favorites)(yield select());
      const dict = ((state: RootState) => state.dict)(yield select());
      const plugin = ((state: RootState) => state.plugin)(yield select());
      const setting = ((state: RootState) => state.setting)(yield select());

      const storeDict: RootState['dict'] = { manga: {}, chapter: dict.chapter };
      for (const hash in dict.manga) {
        if (favorites.findIndex((item) => item.mangaHash === hash) !== -1) {
          storeDict.manga[hash] = dict.manga[hash];
        }
      }

      yield call(AsyncStorage.setItem, storageKey.favorites, JSON.stringify(favorites));
      yield call(AsyncStorage.setItem, storageKey.dict, JSON.stringify(storeDict));
      yield call(AsyncStorage.setItem, storageKey.plugin, JSON.stringify(plugin));
      yield call(AsyncStorage.setItem, storageKey.setting, JSON.stringify(setting));
    }
  );
}
function* clearCacheSaga() {
  yield takeLatest([clearCache.type], function* () {
    yield call(AsyncStorage.clear);
    yield put(launch());
    yield put(clearCacheCompletion({}));
  });
}

function* loadLatestReleaseSaga() {
  yield takeLatest([loadLatestRelease.type], function* () {
    const { error: fetchError, data } = yield call(fetchData, {
      url: 'https://api.github.com/repos/youniaogu/MangaReader/releases',
    });
    const { error: DataError, release } = getLatestRelease(data);

    yield put(loadLatestReleaseCompletion({ error: fetchError || DataError, data: release }));
  });
}

function* batchUpdateSaga() {
  yield takeLeading([batchUpdate.type], function* () {
    const favorites = ((state: RootState) => state.favorites)(yield select());
    const fail = ((state: RootState) => state.batch.fail)(yield select());
    const batchList =
      fail.length > 0
        ? fail
        : favorites.filter((item) => item.inQueue).map((item) => item.mangaHash);
    const queue = [...batchList].map((hash) => ({ hash, retry: 0 }));

    const loadMangaEffect = function* ({ hash = '', retry = 0 }) {
      const [source] = splitHash(hash);
      const id = nanoid();
      const plugin = PluginMap.get(source);
      const dict = ((state: RootState) => state.dict)(yield select());

      yield put(inStack(hash));
      if (!plugin) {
        outStack({ isSuccess: false, isTrend: false, hash, isRetry: false });
        return;
      }
      yield put(loadManga({ mangaHash: hash, taskId: id }));

      const {
        payload: { error: fetchError, data },
      }: ActionParameters<typeof loadMangaCompletion> = yield take(
        ({ type, payload }: any) => type === loadMangaCompletion.type && payload.taskId === id
      );

      if (fetchError) {
        const [, seconds] = fetchError.message.match(/([0-9]+) ?s/) || [];
        const timeout = Math.min(Number(seconds), 60) * 1000;

        if (retry <= 3) {
          queue.push({ hash, retry: retry + 1 });
        }

        yield put(outStack({ isSuccess: false, isTrend: false, hash, isRetry: retry <= 3 }));
        yield delay(timeout || plugin.config.batchDelay);
      } else {
        const prev = dict.manga[hash]?.chapters || [];
        const curr = data?.chapters || [];

        yield put(
          outStack({
            isSuccess: true,
            isTrend: curr.length > prev.length,
            hash,
            isRetry: false,
          })
        );
      }
    };

    yield put(startBatchUpdate(batchList));
    while (true) {
      const head = queue.shift();

      if (!head) {
        break;
      }

      yield loadMangaEffect(head);
    }
    yield put(endBatchUpdate());
  });
}

function* loadDiscoverySaga() {
  yield takeLatest(
    loadDiscovery.type,
    function* ({ payload: { source } }: ActionParameters<typeof loadDiscovery>) {
      const plugin = PluginMap.get(source);
      const { page, isEnd, type, region, status, sort } = ((state: RootState) => state.discovery)(
        yield select()
      );

      if (!plugin) {
        yield put(loadDiscoveryCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }
      if (isEnd) {
        yield put(loadDiscoveryCompletion({ error: new Error(ErrorMessage.NoMore) }));
        return;
      }

      const { error: fetchError, data } = yield call(
        fetchData,
        plugin.prepareDiscoveryFetch(page, type, region, status, sort)
      );
      const { error: pluginError, discovery } = plugin.handleDiscovery(data);

      yield put(loadDiscoveryCompletion({ error: fetchError || pluginError, data: discovery }));
    }
  );
}

function* loadSearchSaga() {
  yield takeLatest(
    loadSearch.type,
    function* ({ payload: { keyword, source } }: ActionParameters<typeof loadSearch>) {
      const plugin = PluginMap.get(source);
      const { page, isEnd } = ((state: RootState) => state.search)(yield select());

      if (!plugin) {
        yield put(loadSearchCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }
      if (isEnd) {
        yield put(loadSearchCompletion({ error: new Error(ErrorMessage.NoMore) }));
        return;
      }

      const { error: fetchError, data } = yield call(
        fetchData,
        plugin.prepareSearchFetch(keyword, page)
      );
      const { error: pluginError, search } = plugin.handleSearch(data);

      yield put(loadSearchCompletion({ error: fetchError || pluginError, data: search }));
    }
  );
}

function* loadMangaSaga() {
  yield takeEvery(
    loadManga.type,
    function* ({ payload: { mangaHash, taskId } }: ActionParameters<typeof loadManga>) {
      function* loadMangaEffect() {
        yield put(loadMangaInfo({ mangaHash }));
        const {
          payload: { error: loadMangaInfoError, data: mangaInfo },
        }: ActionParameters<typeof loadMangaInfoCompletion> = yield take(
          loadMangaInfoCompletion.type
        );

        yield put(loadChapterList({ mangaHash, page: 1 }));
        const {
          payload: { error: loadChapterListError, data: chapterInfo },
        }: ActionParameters<typeof loadChapterListCompletion> = yield take(
          ({ type, payload }: any) => {
            return (
              type === loadChapterListCompletion.type &&
              payload.data.mangaHash === mangaHash &&
              payload.data.page === 1
            );
          }
        );

        if (loadMangaInfoError) {
          yield put(loadMangaCompletion({ error: loadMangaInfoError, taskId }));
          return;
        }
        if (loadChapterListError) {
          yield put(loadMangaCompletion({ error: loadChapterListError, taskId }));
          return;
        }

        yield put(
          loadMangaCompletion({
            data: {
              ...(mangaInfo as Manga),
              chapters: (mangaInfo as Manga).chapters.concat(
                (chapterInfo as { mangaHash: string; page: number; list: Manga['chapters'] }).list
              ),
            },
            taskId,
          })
        );
      }

      yield race({
        task: call(loadMangaEffect),
        cancel: take(cancelLoadManga.type),
      });
    }
  );
}

function* loadMangaInfoSaga() {
  yield takeEvery(
    loadMangaInfo.type,
    function* ({ payload: { mangaHash } }: ActionParameters<typeof loadMangaInfo>) {
      const [source, mangaId] = splitHash(mangaHash);
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(loadMangaInfoCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }

      const { error: fetchError, data } = yield call(
        fetchData,
        plugin.prepareMangaInfoFetch(mangaId)
      );
      const { error: pluginError, manga } = plugin.handleMangaInfo(data);

      yield put(loadMangaInfoCompletion({ error: fetchError || pluginError, data: manga }));
    }
  );
}

function* loadChapterListSaga() {
  yield takeEvery(
    loadChapterList.type,
    function* ({ payload: { mangaHash, page } }: ActionParameters<typeof loadChapterList>) {
      const [source, mangaId] = splitHash(mangaHash);
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(loadChapterListCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }

      const body = plugin.prepareChapterListFetch(mangaId, page);
      if (!body) {
        yield put(loadChapterListCompletion({ data: { mangaHash, page, list: [] } }));
        return;
      }

      const { error: fetchError, data } = yield call(fetchData, body);
      const { error: pluginError, chapterList = [], canLoadMore } = plugin.handleChapterList(data);

      if (pluginError || fetchError) {
        yield put(
          loadChapterListCompletion({
            error: pluginError || fetchError,
            data: { mangaHash, page, list: [] },
          })
        );
        return;
      }

      if (canLoadMore) {
        yield put(loadChapterList({ mangaHash, page: page + 1 }));
        const {
          payload: { error: loadMoreError, data: extraData },
        }: ActionParameters<typeof loadChapterListCompletion> = yield take(
          ({ type, payload }: any) => {
            return (
              type === loadChapterListCompletion.type &&
              payload.data.mangaHash === mangaHash &&
              payload.data.page === page + 1
            );
          }
        );

        if (!loadMoreError && extraData) {
          chapterList.unshift(...extraData.list);
        }
      }

      yield put(
        loadChapterListCompletion({
          error: fetchError || pluginError,
          data: { mangaHash, page, list: chapterList },
        })
      );
    }
  );
}

function* loadChapterSaga() {
  yield takeEvery(
    loadChapter.type,
    function* ({ payload: { chapterHash } }: ActionParameters<typeof loadChapter>) {
      const [source, mangaId, chapterId] = splitHash(chapterHash);
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(loadChapterCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }

      const { error: fetchError, data } = yield call(
        fetchData,
        plugin.prepareChapterFetch(mangaId, chapterId)
      );
      const { error: pluginError, chapter } = plugin.handleChapter(data);

      yield put(loadChapterCompletion({ error: fetchError || pluginError, data: chapter }));
    }
  );
}

function* catchErrorSaga() {
  yield takeEvery('*', function* ({ type, payload }: PayloadAction<any>) {
    if (
      !haveError(payload) ||
      loadMangaInfoCompletion.type === type ||
      loadChapterListCompletion.type === type ||
      payload.error.message === ErrorMessage.NoMore
    ) {
      return;
    }

    const error = payload.error;
    if (error.message === 'Aborted') {
      yield put(catchError(ErrorMessage.RequestTimeout));
    } else {
      yield put(catchError(error.message));
    }
  });
}

export default function* rootSaga() {
  yield all([
    fork(initSaga),

    fork(launchSaga),
    fork(syncDataSaga),
    fork(storageDataSaga),
    fork(clearCacheSaga),
    fork(loadLatestReleaseSaga),
    fork(batchUpdateSaga),
    fork(loadDiscoverySaga),
    fork(loadSearchSaga),
    fork(loadMangaSaga),
    fork(loadMangaInfoSaga),
    fork(loadChapterListSaga),
    fork(loadChapterSaga),

    fork(catchErrorSaga),
  ]);
}
