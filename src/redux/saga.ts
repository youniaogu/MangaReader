import {
  all,
  put,
  take,
  fork,
  call,
  select,
  takeLatest,
  takeEvery,
  delay,
} from 'redux-saga/effects';
import { splitHash, Plugin, PluginMap, defaultPlugin } from '~/plugins';
import { storageKey, fetchData } from '~/utils';
import { PayloadAction } from '@reduxjs/toolkit';
import { action } from './slice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {
  launch,
  launchCompletion,
  syncData,
  syncDataCompletion,
  syncFavorites,
  syncDict,
  syncPlugin,
  clearCache,
  clearCacheCompletion,
  viewChapter,
  viewPage,
  addFavorites,
  removeFavorites,
  loadSearch,
  loadSearchCompletion,
  loadUpdate,
  loadUpdateCompletion,
  loadManga,
  loadMangaCompletion,
  loadChapter,
  loadChapterCompletion,
} = action;

function* launchSaga() {
  yield takeLatest(launch.type, function* () {
    yield put(syncData());
    yield take(syncDataCompletion.type);

    yield put(launchCompletion({ error: undefined }));
  });
}
function* syncDataSaga() {
  yield takeLatest(syncData.type, function* () {
    try {
      const favoritesData: string | null = yield call(AsyncStorage.getItem, storageKey.favorites);
      const dictData: string | null = yield call(AsyncStorage.getItem, storageKey.dict);
      const pluginData: string | null = yield call(AsyncStorage.getItem, storageKey.plugin);

      let favorites: string[] = [];
      let dict: RootState['dict'] = { manga: {}, chapter: {} };
      let plugin: RootState['plugin'] = { list: [], source: defaultPlugin };
      if (favoritesData) {
        favorites = JSON.parse(favoritesData);
        yield put(syncFavorites(favorites));
      }
      if (dictData) {
        dict = JSON.parse(dictData);
        yield put(syncDict(dict));
      }
      if (pluginData) {
        const pluginCache: RootState['plugin'] = JSON.parse(pluginData);

        plugin.source = pluginCache.source;
        PluginMap.forEach((item) => {
          const finded = pluginCache.list.find((obj) => obj.value === item.id);

          plugin.list.push({
            name: item.name,
            label: item.shortName,
            value: item.id,
            disabled: finded ? finded.disabled : true,
          });
        });
        yield put(syncPlugin(plugin));
      }

      yield put(syncDataCompletion({ error: undefined }));
    } catch (e) {
      yield put(syncDataCompletion({ error: new Error('launch fail') }));
    }
  });
}
function* storageDataSaga() {
  yield takeLatest(
    [
      viewChapter.type,
      viewPage.type,
      addFavorites.type,
      removeFavorites.type,
      loadSearchCompletion.type,
      loadUpdateCompletion.type,
      loadMangaCompletion.type,
      loadChapterCompletion.type,
    ],
    function* () {
      yield delay(3000);
      const favorites = ((state: RootState) => state.favorites)(yield select());
      const dict = ((state: RootState) => state.dict)(yield select());
      const plugin = ((state: RootState) => state.plugin)(yield select());

      yield call(AsyncStorage.setItem, storageKey.favorites, JSON.stringify(favorites));
      yield call(AsyncStorage.setItem, storageKey.dict, JSON.stringify(dict));
      yield call(AsyncStorage.setItem, storageKey.plugin, JSON.stringify(plugin));
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

function* loadSearchSaga() {
  yield takeLatest(
    loadSearch.type,
    function* ({
      payload: { source },
    }: PayloadAction<{ keyword: string; isReset?: boolean; source: Plugin }>) {
      const plugin = PluginMap.get(source);
      const { keyword, page, isEnd } = ((state: RootState) => state.search)(yield select());

      if (!plugin) {
        yield put(loadSearchCompletion({ error: new Error('Need Plugin!') }));
        return;
      }
      if (isEnd) {
        yield put(loadSearchCompletion({ error: new Error('No More!') }));
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

function* loadUpdateSaga() {
  yield takeLatest(
    loadUpdate.type,
    function* ({
      payload: { source },
    }: PayloadAction<{ isReset: boolean | undefined; source: Plugin }>) {
      const plugin = PluginMap.get(source);
      const { page, isEnd } = ((state: RootState) => state.update)(yield select());

      if (!plugin) {
        yield put(loadUpdateCompletion({ error: new Error('Need Plugin!') }));
        return;
      }
      if (isEnd) {
        yield put(loadUpdateCompletion({ error: new Error('No More!') }));
        return;
      }

      const { error: fetchError, data } = yield call(fetchData, plugin.prepareUpdateFetch(page));
      const { error: pluginError, update } = plugin.handleUpdate(data);

      yield put(loadUpdateCompletion({ error: fetchError || pluginError, data: update }));
    }
  );
}

function* loadMangaSaga() {
  yield takeEvery(
    loadManga.type,
    function* ({ payload: { mangaHash } }: PayloadAction<{ mangaHash: string }>) {
      const [source, mangaId] = splitHash(mangaHash);
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(loadMangaCompletion({ error: new Error('Need Plugin!') }));
        return;
      }

      const { error: fetchError, data } = yield call(fetchData, plugin.prepareMangaFetch(mangaId));
      const { error: pluginError, manga } = plugin.handleManga(data);

      yield put(loadMangaCompletion({ error: fetchError || pluginError, data: manga }));
    }
  );
}

function* loadChapterSaga() {
  yield takeEvery(
    loadChapter.type,
    function* ({ payload: { chapterHash } }: PayloadAction<{ chapterHash: string }>) {
      const [source, mangaId, chapterId] = splitHash(chapterHash);
      const plugin = PluginMap.get(source);

      if (!plugin) {
        yield put(loadChapterCompletion({ error: new Error('Need Plugin!') }));
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

export default function* rootSaga() {
  yield all([
    fork(launchSaga),
    fork(syncDataSaga),
    fork(storageDataSaga),
    fork(clearCacheSaga),
    fork(loadSearchSaga),
    fork(loadUpdateSaga),
    fork(loadMangaSaga),
    fork(loadChapterSaga),
  ]);
}
