import { AsyncStatus, MangaStatus, ReaderMode, ReaderDirection, Sequence } from '~/utils';
import { createSlice, combineReducers, PayloadAction } from '@reduxjs/toolkit';
import { Plugin, defaultPlugin, defaultPluginList } from '~/plugins';

export const initialState: RootState = {
  app: {
    launchStatus: AsyncStatus.Default,
    message: [],
  },
  datasync: {
    syncStatus: AsyncStatus.Default,
    clearStatus: AsyncStatus.Default,
    backupStatus: AsyncStatus.Default,
    restoreStatus: AsyncStatus.Default,
  },
  release: {
    loadStatus: AsyncStatus.Default,
    name: process.env.NAME,
    version: process.env.VERSION,
    publishTime: process.env.PUBLISH_TIME,
  },
  setting: {
    mode: ReaderMode.Horizontal,
    direction: ReaderDirection.Right,
    sequence: Sequence.Desc,
    firstPrehandle: true,
  },
  plugin: {
    source: defaultPlugin,
    list: defaultPluginList,
  },
  batch: {
    loadStatus: AsyncStatus.Default,
    stack: [],
    queue: [],
    success: [],
    fail: [],
  },
  search: {
    filter: {},
    keyword: '',
    page: 1,
    isEnd: false,
    loadStatus: AsyncStatus.Default,
    list: [],
  },
  discovery: {
    filter: {},
    page: 1,
    isEnd: false,
    loadStatus: AsyncStatus.Default,
    list: [],
  },
  favorites: [],
  manga: {
    loadStatus: AsyncStatus.Default,
  },
  chapter: {
    loadStatus: AsyncStatus.Default,
    openDrawer: false,
    showDrawer: false,
    prehandleLog: [],
  },
  dict: {
    manga: {},
    chapter: {},
  },
};
const defaultIncreaseManga = {
  latest: '',
  updateTime: '',
  author: [],
  tag: [],
  status: MangaStatus.Unknown,
  chapters: [],
  history: {},
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
    toastMessage(state, action: PayloadAction<string>) {
      state.message.unshift(action.payload);
    },
    catchError(state, action: PayloadAction<string>) {
      state.message.unshift(action.payload);
    },
    throwMessage(state) {
      state.message = [];
    },
  },
});

