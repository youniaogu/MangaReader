import { createSlice, combineReducers, PayloadAction } from '@reduxjs/toolkit';
import { Plugin, defaultPlugin, defaultPluginList } from '~/plugins';
import { AsyncStatus } from '~/utils';

const initialState: RootState = {
  app: {
    launchStatus: AsyncStatus.Default,
    syncStatus: AsyncStatus.Default,
    clearStatus: AsyncStatus.Default,
  },
  plugin: {
    source: defaultPlugin,
    list: defaultPluginList,
  },
  batch: {
    loadStatus: AsyncStatus.Default,
    queue: [],
    success: [],
    fail: [],
  },
  search: { page: 1, isEnd: false, loadStatus: AsyncStatus.Default, list: [] },
  update: { page: 1, isEnd: false, loadStatus: AsyncStatus.Default, list: [] },
  favorites: [],
  manga: {
    loadStatus: AsyncStatus.Default,
  },
  chapter: {
    loadStatus: AsyncStatus.Default,
  },
  dict: {
    manga: {},
    chapter: {},
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState: initialState.app,
  reducers: {
    launch(state) {
      state.launchStatus = AsyncStatus.Pending;
    },
    launchCompletion(state, action: FetchResponseAction) {
      if (action.payload.error) {
        state.launchStatus = AsyncStatus.Rejected;
        return;
      }
      state.launchStatus = AsyncStatus.Fulfilled;
    },
    syncData(state) {
      state.syncStatus = AsyncStatus.Pending;
    },
    syncDataCompletion(state, action: FetchResponseAction): any {
      if (action.payload.error) {
        state.syncStatus = AsyncStatus.Rejected;
        return;
      }
      state.syncStatus = AsyncStatus.Fulfilled;
    },
    clearCache(state) {
      state.clearStatus = AsyncStatus.Pending;
    },
    clearCacheCompletion(state, action: FetchResponseAction) {
      if (action.payload.error) {
        state.clearStatus = AsyncStatus.Rejected;
        return;
      }
      state.clearStatus = AsyncStatus.Fulfilled;
    },
  },
});

const pluginSlice = createSlice({
  name: 'plugin',
  initialState: initialState.plugin,
  reducers: {
    setCurrent(state, action: PayloadAction<Plugin>) {
      state.source = action.payload;
    },
    syncPlugin(_state, action: PayloadAction<RootState['plugin']>) {
      return action.payload;
    },
  },
});

const batchSlice = createSlice({
  name: 'batch',
  initialState: initialState.batch,
  reducers: {
    batchUpdate(state, action: PayloadAction<string[]>) {
      state.loadStatus = AsyncStatus.Pending;
      state.queue = action.payload;
      state.success = [];
      state.fail = [];
    },
    batchUpdateCompletion(state) {
      state.loadStatus = AsyncStatus.Fulfilled;
    },
    batchRecord(
      state,
      action: PayloadAction<{ isSuccess: boolean; isTrend: boolean; hash: string }>
    ) {
      const { isSuccess, hash } = action.payload;
      state.queue = state.queue.filter((item) => item !== hash);
      if (isSuccess) {
        state.success.push(hash);
      } else {
        state.fail.push(hash);
      }
    },
  },
});

const searchSlice = createSlice({
  name: 'search',
  initialState: initialState.search,
  reducers: {
    loadSearch(
      state,
      action: PayloadAction<{ keyword: string; isReset?: boolean; source: Plugin }>
    ) {
      const { isReset = false } = action.payload;
      if (isReset) {
        state.page = 1;
        state.list = [];
        state.isEnd = false;
      }

      state.loadStatus = AsyncStatus.Pending;
    },
    loadSearchCompletion(state, action: FetchResponseAction<Manga[]>) {
      const { error, data = [] } = action.payload;
      if (error) {
        state.loadStatus = AsyncStatus.Rejected;
        return;
      }

      const list = Array.from(new Set(state.list.concat(data.map((item) => item.hash))));
      state.page += 1;
      state.loadStatus = AsyncStatus.Fulfilled;
      state.isEnd = list.length === state.list.length;
      state.list = list;
    },
  },
});

const updateSlice = createSlice({
  name: 'update',
  initialState: initialState.update,
  reducers: {
    loadUpdate(state, action: PayloadAction<{ isReset?: boolean; source: Plugin }>) {
      const isReset = action.payload.isReset || false;
      if (isReset) {
        state.page = 1;
        state.list = [];
        state.isEnd = false;
      }

      state.loadStatus = AsyncStatus.Pending;
    },
    loadUpdateCompletion(state, action: FetchResponseAction<Manga[]>) {
      const { error, data = [] } = action.payload;
      if (error) {
        state.loadStatus = AsyncStatus.Rejected;
        return;
      }

      const list = Array.from(new Set(state.list.concat(data.map((item) => item.hash))));
      state.page += 1;
      state.loadStatus = AsyncStatus.Fulfilled;
      state.isEnd = list.length === state.list.length;
      state.list = list;
    },
  },
  extraReducers: {
    [pluginSlice.actions.setCurrent.type]: (state) => {
      state.loadStatus = AsyncStatus.Default;
    },
  },
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: initialState.favorites,
  reducers: {
    addFavorites(state, action: PayloadAction<string>) {
      state.unshift({ mangaHash: action.payload, isTrend: false });
    },
    removeFavorites(state, action: PayloadAction<string>) {
      return state.filter((item) => item.mangaHash !== action.payload);
    },
    viewFavorites(state, action: PayloadAction<string>) {
      const stateAfterFiltered = state.filter((item) => item.mangaHash !== action.payload);
      stateAfterFiltered.unshift({ mangaHash: action.payload, isTrend: false });
      return stateAfterFiltered;
    },
    syncFavorites(_state, action: PayloadAction<RootState['favorites']>) {
      return action.payload;
    },
  },
  extraReducers: {
    [batchSlice.actions.batchRecord.type]: (
      state,
      action: PayloadAction<{ isSuccess: boolean; isTrend: boolean; hash: string }>
    ) => {
      const { isSuccess, isTrend, hash } = action.payload;
      if (isSuccess && isTrend) {
        const stateAfterFiltered = state.filter((item) => item.mangaHash !== hash);
        stateAfterFiltered.unshift({ mangaHash: hash, isTrend: true });
        return stateAfterFiltered;
      }
    },
  },
});

