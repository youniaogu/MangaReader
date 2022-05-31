import { createSlice, combineReducers, PayloadAction } from '@reduxjs/toolkit';
import { Plugin } from '~/plugins';

const { LoadStatus } = window;

const initialState: RootState = {
  app: {
    launchStatus: LoadStatus.Default,
    syncStatus: LoadStatus.Default,
    clearStatus: LoadStatus.Default,
  },
  search: { keyword: '', page: 1, isEnd: false, loadStatus: LoadStatus.Default, list: [] },
  update: { page: 1, isEnd: false, loadStatus: LoadStatus.Default, list: [] },
  favorites: [],
  manga: {
    loadStatus: LoadStatus.Default,
  },
  chapter: {
    loadStatus: LoadStatus.Default,
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
      state.launchStatus = LoadStatus.Pending;
    },
    launchCompletion(state, action: FetchResponseAction) {
      if (action.payload.error) {
        state.launchStatus = LoadStatus.Rejected;
        return;
      }

      state.launchStatus = LoadStatus.Fulfilled;
    },
    syncData(state) {
      state.syncStatus = LoadStatus.Pending;
    },
    syncDataCompletion(state, action: FetchResponseAction): any {
      if (action.payload.error) {
        state.syncStatus = LoadStatus.Rejected;
        return;
      }

      state.syncStatus = LoadStatus.Fulfilled;
    },
    clearCache(state) {
      state.clearStatus = LoadStatus.Pending;
    },
    clearCacheCompletion(state, action: FetchResponseAction) {
      if (action.payload.error) {
        state.clearStatus = LoadStatus.Rejected;
        return;
      }

      state.clearStatus = LoadStatus.Fulfilled;
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
      const { keyword, isReset = false } = action.payload;
      if (isReset) {
        state.page = 1;
        state.list = [];
        state.isEnd = false;
      }

      state.keyword = keyword;
      state.loadStatus = LoadStatus.Pending;
    },
    loadSearchCompletion(state, action: FetchResponseAction<Manga[]>) {
      const { error, data = [] } = action.payload;
      if (error) {
        state.loadStatus = LoadStatus.Rejected;
        return;
      }

      state.page += 1;
      state.loadStatus = LoadStatus.Fulfilled;
      state.list = state.list.concat(data.map((item) => item.hash));
      state.isEnd = data.length < 20;
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

      state.loadStatus = LoadStatus.Pending;
    },
    loadUpdateCompletion(state, action: FetchResponseAction<Manga[]>) {
      const { error, data = [] } = action.payload;
      if (error) {
        state.loadStatus = LoadStatus.Rejected;
        return;
      }

      state.page += 1;
      state.loadStatus = LoadStatus.Fulfilled;
      state.list = state.list.concat(data.map((item) => item.hash));
      state.isEnd = data.length < 20;
    },
  },
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: initialState.favorites,
  reducers: {
    addFavorites(state, action: PayloadAction<string>) {
      state.unshift(action.payload);
    },
    removeFavorites(state, action: PayloadAction<string>) {
      return state.filter((item) => item !== action.payload);
    },
    viewFavorites(state, action: PayloadAction<string>) {
      const stateAfterFiltered = state.filter((item) => item !== action.payload);
      stateAfterFiltered.unshift(action.payload);
      return stateAfterFiltered;
    },
    syncFavorites(_state, action: PayloadAction<string[]>) {
      return action.payload;
    },
  },
});

const mangaSlice = createSlice({
  name: 'manga',
  initialState: initialState.manga,
  reducers: {
    loadManga(state, _action: PayloadAction<{ mangaHash: string }>) {
      state.loadStatus = LoadStatus.Pending;
    },
    loadMangaCompletion(state, action: FetchResponseAction<Manga>) {
      const { error } = action.payload;
      if (error) {
        state.loadStatus = LoadStatus.Rejected;
        return;
      }

      state.loadStatus = LoadStatus.Fulfilled;
    },
  },
});

const chapterSlice = createSlice({
  name: 'chapter',
  initialState: initialState.chapter,
  reducers: {
    loadChapter(state, _action: PayloadAction<{ chapterHash: string }>) {
      state.loadStatus = LoadStatus.Pending;
    },
    loadChapterCompletion(state, action: FetchResponseAction<Chapter>) {
      const { error } = action.payload;
      if (error) {
        state.loadStatus = LoadStatus.Rejected;
        return;
      }

      state.loadStatus = LoadStatus.Fulfilled;
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
const searchAction = searchSlice.actions;
const updateAction = updateSlice.actions;
const favoritesAction = favoritesSlice.actions;
const mangaAction = mangaSlice.actions;
const chapterAction = chapterSlice.actions;
const dictAction = dictSlice.actions;

const appReducer = appSlice.reducer;
const searchReducer = searchSlice.reducer;
const updateReducer = updateSlice.reducer;
const favoritesReducer = favoritesSlice.reducer;
const mangaReducer = mangaSlice.reducer;
const chapterReducer = chapterSlice.reducer;
const dictReducer = dictSlice.reducer;

export const action = {
  ...appAction,
  ...searchAction,
  ...updateAction,
  ...favoritesAction,
  ...mangaAction,
  ...chapterAction,
  ...dictAction,
};
export const reducer = combineReducers<RootState>({
  app: appReducer,
  search: searchReducer,
  update: updateReducer,
  favorites: favoritesReducer,
  manga: mangaReducer,
  chapter: chapterReducer,
  dict: dictReducer,
});