const datasyncSlice = createSlice({
  name: 'datasync',
  initialState: initialState.datasync,
  reducers: {
    syncData(state) {
      state.syncStatus = AsyncStatus.Pending;
    },
    syncDataCompletion(state, action: FetchResponseAction) {
      if (action.payload.error) {
        state.syncStatus = AsyncStatus.Rejected;
        return;
      }
      state.syncStatus = AsyncStatus.Fulfilled;
    },
    backupToClipboard(state) {
      state.backupStatus = AsyncStatus.Pending;
    },
    backupToClipboardCompletion(state, action: FetchResponseAction) {
      if (action.payload.error) {
        state.syncStatus = AsyncStatus.Rejected;
        return;
      }
      state.syncStatus = AsyncStatus.Fulfilled;
    },
    restore(state, _action: PayloadAction<string>) {
      state.restoreStatus = AsyncStatus.Pending;
    },
    restoreCompletion(state, action: FetchResponseAction) {
      if (action.payload.error) {
        state.restoreStatus = AsyncStatus.Rejected;
        return;
      }
      state.restoreStatus = AsyncStatus.Fulfilled;
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

const releaseSlice = createSlice({
  name: 'release',
  initialState: initialState.release,
  reducers: {
    loadLatestRelease(state) {
      state.loadStatus = AsyncStatus.Pending;
      state.latest = undefined;
    },
    loadLatestReleaseCompletion(state, action: FetchResponseAction<LatestRelease>) {
      const { error, data } = action.payload;

      if (error) {
        state.loadStatus = AsyncStatus.Rejected;
        return;
      }

      state.loadStatus = AsyncStatus.Fulfilled;
      state.latest = data;
    },
  },
});

const settingSlice = createSlice({
  name: 'setting',
  initialState: initialState.setting,
  reducers: {
    setMode(state, action: PayloadAction<ReaderMode>) {
      state.mode = action.payload;
    },
    setDirection(state, action: PayloadAction<ReaderDirection>) {
      state.direction = action.payload;
    },
    setSequence(state, action: PayloadAction<Sequence>) {
      state.sequence = action.payload;
    },
    syncSetting(_state, action: PayloadAction<RootState['setting']>) {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(datasyncAction.clearCache, () => {
        return initialState.setting;
      })
      .addCase(chapterAction.addPrehandleLog, (state) => {
        state.firstPrehandle = false;
      });
  },
});

const pluginSlice = createSlice({
  name: 'plugin',
  initialState: initialState.plugin,
  reducers: {
    setSource(state, action: PayloadAction<Plugin>) {
      state.source = action.payload;
    },
    disablePlugin(state, action: PayloadAction<Plugin>) {
      const index = state.list.findIndex((item) => item.value === action.payload);

      if (index !== -1) {
        state.list[index].disabled = !state.list[index].disabled;
      }
    },
    syncPlugin(_state, action: PayloadAction<RootState['plugin']>) {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(datasyncAction.clearCache, () => {
      return initialState.plugin;
    });
  },
});

const batchSlice = createSlice({
  name: 'batch',
  initialState: initialState.batch,
  reducers: {
    batchUpdate(_state, _action: PayloadAction<string[] | undefined>) {},
    startBatchUpdate(state, action: PayloadAction<string[]>) {
      state.loadStatus = AsyncStatus.Pending;
      state.queue = action.payload;
      state.success = [];
      state.fail = [];
    },
    endBatchUpdate(state) {
      state.loadStatus = AsyncStatus.Fulfilled;
    },
    inStack(state, action: PayloadAction<string>) {
      state.stack.push(action.payload);
      state.queue = state.queue.filter((item) => item !== action.payload);
    },
    outStack(
      state,
      action: PayloadAction<{
        isSuccess: boolean;
        isTrend: boolean;
        hash: string;
        isRetry: boolean;
      }>
    ) {
      const { isSuccess, hash, isRetry } = action.payload;
      state.stack = state.stack.filter((item) => item !== hash);
      if (isSuccess) {
        state.success.push(hash);
      } else {
        isRetry ? state.queue.push(hash) : state.fail.push(hash);
      }
    },
    cancelLoadManga() {},
  },
});

const searchSlice = createSlice({
  name: 'search',
  initialState: initialState.search,
  reducers: {
    setSearchFilter(state, action: PayloadAction<Record<string, string>>) {
      state.filter = {
        ...state.filter,
        ...action.payload,
      };
    },
    resetSearchFilter(state) {
      state.filter = {};
    },
    loadSearch(
      state,
      action: PayloadAction<{ keyword: string; isReset?: boolean; source: Plugin }>
    ) {
      const { keyword, isReset = false } = action.payload;
      if (isReset) {
        state.page = 1;
        state.list = [];
        state.isEnd = false;
      }

      state.keyword = keyword;
      state.loadStatus = AsyncStatus.Pending;
    },
    loadSearchCompletion(state, action: FetchResponseAction<IncreaseManga[]>) {
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

const discoverySlice = createSlice({
  name: 'discovery',
  initialState: initialState.discovery,
  reducers: {
    setDiscoveryFilter(state, action: PayloadAction<Record<string, string>>) {
      state.filter = {
        ...state.filter,
        ...action.payload,
      };
    },
    loadDiscovery(state, action: PayloadAction<{ isReset?: boolean; source: Plugin }>) {
      const isReset = action.payload.isReset || false;
      if (isReset) {
        state.page = 1;
        state.list = [];
        state.isEnd = false;
      }

      state.loadStatus = AsyncStatus.Pending;
    },
    loadDiscoveryCompletion(state, action: FetchResponseAction<IncreaseManga[]>) {
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
  extraReducers: (builder) => {
    builder.addCase(pluginAction.setSource, (state) => {
      state.filter = {};
      state.loadStatus = AsyncStatus.Default;
    });
  },
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: initialState.favorites,
  reducers: {
    addFavorites(state, action: PayloadAction<string>) {
      state.unshift({ mangaHash: action.payload, isTrend: false, inQueue: true });
    },
    removeFavorites(state, action: PayloadAction<string>) {
      return state.filter((item) => item.mangaHash !== action.payload);
    },
    pushQueque(state, action: PayloadAction<string>) {
      return state.map((item) => {
        if (item.mangaHash === action.payload) {
          return {
            ...item,
            inQueue: true,
          };
        }
        return item;
      });
    },
    popQueue(state, action: PayloadAction<string>) {
      return state.map((item) => {
        if (item.mangaHash === action.payload) {
          return {
            ...item,
            inQueue: false,
          };
        }
        return item;
      });
    },
    viewFavorites(state, action: PayloadAction<string>) {
      return state.reduce<RootState['favorites']>((dict, item) => {
        if (item.mangaHash === action.payload) {
          return [{ ...item, isTrend: false }, ...dict];
        }
        return [...dict, item];
      }, []);
    },
    syncFavorites(_state, action: PayloadAction<RootState['favorites']>) {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(batchAction.outStack, (state, action) => {
        const { isSuccess, isTrend, hash } = action.payload;
        if (isSuccess && isTrend) {
          return state.reduce<RootState['favorites']>((dict, item) => {
            if (item.mangaHash === hash) {
              return [{ ...item, isTrend: true }, ...dict];
            }
            return [...dict, item];
          }, []);
        }
      })
      .addCase(datasyncAction.clearCache, () => {
        return initialState.favorites;
      });
  },
});

const mangaSlice = createSlice({
  name: 'manga',
  initialState: initialState.manga,
  reducers: {
    loadManga(state, _action: PayloadAction<{ mangaHash: string; taskId?: string }>) {
      state.loadStatus = AsyncStatus.Pending;
    },
    loadMangaCompletion(state, action: FetchResponseAction<IncreaseManga>) {
      const { error } = action.payload;
      if (error) {
        state.loadStatus = AsyncStatus.Rejected;
        return;
      }

      state.loadStatus = AsyncStatus.Fulfilled;
    },
    loadMangaInfo(_state, _action: PayloadAction<{ mangaHash: string }>) {},
    loadMangaInfoCompletion(_state, _action: FetchResponseAction<IncreaseManga>) {},
    loadChapterList(_state, _action: PayloadAction<{ mangaHash: string; page: number }>) {},
    loadChapterListCompletion(
      _state,
      _action: FetchResponseAction<{ mangaHash: string; page: number; list: Manga['chapters'] }>
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
    prehandleChapter(
      _state,
      _action: PayloadAction<{ mangaHash: string; chapterHash: string; save?: boolean }>
    ) {},
    prehandleChapterCompletion(_state, _action: FetchResponseAction) {},
    setPrehandleLogStatus(state, action: PayloadAction<boolean>) {
      state.openDrawer = action.payload && state.showDrawer;
    },
    setPrehandleLogVisible(state, action: PayloadAction<boolean>) {
      state.showDrawer = action.payload;
    },
    addPrehandleLog(
      state,
      action: PayloadAction<{ id: string; text: string; status: AsyncStatus }[]>
    ) {
      state.prehandleLog = action.payload.concat(state.prehandleLog);
    },
    updatePrehandleLog(
      state,
      action: PayloadAction<{ id: string; text: string; status: AsyncStatus }>
    ) {
      state.prehandleLog = state.prehandleLog
        .map((item) => {
          if (item.id !== action.payload.id) {
            return item;
          }

          return {
            ...item,
            ...action.payload,
          };
        })
        .filter((item) => item.status !== AsyncStatus.Fulfilled);
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
    viewImage(
      state,
      action: PayloadAction<{
        mangaHash: string;
        chapterHash: string;
        index: number;
        isPrefetch?: boolean;
      }>
    ) {
      const { mangaHash, chapterHash, index, isPrefetch = false } = action.payload;
      const manga = state.manga[mangaHash];
      const chapter = state.chapter[chapterHash];

      if (manga && chapter) {
        if (!manga.history[chapterHash]) {
          manga.history[chapterHash] = {
            total: 0,
            progress: 0,
            imagesLoaded: [],
            isVisited: false,
          };
        }

        const imagesLoaded = Array.from(
          new Set([...manga.history[chapterHash].imagesLoaded, index])
        );

        manga.history[chapterHash] = {
          ...manga.history[chapterHash],
          total: chapter.images.length,
          progress: Math.max(
            manga.history[chapterHash].progress,
            Math.floor((imagesLoaded.length * 100) / chapter.images.length)
          ),
          imagesLoaded,
          isVisited: !isPrefetch ? true : manga.history[chapterHash].isVisited,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchAction.loadSearchCompletion, (state, action) => {
        const { error, data } = action.payload;
        if (error) {
          return;
        }

        data.forEach((item) => {
          state.manga[item.hash] = {
            ...defaultIncreaseManga,
            ...state.manga[item.hash],
            ...item,
          };
        });
      })
      .addCase(discoveryAction.loadDiscoveryCompletion, (state, action) => {
        const { error, data } = action.payload;
        if (error) {
          return;
        }

        data.forEach((item) => {
          state.manga[item.hash] = {
            ...defaultIncreaseManga,
            ...state.manga[item.hash],
            ...item,
          };
        });
      })
      .addCase(mangaAction.loadMangaCompletion, (state, action) => {
        const { error, data } = action.payload;
        if (error) {
          return;
        }

        state.manga[data.hash] = {
          ...defaultIncreaseManga,
          ...state.manga[data.hash],
          ...data,
        };
      })
      .addCase(chapterAction.loadChapterCompletion, (state, action) => {
        const { error, data } = action.payload;
        if (error) {
          return;
        }

        state.chapter[data.hash] = { ...state.chapter[data.hash], ...data };
      })
      .addCase(datasyncAction.clearCache, () => {
        return initialState.dict;
      });
  },
});

const appAction = appSlice.actions;
const datasyncAction = datasyncSlice.actions;
const releaseAction = releaseSlice.actions;
const settingAction = settingSlice.actions;
const pluginAction = pluginSlice.actions;
const batchAction = batchSlice.actions;
const searchAction = searchSlice.actions;
const discoveryAction = discoverySlice.actions;
const favoritesAction = favoritesSlice.actions;
const mangaAction = mangaSlice.actions;
const chapterAction = chapterSlice.actions;
const dictAction = dictSlice.actions;

const appReducer = appSlice.reducer;
const datasyncReducer = datasyncSlice.reducer;
const releaseReducer = releaseSlice.reducer;
const settingReducer = settingSlice.reducer;
const pluginReducer = pluginSlice.reducer;
const batchReducer = batchSlice.reducer;
const searchReducer = searchSlice.reducer;
const discoveryReducer = discoverySlice.reducer;
const favoritesReducer = favoritesSlice.reducer;
const mangaReducer = mangaSlice.reducer;
const chapterReducer = chapterSlice.reducer;
const dictReducer = dictSlice.reducer;

export const action = {
  ...appAction,
  ...datasyncAction,
  ...releaseAction,
  ...settingAction,
  ...pluginAction,
  ...batchAction,
  ...searchAction,
  ...discoveryAction,
  ...favoritesAction,
  ...mangaAction,
  ...chapterAction,
  ...dictAction,
};
export const reducer = combineReducers<RootState>({
  app: appReducer,
  datasync: datasyncReducer,
  release: releaseReducer,
  setting: settingReducer,
  plugin: pluginReducer,
  batch: batchReducer,
  search: searchReducer,
  discovery: discoveryReducer,
  favorites: favoritesReducer,
  manga: mangaReducer,
  chapter: chapterReducer,
  dict: dictReducer,
});
