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
  fixPluginShape,
  fixSettingShape,
  fixTaskShape,
  fixRestoreShape,
  getLatestRelease,
  dictToPairs,
  pairsToDict,
  trycatch,
  nonNullable,
  ErrorMessage,
  AsyncStatus,
  TaskType,
} from '~/utils';
import { nanoid, Action, PayloadAction } from '@reduxjs/toolkit';
import { Permission, PermissionsAndroid, Platform } from 'react-native';
import { splitHash, PluginMap } from '~/plugins';
import { CacheManager } from '@georstat/react-native-image-cache';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Dirs, FileSystem } from 'react-native-file-access';
import { action } from './slice';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Share from 'react-native-share';

const {
  // app
  launch,
  launchCompletion,
  toastMessage,
  // datasync
  syncData,
  syncDataCompletion,
  backup,
  backupCompletion,
  restore,
  restoreCompletion,
  clearCache,
  clearCacheCompletion,
  // release
  loadLatestRelease,
  loadLatestReleaseCompletion,
  // setting
  setMode,
  setLight,
  setDirection,
  setSequence,
  setAndroidDownloadPath,
  syncSetting,
  // plugin
  setSource,
  setExtra,
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
  enabledBatch,
  disabledBatch,
  viewFavorites,
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
  downloadChapter,
  exportChapter,
  saveImage,
  // task
  restartTask,
  retryTask,
  pushTask,
  removeTask,
  finishTask,
  startJob,
  endJob,
  finishJob,
  syncTask,
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
  yield takeLatestSuspense(launch.type, function* () {
    yield put(syncData());
    yield take(syncDataCompletion.type);
    yield put(restartTask());
    yield put(loadLatestRelease());

    yield put(launchCompletion({ error: undefined }));
  });
}

function* pluginSyncDataSaga() {
  yield takeLatestSuspense(
    setExtra.type,
    function* ({ payload: { source } }: ReturnType<typeof setExtra>) {
      const extra = ((state: RootState) => state.plugin.extra)(yield select());
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(toastMessage(ErrorMessage.PluginMissing));
        return;
      }

      const message = plugin.syncExtraData(extra);
      if (typeof message === 'string') {
        yield put(toastMessage(message));
      }
    }
  );
}