const mangaSlice = createSlice({
  name: 'manga',
  initialState: initialState.manga,
  reducers: {
    loadManga(state, _action: PayloadAction<{ mangaHash: string; taskId?: string }>) {
      state.loadStatus = AsyncStatus.Pending;
    },
    loadMangaCompletion(state, action: FetchResponseAction<Manga>) {
      const { error } = action.payload;
      if (error) {
        state.loadStatus = AsyncStatus.Rejected;
        return;
      }

      state.loadStatus = AsyncStatus.Fulfilled;
    },
    loadMangaInfo(_state, _action: PayloadAction<{ mangaHash: string }>) {},
    loadMangaInfoCompletion(_state, _action: FetchResponseAction<Manga>) {},
    loadChapterList(_state, _action: PayloadAction<{ mangaHash: string; page: number }>) {},
    loadChapterListCompletion(
      _state,
      _action: FetchResponseAction<{
        mangaHash: string;
        page: number;
        list: Manga['chapters'];
      }>
    ) {},
  },
});

const chapterSlice = createSlice({
  name: 'chapter',
  initialState: initialState.chapter,
  reducers: {
    loadChapter(state, _action: PayloadAction<{ chapterHash: string }>) {
      state.loadStatus = AsyncStatus.Pending;
    },
    loadChapterCompletion(state, action: FetchResponseAction<Chapter>) {
      const { error } = action.payload;
      if (error) {
        state.loadStatus = AsyncStatus.Rejected;
        return;
      }

      state.loadStatus = AsyncStatus.Fulfilled;
    },
  },
});

const dictSlice = createSlice({
  name: 'dict',
  initialState: initialState.dict,
  reducers: {
    syncDict(_state, action: PayloadAction<RootState['dict']>) {
      return action.payload;
    },
    viewChapter(state, action: PayloadAction<{ mangaHash: string; chapterHash: string }>) {
      const { mangaHash, chapterHash } = action.payload;
      const manga = state.manga[mangaHash];

      if (manga) {
        manga.lastWatchChapter = chapterHash;
      }
    },
    viewPage(state, action: PayloadAction<{ mangaHash: string; page: number }>) {
      const { mangaHash, page } = action.payload;
      const manga = state.manga[mangaHash];

      if (manga) {
        manga.lastWatchPage = page;
      }
    },
  },
  extraReducers: {
    [searchSlice.actions.loadSearchCompletion.type]: (
      state,
      action: FetchResponseAction<Manga[]>
    ) => {
      const { error, data } = action.payload;
      if (error) {
        return;
      }

      data.forEach((item) => {
        state.manga[item.hash] = { ...state.manga[item.hash], ...item };
      });
    },
    [updateSlice.actions.loadUpdateCompletion.type]: (
      state,
      action: FetchResponseAction<Manga[]>
    ) => {
      const { error, data } = action.payload;
      if (error) {
        return;
      }

      data.forEach((item) => {
        state.manga[item.hash] = { ...state.manga[item.hash], ...item };
      });
    },
    [mangaSlice.actions.loadMangaCompletion.type]: (state, action: FetchResponseAction<Manga>) => {
      const { error, data } = action.payload;
      if (error) {
        return;
      }

      state.manga[data.hash] = { ...state.manga[data.hash], ...data };
    },
    [chapterSlice.actions.loadChapterCompletion.type]: (
      state,
      action: FetchResponseAction<Chapter>
    ) => {
      const { error, data } = action.payload;
      if (error) {
        return;
      }

      state.chapter[data.hash] = { ...state.chapter[data.hash], ...data };
    },
  },
});

const appAction = appSlice.actions;
const pluginAction = pluginSlice.actions;
const batchAction = batchSlice.actions;
const searchAction = searchSlice.actions;
const updateAction = updateSlice.actions;
const favoritesAction = favoritesSlice.actions;
const mangaAction = mangaSlice.actions;
const chapterAction = chapterSlice.actions;
const dictAction = dictSlice.actions;

const appReducer = appSlice.reducer;
const pluginReducer = pluginSlice.reducer;
const batchReducer = batchSlice.reducer;
const searchReducer = searchSlice.reducer;
const updateReducer = updateSlice.reducer;
const favoritesReducer = favoritesSlice.reducer;
const mangaReducer = mangaSlice.reducer;
const chapterReducer = chapterSlice.reducer;
const dictReducer = dictSlice.reducer;

export const action = {
  ...appAction,
  ...pluginAction,
  ...batchAction,
  ...searchAction,
  ...updateAction,
  ...favoritesAction,
  ...mangaAction,
  ...chapterAction,
  ...dictAction,
};
export const reducer = combineReducers<RootState>({
  app: appReducer,
  plugin: pluginReducer,
  batch: batchReducer,
  search: searchReducer,
  update: updateReducer,
  favorites: favoritesReducer,
  manga: mangaReducer,
  chapter: chapterReducer,
  dict: dictReducer,
});
