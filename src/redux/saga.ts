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
  fixSettingShape,
  getLatestRelease,
  matchRestoreShape,
  nonNullable,
  ErrorMessage,
  AsyncStatus,
} from '~/utils';
import { nanoid, Action, PayloadAction } from '@reduxjs/toolkit';
import { Permission, PermissionsAndroid, Platform } from 'react-native';
import { splitHash, PluginMap } from '~/plugins';
import { CacheManager } from '@georstat/react-native-image-cache';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { action } from './slice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LZString from 'lz-string';

const {
  // app
  launch,
  launchCompletion,
  toastMessage,
  catchError,
  // datasync
  syncData,
  syncDataCompletion,
  restore,
  restoreCompletion,
  clearCache,
  clearCacheCompletion,
  // release
  loadLatestRelease,
  loadLatestReleaseCompletion,
  // setting
  setMode,
  setDirection,
  setSequence,
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
  prehandleChapter,
  prehandleChapterCompletion,
  addPrehandleLog,
  updatePrehandleLog,
  setPrehandleLogStatus,
  // dict
  viewChapter,
  viewPage,
  viewImage,
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
            href: item.href,
            userAgent: item.userAgent,
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
        yield put(syncSetting(fixSettingShape(setting)));
      }

      yield put(syncDataCompletion({ error: undefined }));
    } catch (error) {
      yield put(syncDataCompletion({ error: new Error(ErrorMessage.SyncFail) }));
    }
  });
}
function* restoreSaga() {
  yield takeLatest(restore.type, function* ({ payload }: ReturnType<typeof restore>) {
    try {
      const favorites = ((state: RootState) => state.favorites)(yield select());
      const data = JSON.parse(LZString.decompressFromBase64(payload) || 'null');

      if (!matchRestoreShape(data)) {
        throw new Error(ErrorMessage.WrongDataType);
      }

      const newFavorites = data.favorites.filter(
        (hash) => favorites.findIndex((item) => item.mangaHash === hash) === -1
      );

      yield put(toastMessage('正在进行数据恢复'));
      yield put(
        syncFavorites([
          ...newFavorites.map((mangaHash) => ({ mangaHash, isTrend: false, inQueue: true })),
          ...favorites,
        ])
      );
      yield put(batchUpdate(newFavorites));
      yield take(endBatchUpdate.type);
      yield put(restoreCompletion({ error: undefined }));
      yield delay(0);
      yield put(toastMessage('数据恢复成功'));
    } catch (error) {
      yield put(toastMessage('数据恢复失败'));
      if (error instanceof Error) {
        yield put(restoreCompletion({ error }));
      } else {
        yield put(restoreCompletion({ error: new Error(ErrorMessage.Unknown) }));
      }
    }
  });
}
function* storageDataSaga() {
  yield takeLatest(
    [
      setMode.type,
      setDirection.type,
      setSequence.type,
      setSource.type,
      disablePlugin.type,
      viewChapter.type,
      viewPage.type,
      viewImage.type,
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
    yield put(syncData());
    yield take(syncDataCompletion.type);
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
  yield takeLeading(
    [batchUpdate.type],
    function* ({ payload: defaultList }: ReturnType<typeof batchUpdate>) {
      const favorites = ((state: RootState) => state.favorites)(yield select());
      const fail = ((state: RootState) => state.batch.fail)(yield select());
      const batchList =
        defaultList ||
        (fail.length > 0
          ? fail
          : favorites.filter((item) => item.inQueue).map((item) => item.mangaHash));
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
        }: ReturnType<typeof loadMangaCompletion> = yield take((takeAction: Action<string>) => {
          const { type, payload } = takeAction as Action<string> & {
            payload: ReturnType<typeof loadMangaCompletion>['payload'];
          };
          return type === loadMangaCompletion.type && payload.taskId === id;
        });

        if (fetchError) {
          const [, seconds] = fetchError.message.match(/([0-9]+) ?s/) || [];
          const timeout = Math.min(Number(seconds), 60) * 1000;

          if (retry <= 3) {
            queue.push({ hash, retry: retry + 1 });
          }

          yield put(outStack({ isSuccess: false, isTrend: false, hash, isRetry: retry <= 3 }));
          yield delay(timeout || plugin.config.batchDelay);
        } else {
          const prev = dict.manga[hash]?.chapters;
          const curr = data?.chapters;

          yield put(
            outStack({
              isSuccess: true,
              isTrend: nonNullable(prev) && nonNullable(curr) && curr.length > prev.length,
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
    }
  );
}

function* loadDiscoverySaga() {
  yield takeLatest(
    loadDiscovery.type,
    function* ({ payload: { source } }: ReturnType<typeof loadDiscovery>) {
      const plugin = PluginMap.get(source);
      const { page, isEnd, filter } = ((state: RootState) => state.discovery)(yield select());

      if (!plugin) {
        yield put(loadDiscoveryCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }
      if (isEnd) {
        yield put(loadDiscoveryCompletion({ error: new Error(ErrorMessage.NoMore) }));
        return;
      }

      const filterWithDefault = plugin.option.discovery.reduce<Record<string, string>>(
        (dict, item) => {
          dict[item.name] = dict[item.name] || item.defaultValue;
          return dict;
        },
        { ...filter }
      );

      const { error: fetchError, data } = yield call(
        fetchData,
        plugin.prepareDiscoveryFetch(page, filterWithDefault)
      );
      const { error: pluginError, discovery } = plugin.handleDiscovery(data);

      yield put(loadDiscoveryCompletion({ error: fetchError || pluginError, data: discovery }));
    }
  );
}

function* loadSearchSaga() {
  yield takeLatest(
    loadSearch.type,
    function* ({ payload: { keyword, source } }: ReturnType<typeof loadSearch>) {
      const plugin = PluginMap.get(source);
      const { page, isEnd, filter } = ((state: RootState) => state.search)(yield select());

      if (!plugin) {
        yield put(loadSearchCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }
      if (isEnd) {
        yield put(loadSearchCompletion({ error: new Error(ErrorMessage.NoMore) }));
        return;
      }

      const filterWithDefault = plugin.option.search.reduce<Record<string, string>>(
        (dict, item) => {
          dict[item.name] = dict[item.name] || item.defaultValue;
          return dict;
        },
        { ...filter }
      );

      const { error: fetchError, data } = yield call(
        fetchData,
        plugin.prepareSearchFetch(keyword, page, filterWithDefault)
      );
      const { error: pluginError, search } = plugin.handleSearch(data);

      yield put(loadSearchCompletion({ error: fetchError || pluginError, data: search }));
    }
  );
}

function* loadMangaSaga() {
  yield takeEvery(
    loadManga.type,
    function* ({ payload: { mangaHash, taskId } }: ReturnType<typeof loadManga>) {
      function* loadMangaEffect() {
        yield put(loadMangaInfo({ mangaHash }));
        const {
          payload: { error: loadMangaInfoError, data: mangaInfo },
        }: ReturnType<typeof loadMangaInfoCompletion> = yield take(loadMangaInfoCompletion.type);

        yield put(loadChapterList({ mangaHash, page: 1 }));
        const {
          payload: { error: loadChapterListError, data: chapterInfo },
        }: ReturnType<typeof loadChapterListCompletion> = yield take(
          (takeAction: Action<string>) => {
            const { type, payload } = takeAction as Action<string> & {
              payload: ReturnType<typeof loadChapterListCompletion>['payload'];
            };
            return (
              type === loadChapterListCompletion.type &&
              payload.data !== undefined &&
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
        if (!nonNullable(mangaInfo) || !nonNullable(chapterInfo)) {
          yield put(loadMangaCompletion({ error: new Error(ErrorMessage.WrongDataType), taskId }));
          return;
        }

        yield put(
          loadMangaCompletion({
            data: {
              ...mangaInfo,
              chapters: (mangaInfo.chapters || []).concat(chapterInfo.list),
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
    function* ({ payload: { mangaHash } }: ReturnType<typeof loadMangaInfo>) {
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
    function* ({ payload: { mangaHash, page } }: ReturnType<typeof loadChapterList>) {
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
        }: ReturnType<typeof loadChapterListCompletion> = yield take(
          (takeAction: Action<string>) => {
            const { type, payload } = takeAction as Action<string> & {
              payload: ReturnType<typeof loadChapterListCompletion>['payload'];
            };
            return (
              type === loadChapterListCompletion.type &&
              payload.data !== undefined &&
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
    function* ({ payload: { chapterHash } }: ReturnType<typeof loadChapter>) {
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
      const { error: pluginError, chapter } = plugin.handleChapter(data, mangaId, chapterId);

      yield put(loadChapterCompletion({ error: fetchError || pluginError, data: chapter }));
    }
  );
}

function* hasAndroidPermission(permission: Permission) {
  const hasPermission: boolean = yield call(PermissionsAndroid.check, permission);

  if (hasPermission) {
    return true;
  }

  const status: 'granted' | 'denied' | 'never_ask_again' = yield call(
    PermissionsAndroid.request,
    permission
  );
  console.log({ status, permission });
  return status === 'granted';
}
function* preloadChapter(chapterHash: string) {
  const prevDict = ((state: RootState) => state.dict.chapter)(yield select());
  const prevData = prevDict[chapterHash];

  if (!nonNullable(prevData)) {
    yield put(loadChapter({ chapterHash }));
    yield take(loadChapterCompletion.type);
  }
  const currDict = ((state: RootState) => state.dict.chapter)(yield select());
  const currData = currDict[chapterHash];

  if (!nonNullable(currData)) {
    return;
  }

  return currData;
}
function* prehandleChapterSaga() {
  yield takeEvery(
    prehandleChapter.type,
    function* ({
      payload: { mangaHash, chapterHash, save = false },
    }: ReturnType<typeof prehandleChapter>) {
      const chapter: Chapter | undefined = yield call(preloadChapter, chapterHash);

      if (Platform.OS === 'android' && save) {
        const readPermission =
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        const writePermission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
        const hasReadPermission: boolean = yield call(hasAndroidPermission, readPermission);
        const hasWritePermission: boolean = yield call(hasAndroidPermission, writePermission);
        if (!hasReadPermission || !hasWritePermission) {
          yield put(
            prehandleChapterCompletion({ error: new Error(ErrorMessage.WithoutPermission) })
          );
          return;
        }
      }
      if (!nonNullable(chapter)) {
        yield put(prehandleChapterCompletion({ error: new Error(ErrorMessage.WrongDataType) }));
        return;
      }

      const headers = chapter.headers;
      const album = chapter.title;
      const images = chapter.images.map((item) => item.uri);
      const firstPrehandle = ((state: RootState) => state.setting.firstPrehandle)(yield select());

      if (save && images.find((item) => item.includes('.webp'))) {
        yield put(prehandleChapterCompletion({ error: new Error(ErrorMessage.IOSNotSupportWebp) }));
        return;
      }

      yield put(
        addPrehandleLog(
          chapter.images.map((item, index) => ({
            id: item.uri,
            text: `${index + 1} - ${album}`,
            status: AsyncStatus.Default,
          }))
        )
      );
      yield put(toastMessage(`【${album}】${save ? '下载' : '预加载'}中`));
      if (firstPrehandle) {
        yield put(setPrehandleLogStatus(true));
      }

      const len = images.length;
      while (true) {
        const source = images.shift();
        const index = len - images.length;

        if (!nonNullable(source)) {
          break;
        }

        yield put(
          updatePrehandleLog({
            id: source,
            text: `${index} - ${album}`,
            status: AsyncStatus.Pending,
          })
        );
        yield call(CacheManager.prefetchBlob, source, { headers });
        if (save) {
          const cacheEntry = CacheManager.get(source, undefined);
          const path: string = yield call(cacheEntry.getPath.bind(cacheEntry));
          yield call(CameraRoll.save, `file://${path}`, { album });
        }
        yield put(viewImage({ mangaHash, chapterHash, index, isPrefetch: true }));
        yield put(
          updatePrehandleLog({
            id: source,
            text: `${index} - ${album}`,
            status: AsyncStatus.Fulfilled,
          })
        );
      }
      yield put(toastMessage(`【${album}】${save ? '下载' : '预加载'}完成`));
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
    fork(restoreSaga),
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
    fork(prehandleChapterSaga),

    fork(catchErrorSaga),
  ]);
}