function* syncDataSaga() {
  yield takeLatestSuspense(syncData.type, function* () {
    try {
      const [
        [, mangaIndexData],
        [, chapterIndexData],
        [, taskIndexData],
        [, jobIndexData],
        [, favoritesData],
        [, pluginData],
        [, settingData],
        [, dictData],
      ]: KeyValuePair[] = yield call(AsyncStorage.multiGet, [
        storageKey.mangaIndex,
        storageKey.chapterIndex,
        storageKey.taskIndex,
        storageKey.jobIndex,
        storageKey.favorites,
        storageKey.plugin,
        storageKey.setting,
        storageKey.dict,
      ]);
      const task: RootState['task'] = { list: [], job: { max: 5, list: [], thread: [] } };

      if (!dictData) {
        const dict: RootState['dict'] = { manga: {}, chapter: {}, lastWatch: {}, record: {} };
        if (mangaIndexData) {
          const mangaIndex: string[] = JSON.parse(mangaIndexData);
          const mangaPairs: KeyValuePair[] = yield call(AsyncStorage.multiGet, mangaIndex);
          const mangaDict = pairsToDict(mangaPairs);
          for (const key in mangaDict) {
            dict.manga[key] = mangaDict[key].manga;
            dict.lastWatch[key] = mangaDict[key].lastWatch;
          }
        }
        if (chapterIndexData) {
          const chapterIndex: string[] = JSON.parse(chapterIndexData);
          const chapterPairs: KeyValuePair[] = yield call(AsyncStorage.multiGet, chapterIndex);
          const chapterDict = pairsToDict(chapterPairs);
          for (const key in chapterDict) {
            dict.chapter[key] = chapterDict[key].chapter;
            dict.record[key] = chapterDict[key].record;
          }
        }
        yield put(syncDict(fixDictShape(dict)));
      } else {
        const dict: RootState['dict'] = fixDictShape(JSON.parse(dictData));
        yield put(syncDict(dict));
        yield call(AsyncStorage.removeItem, storageKey.dict);
      }

      if (taskIndexData) {
        const taskIndex: string[] = JSON.parse(taskIndexData);
        const taskPairs: KeyValuePair[] = yield call(AsyncStorage.multiGet, taskIndex);
        const taskDict = pairsToDict(taskPairs);
        task.list = taskIndex.map((item) => taskDict[item]);
      }
      if (jobIndexData) {
        const jobIndex: string[] = JSON.parse(jobIndexData);
        const jobPairs: KeyValuePair[] = yield call(AsyncStorage.multiGet, jobIndex);
        const jobDict = pairsToDict(jobPairs);
        task.job.list = jobIndex.map((item) => jobDict[item]);
      }
      yield put(syncTask(fixTaskShape(task)));

      if (favoritesData) {
        const favorites: RootState['favorites'] = JSON.parse(favoritesData);
        yield put(
          syncFavorites(
            favorites.map((item) =>
              item.enableBatch === undefined ? { ...item, enableBatch: true } : item
            )
          )
        );
      }

      if (pluginData) {
        const plugin: RootState['plugin'] = fixPluginShape(JSON.parse(pluginData));
        const list: RootState['plugin']['list'] = [];

        PluginMap.forEach((item) => {
          const finded = plugin.list.find((obj) => obj.value === item.id);
          item.syncExtraData(plugin.extra);
          list.push({
            name: item.name,
            label: item.shortName,
            value: item.id,
            score: item.score,
            href: item.href,
            userAgent: item.userAgent,
            description: item.description,
            injectedJavaScript: item.injectedJavaScript,
            disabled: finded ? finded.disabled : true,
          });
        });
        yield put(syncPlugin({ ...plugin, list }));
      }
      if (settingData) {
        const setting: RootState['setting'] = fixSettingShape(JSON.parse(settingData));
        yield put(syncSetting(setting));
      }

      yield put(syncDataCompletion({ error: undefined }));
    } catch (error) {
      yield put(syncDataCompletion({ error: new Error(ErrorMessage.SyncFail) }));
    }
  });
}
function* backupSaga() {
  yield takeLeadingSuspense(backup.type, function* () {
    try {
      const data = ((state: RootState) => JSON.stringify(state))(yield select());
      const filename = 'MangaReader备份数据' + moment().format('YYYY-MM-DD');
      const path = `${Dirs.CacheDir}/${filename}.txt`;

      yield call(FileSystem.writeFile, path, data);
      yield call(Share.open, { filename, url: path, type: 'text/plain', showAppsToView: true });
      yield put(toastMessage('备份完成'));
      yield put(backupCompletion({ error: undefined }));
    } catch (error) {
      yield put(
        backupCompletion({
          error: new Error(
            '备份失败: ' + (error instanceof Error ? error.message : ErrorMessage.Unknown)
          ),
        })
      );
    }
  });
}
function* restoreSaga() {
  yield takeLatestSuspense(restore.type, function* () {
    try {
      const res: DocumentPickerResponse = yield call(DocumentPicker.pickSingle);
      const source: string = yield call(FileSystem.readFile, res.uri);
      const data = fixRestoreShape(JSON.parse(source));
      const favorites = ((state: RootState) => state.favorites)(yield select());
      const dict = ((state: RootState) => state.dict)(yield select());
      const newFavorites = data.favorites.filter(
        (hash) => favorites.findIndex((item) => item.mangaHash === hash) === -1
      );

      yield put(toastMessage('正在进行数据恢复'));
      yield put(
        syncFavorites([
          ...newFavorites.map((mangaHash) => ({ mangaHash, isTrend: false, enableBatch: true })),
          ...favorites,
        ])
      );
      yield put(syncDict({ ...dict, lastWatch: { ...dict.lastWatch, ...data.lastWatch } }));
      yield put(batchUpdate(newFavorites));
      yield take(endBatchUpdate.type);
      yield put(restoreCompletion({ error: undefined }));
      yield delay(0);
      yield put(toastMessage('恢复完成'));
    } catch (error) {
      yield put(
        restoreCompletion({
          error: new Error(
            '恢复失败: ' + (error instanceof Error ? error.message : ErrorMessage.Unknown)
          ),
        })
      );
    }
  });
}
function* storageDataSaga() {
  yield takeLatestSuspense(
    [
      clearCacheCompletion.type,
      restoreCompletion.type,
      setMode.type,
      setLight.type,
      setDirection.type,
      setSequence.type,
      setAndroidDownloadPath.type,
      setSource.type,
      setExtra.type,
      disablePlugin.type,
      viewChapter.type,
      viewPage.type,
      viewImage.type,
      viewFavorites.type,
      addFavorites.type,
      removeFavorites.type,
      enabledBatch.type,
      disabledBatch.type,
      loadSearchCompletion.type,
      loadDiscoveryCompletion.type,
      loadMangaCompletion.type,
      loadChapterCompletion.type,
      pushTask.type,
      removeTask.type,
      finishTask.type,
    ],
    function* () {
      const favorites = ((state: RootState) => state.favorites)(yield select());
      const dict = ((state: RootState) => state.dict)(yield select());
      const plugin = ((state: RootState) => state.plugin)(yield select());
      const setting = ((state: RootState) => state.setting)(yield select());
      const task = ((state: RootState) => state.task)(yield select());
      yield delay(1000);

      const mangaIndex: string[] = [];
      const chapterIndex: string[] = [];
      const taskIndex: string[] = [];
      const jobIndex: string[] = [];
      const mangaDict: Record<string, any> = {};
      const chapterDict: Record<string, any> = {};
      const taskDict: Record<string, any> = {};
      const jobDict: Record<string, any> = {};

      favorites.forEach(({ mangaHash }) => {
        const manga = dict.manga[mangaHash];
        const lastWatch = dict.lastWatch[mangaHash];
        if (nonNullable(manga) || nonNullable(lastWatch)) {
          mangaDict[mangaHash] = { manga, lastWatch };
          mangaIndex.push(mangaHash);
        }
        if (nonNullable(manga)) {
          manga.chapters.forEach(({ hash: chapterHash }) => {
            const chapter = dict.chapter[chapterHash];
            const record = dict.record[chapterHash];
            if (nonNullable(chapter) || nonNullable(record)) {
              chapterDict[chapterHash] = { chapter, record };
              chapterIndex.push(chapterHash);
            }
          });
        }
      });
      task.list.forEach((item) => {
        taskDict[item.taskId] = item;
        taskIndex.push(item.taskId);
      });
      task.job.list.forEach((item) => {
        jobDict[item.jobId] = item;
        jobIndex.push(item.jobId);
      });

      const keyValuePairs: [string, string][] = [
        ...dictToPairs(mangaDict),
        ...dictToPairs(chapterDict),
        ...dictToPairs(taskDict),
        ...dictToPairs(jobDict),
        [storageKey.mangaIndex, JSON.stringify(mangaIndex)],
        [storageKey.chapterIndex, JSON.stringify(chapterIndex)],
        [storageKey.taskIndex, JSON.stringify(taskIndex)],
        [storageKey.jobIndex, JSON.stringify(jobIndex)],
        [storageKey.favorites, JSON.stringify(favorites)],
        [storageKey.plugin, JSON.stringify(plugin)],
        [storageKey.setting, JSON.stringify(setting)],
      ];
      yield call(AsyncStorage.multiSet, keyValuePairs);

      const curr = keyValuePairs.map((item) => item[0]);
      const prev: string[] = yield call(AsyncStorage.getAllKeys);
      const useless = prev.filter((key) => !curr.includes(key));
      if (useless.length > 0) {
        yield call(AsyncStorage.multiRemove, useless);
      }
    }
  );
}
function* clearCacheSaga() {
  yield takeLatestSuspense(clearCache.type, function* () {
    yield call(AsyncStorage.clear);
    yield put(syncData());
    yield take(syncDataCompletion.type);
    yield put(clearCacheCompletion({}));
  });
}

