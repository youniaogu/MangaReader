import { createSlice, combineReducers, PayloadAction } from '@reduxjs/toolkit';

const { LoadStatus } = window;

const initialState: RootState = {
  search: { keyword: '', page: 1, isEnd: false, loadStatus: LoadStatus.Default, list: [] },
  update: { page: 1, isEnd: false, loadStatus: LoadStatus.Default, list: [] },
  favorites: [],
  manga: {
    mangaId: '',
    loadStatus: LoadStatus.Default,
  },
  chapter: {
    mangaId: '',
    chapterId: '',
    loadStatus: LoadStatus.Default,
  },
  dict: {
    manga: {},
    mangaToChapter: {},
    chapter: {},
  },
};

const searchSlice = createSlice({
  name: 'search',
  initialState: initialState.search,
  reducers: {
    loadSearch(state, action: PayloadAction<{ keyword: string; isReset?: boolean }>) {
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
      state.list = state.list.concat(data.map((item) => item.id));
      state.isEnd = data.length < 20;
    },
  },
});

const updateSlice = createSlice({
  name: 'update',
  initialState: initialState.update,
  reducers: {
    loadUpdate(state, action: PayloadAction<boolean | undefined>) {
      const isReset = action.payload || false;
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
      state.list = state.list.concat(data.map((item) => item.id));
      state.isEnd = data.length < 20;
    },
  },
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: initialState.favorites,
  reducers: {
    addFavorite(state, action: PayloadAction<string>) {
      state.push(action.payload);
    },
    removeFavorite(state, action: PayloadAction<string>) {
      return state.filter((item) => item !== action.payload);
    },
  },
});

const mangaSlice = createSlice({
  name: 'manga',
  initialState: initialState.manga,
  reducers: {
    loadManga(state, action: PayloadAction<string>) {
      state.loadStatus = LoadStatus.Pending;
      state.mangaId = action.payload;
    },
    loadMangaCompletion(
      state,
      action: FetchResponseAction<{ manga: Manga; chapter: ChapterItem[] }>
    ) {
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
    loadChapter(state, action: PayloadAction<{ mangaId: string; chapterId: string }>) {
      state.loadStatus = LoadStatus.Pending;
      state.mangaId = action.payload.mangaId;
      state.chapterId = action.payload.chapterId;
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
  reducers: {},
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
        state.manga[item.id] = item;
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
        state.manga[item.id] = item;
      });
    },
    [mangaSlice.actions.loadMangaCompletion.type]: (
      state,
      action: FetchResponseAction<{ manga: Manga; chapter: ChapterItem[] }>
    ) => {
      const { error, data } = action.payload;
      if (error) {
        return;
      }

      const { manga, chapter } = data;
      state.mangaToChapter[manga.id] = chapter;
      state.manga[manga.id] = manga;
    },
    [chapterSlice.actions.loadChapterCompletion.type]: (
      state,
      action: FetchResponseAction<Chapter>
    ) => {
      const { error, data } = action.payload;
      if (error) {
        return;
      }

      const { mangaId, chapterId } = data;
      state.chapter[mangaId + '$$' + chapterId] = data;
    },
  },
});

const searchAction = searchSlice.actions;
const updateAction = updateSlice.actions;
const favoritesAction = favoritesSlice.actions;
const mangaAction = mangaSlice.actions;
const chapterAction = chapterSlice.actions;
const dictAction = dictSlice.actions;

const searchReducer = searchSlice.reducer;
const updateReducer = updateSlice.reducer;
const favoritesReducer = favoritesSlice.reducer;
const mangaReducer = mangaSlice.reducer;
const chapterReducer = chapterSlice.reducer;
const dictReducer = dictSlice.reducer;

export const action = {
  ...searchAction,
  ...updateAction,
  ...favoritesAction,
  ...mangaAction,
  ...chapterAction,
  ...dictAction,
};
export const reducer = combineReducers({
  search: searchReducer,
  update: updateReducer,
  favorites: favoritesReducer,
  manga: mangaReducer,
  chapter: chapterReducer,
  dict: dictReducer,
});