function* loadLatestReleaseSaga() {
  yield takeLatestSuspense(loadLatestRelease.type, function* () {
    const { error: fetchError, data } = yield call(fetchData, {
      url: 'https://api.github.com/repos/youniaogu/MangaReader/releases',
    });
    const { error: DataError, release } = getLatestRelease(data);

    yield put(loadLatestReleaseCompletion({ error: fetchError || DataError, data: release }));
  });
}

function* batchUpdateSaga() {
  yield takeLeadingSuspense(
    batchUpdate.type,
    function* ({ payload: defaultList }: ReturnType<typeof batchUpdate>) {
      const favorites = ((state: RootState) => state.favorites)(yield select());
      const fail = ((state: RootState) => state.batch.fail)(yield select());
      const batchList =
        defaultList ||
        (fail.length > 0
          ? fail
          : favorites.filter((item) => item.enableBatch).map((item) => item.mangaHash));
      const queue = [...batchList].map((hash) => ({ hash, retry: 0 }));

      const loadMangaEffect = function* ({ hash = '', retry = 0 }) {
        const [source] = splitHash(hash);
        const actionId = nanoid();
        const plugin = PluginMap.get(source);
        const dict = ((state: RootState) => state.dict)(yield select());

        yield put(inStack(hash));
        if (!plugin) {
          outStack({ isSuccess: false, isTrend: false, hash, isRetry: false });
          return;
        }
        yield put(loadManga({ mangaHash: hash, actionId }));

        const {
          payload: { error: fetchError, data },
        }: ReturnType<typeof loadMangaCompletion> = yield take((takeAction: Action<string>) => {
          const { type, payload } = takeAction as ReturnType<typeof loadMangaCompletion>;
          return type === loadMangaCompletion.type && payload.actionId === actionId;
        });

        if (fetchError) {
          const [, seconds] = fetchError.message.match(/([0-9]+) ?s/) || [];
          const timeout = Math.min(Number(seconds), 60) * 1000;

          if (retry <= 3) {
            queue.push({ hash, retry: retry + 1 });
          }

          yield put(outStack({ isSuccess: false, isTrend: false, hash, isRetry: retry <= 3 }));
          yield delay(timeout || plugin.batchDelay);
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
  yield takeLatestSuspense(
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
      const { error: pluginError, discovery } = trycatch(
        () => plugin.handleDiscovery(data),
        '漫画数据解析错误：'
      );

      yield put(loadDiscoveryCompletion({ error: fetchError || pluginError, data: discovery }));
    }
  );
}

function* loadSearchSaga() {
  yield takeLatestSuspense(
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
      const { error: pluginError, search } = trycatch(
        () => plugin.handleSearch(data),
        '漫画数据解析错误：'
      );

      yield put(loadSearchCompletion({ error: fetchError || pluginError, data: search }));
    }
  );
}

function* loadMangaSaga() {
  yield takeEverySuspense(
    loadManga.type,
    function* ({ payload: { mangaHash, actionId } }: ReturnType<typeof loadManga>) {
      function* loadMangaEffect() {
        yield put(loadMangaInfo({ mangaHash, actionId }));
        const {
          payload: { error: loadMangaInfoError, data: mangaInfo },
        }: ReturnType<typeof loadMangaInfoCompletion> = yield take((takeAction: Action<string>) => {
          const { type, payload } = takeAction as ReturnType<typeof loadMangaInfoCompletion>;
          return type === loadMangaInfoCompletion.type && payload.actionId === actionId;
        });

        yield put(loadChapterList({ mangaHash, page: 1 }));
        const {
          payload: { error: loadChapterListError, data: chapterInfo },
        }: ReturnType<typeof loadChapterListCompletion> = yield take(
          (takeAction: Action<string>) => {
            const { type, payload } = takeAction as ReturnType<typeof loadChapterListCompletion>;
            return (
              type === loadChapterListCompletion.type &&
              payload.data !== undefined &&
              payload.data.mangaHash === mangaHash &&
              payload.data.page === 1
            );
          }
        );

        if (loadMangaInfoError) {
          yield put(loadMangaCompletion({ error: loadMangaInfoError, actionId }));
          return;
        }
        if (loadChapterListError) {
          yield put(loadMangaCompletion({ error: loadChapterListError, actionId }));
          return;
        }
        if (!nonNullable(mangaInfo) || !nonNullable(chapterInfo)) {
          yield put(
            loadMangaCompletion({ error: new Error(ErrorMessage.WrongDataType), actionId })
          );
          return;
        }

        yield put(
          loadMangaCompletion({
            data: {
              ...mangaInfo,
              chapters: (mangaInfo.chapters || []).concat(chapterInfo.list),
            },
            actionId,
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
  yield takeEverySuspense(
    loadMangaInfo.type,
    function* ({ payload: { mangaHash, actionId } }: ReturnType<typeof loadMangaInfo>) {
      const [source, mangaId] = splitHash(mangaHash);
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(
          loadMangaInfoCompletion({ error: new Error(ErrorMessage.PluginMissing), actionId })
        );
        return;
      }

      const { error: fetchError, data } = yield call(
        fetchData,
        plugin.prepareMangaInfoFetch(mangaId)
      );
      const { error: pluginError, manga } = trycatch(
        () => plugin.handleMangaInfo(data),
        '漫画详情解析错误：'
      );

      yield put(
        loadMangaInfoCompletion({ error: fetchError || pluginError, data: manga, actionId })
      );
    }
  );
}

function* loadChapterListSaga() {
  yield takeEverySuspense(
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
      const {
        error: pluginError,
        chapterList = [],
        canLoadMore,
      } = trycatch(() => plugin.handleChapterList(data, mangaId), '章节列表解析错误：');

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
            const { type, payload } = takeAction as ReturnType<typeof loadChapterListCompletion>;
            return (
              type === loadChapterListCompletion.type &&
              payload.data !== undefined &&
              payload.data.mangaHash === mangaHash &&
              payload.data.page === page + 1
            );
          }
        );

        if (!loadMoreError && extraData) {
          chapterList.push(...extraData.list);
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
  yield takeEverySuspense(
    loadChapter.type,
    function* ({ payload: { chapterHash } }: ReturnType<typeof loadChapter>) {
      const [source, mangaId, chapterId] = splitHash(chapterHash);
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(loadChapterCompletion({ error: new Error(ErrorMessage.PluginMissing) }));
        return;
      }

      let page = 1;
      let extra: Record<string, any> = {};
      let error: Error | undefined;
      let chapter: Chapter | undefined;
      while (true) {
        const { error: fetchError, data } = yield call(
          fetchData,
          plugin.prepareChapterFetch(mangaId, chapterId, page, extra)
        );
        const {
          error: pluginError,
          chapter: nextChapter,
          canLoadMore,
          nextPage = page + 1,
          nextExtra = extra,
        } = trycatch(
          () => plugin.handleChapter(data, mangaId, chapterId, page),
          '章节数据解析错误：'
        );

        if (fetchError || pluginError) {
          error = fetchError || pluginError;
          break;
        } else {
          chapter = {
            ...chapter,
            ...nextChapter,
            title: nextChapter.title || chapter?.title || '',
            images: [...(chapter?.images || []), ...nextChapter.images],
          };
        }
        if (!canLoadMore) {
          break;
        }
        extra = nextExtra;
        page = nextPage;
      }

      if (error) {
        yield put(loadChapterCompletion({ error }));
        return;
      }
      if (!chapter) {
        yield put(loadChapterCompletion({ error: new Error(ErrorMessage.MissingChapterInfo) }));
        return;
      }

      yield put(loadChapterCompletion({ error, data: chapter }));
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
  return status === 'granted';
}
function* fileDownload({ source, headers }: { source: string; headers?: Record<string, string> }) {
  yield call(CacheManager.prefetchBlob, source, { headers });
}
function* check(album?: string) {
  if (Platform.OS === 'android') {
    const writePermission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const hasWritePermission: boolean = yield call(hasAndroidPermission, writePermission);
    if (!hasWritePermission) {
      throw new Error(ErrorMessage.WithoutPermission);
    }

    if (album) {
      const androidDownloadPath = ((state: RootState) => state.setting.androidDownloadPath)(
        yield select()
      );
      const isExisted: boolean = yield call(FileSystem.exists, `${androidDownloadPath}/${album}`);
      if (!isExisted) {
        yield call(FileSystem.mkdir, `${androidDownloadPath}/${album}`);
      }
    }
  }
}
function* fileExport({
  source,
  album,
  filename,
}: {
  source: string;
  album: string;
  filename?: string;
}) {
  const androidDownloadPath = ((state: RootState) => state.setting.androidDownloadPath)(
    yield select()
  );
  const cacheEntry = CacheManager.get(source, undefined);
  const path: string = yield call(cacheEntry.getPath.bind(cacheEntry));

  if (Platform.OS === 'ios') {
    yield call(CameraRoll.save, `file://${path}`, { album });
  } else {
    const [, name, suffix] = path.match(/.*\/(.*)\.(.*)$/) || [];
    yield call(
      FileSystem.cp,
      `file://${path}`,
      `${androidDownloadPath}/${album}/${filename || name}.${suffix}`
    );
  }
}
function* thread() {
  while (true) {
    const queue = ((state: RootState) =>
      state.task.job.list.filter((item) => item.status === AsyncStatus.Default))(yield select());
    const job = queue.shift();

    if (!nonNullable(job)) {
      yield delay(100);
      yield put(finishJob());
      break;
    }

    const { taskId, jobId, chapterHash, type, source, album, headers, index } = job;
    yield put(startJob({ taskId, jobId }));
    try {
      const { timeout } = yield race({
        download: call(fileDownload, { source, headers }),
        timeout: delay(15000),
      });
      if (timeout) {
        throw new Error(ErrorMessage.Timeout);
      }

      yield put(viewImage({ chapterHash, index, isVisited: false }));
      if (type === TaskType.Export) {
        yield call(fileExport, { source, album, filename: String(index) });
      }
      yield put(endJob({ taskId, jobId, status: AsyncStatus.Fulfilled }));
    } catch (e) {
      yield put(endJob({ taskId, jobId, status: AsyncStatus.Rejected }));
    }
  }
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

  return currData;
}
function* pushChapterTask({
  chapterHash,
  taskType,
  actionId,
}: {
  chapterHash: string;
  taskType: TaskType;
  actionId: string;
}) {
  const chapter: Chapter | undefined = yield call(preloadChapter, chapterHash);
  if (!nonNullable(chapter)) {
    yield put(pushTask({ error: new Error(ErrorMessage.PushTaskFail), actionId }));
    return;
  }

  const { title, headers, images } = chapter;
  if (taskType === TaskType.Export) {
    yield call(check, title);
  }

  yield put(
    pushTask({
      actionId,
      data: {
        taskId: nanoid(),
        chapterHash,
        title,
        type: taskType,
        status: AsyncStatus.Default,
        headers,
        queue: images.map((item, index) => ({ index, jobId: nanoid(), source: item.uri })),
        pending: [],
        success: [],
        fail: [],
      },
    })
  );
}
function* downloadAndExportChapterSaga() {
  yield takeEverySuspense(
    [downloadChapter.type, exportChapter.type],
    function* ({
      type,
      payload: chapterHashList,
    }: ReturnType<typeof downloadChapter | typeof exportChapter>) {
      const { type: taskType, message } = {
        [downloadChapter.type]: { type: TaskType.Download, message: '下载中...' },
        [exportChapter.type]: { type: TaskType.Export, message: '导出中...' },
      }[type];
      yield put(toastMessage(message));

      while (true) {
        const actionId = nanoid();
        const chapterHash = chapterHashList.shift();
        if (!chapterHash) {
          break;
        }

        yield fork(pushChapterTask, { chapterHash, taskType, actionId });
        yield take((takeAction: Action<string>) => {
          const { type: takeActionType, payload } = takeAction as ReturnType<typeof pushTask>;
          return takeActionType === pushTask.type && payload.actionId === actionId;
        });
      }
    }
  );
}
function* saveImageSaga() {
  yield takeEverySuspense(
    saveImage.type,
    function* ({ payload: { source, headers } }: ReturnType<typeof saveImage>) {
      yield call(check);

      let path: string;
      if (/^data:image\/png;base64,.+/.test(source)) {
        path = CacheManager.config.baseDir + nanoid() + '.png';
        yield call(
          FileSystem.writeFile,
          path,
          source.replace('data:image/png;base64,', ''),
          'base64'
        );
      } else {
        yield call(fileDownload, { source, headers });
        const cacheEntry = CacheManager.get(source, undefined);
        path = yield call(cacheEntry.getPath.bind(cacheEntry));
      }

      // https://storage-b.picacomic.com/static/36ec684d-82e8-4c0d-b164-745ce93070e6.png
      // The operation couldn’t be completed. (PHPhotosErrorDomain error 3302.)
      yield call(CameraRoll.save, `file://${path}`);
      yield put(toastMessage('保存成功'));
    }
  );
}
function* taskManagerSaga() {
  yield takeLeadingSuspense([restartTask.type, pushTask.type, retryTask.type], function* () {
    while (true) {
      const max = ((state: RootState) => state.task.job.max)(yield select());
      const queue = ((state: RootState) =>
        state.task.job.list.filter((item) => item.status === AsyncStatus.Default))(yield select());

      if (queue.length <= 0) {
        break;
      }

      for (let i = 0; i < max; i++) {
        yield fork(thread);
        if (i < max - 1) {
          yield delay(0);
        }
      }
      for (let i = 0; i < max; i++) {
        yield take(finishJob.type);
      }
    }
    yield put(finishTask());
  });
}

function* catchErrorSaga() {
  yield takeEverySuspense('*', function* ({ type, payload }: PayloadAction<any>) {
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
      yield put(toastMessage(ErrorMessage.RequestTimeout));
    } else {
      yield put(toastMessage(error.message));
    }
  });
}

function* takeEverySuspense(pattern: string | string[], worker: (...args: any[]) => any) {
  yield takeEvery(pattern, tryCatchWorker(worker));
}
function* takeLatestSuspense(pattern: string | string[], worker: (...args: any[]) => any) {
  yield takeLatest(pattern, tryCatchWorker(worker));
}
function* takeLeadingSuspense(pattern: string | string[], worker: (...args: any[]) => any) {
  yield takeLeading(pattern, tryCatchWorker(worker));
}
function tryCatchWorker(fn: (...args: any[]) => any): (...args: any[]) => any {
  // https://www.typescriptlang.org/docs/handbook/2/functions.html#declaring-this-in-a-function
  return function* (this: any) {
    try {
      yield fn.apply(this, Array.from(arguments));
    } catch (error) {
      if (error instanceof Error) {
        yield put(toastMessage(error.message));
        return;
      }
      yield put(toastMessage(ErrorMessage.Unknown));
    }
  };
}

export default function* rootSaga() {
  // all effect look like promise.all
  // if fork effect throw any error, all effect with shut down
  // so catch any error to keep saga running
  yield all([
    fork(initSaga),

    fork(launchSaga),
    fork(pluginSyncDataSaga),
    fork(syncDataSaga),
    fork(backupSaga),
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
    fork(saveImageSaga),
    fork(downloadAndExportChapterSaga),
    fork(taskManagerSaga),

    fork(catchErrorSaga),
  ]);
}
