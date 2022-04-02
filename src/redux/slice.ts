import { createSlice, combineReducers, PayloadAction } from '@reduxjs/toolkit';

const initialState: RootState = {
  search: { search: '', page: 1, isEnd: false, loadStatus: 0, list: [] },
  update: { page: 1, isEnd: false, loadStatus: 0, list: [] },
  manga: {
    currentId: '',
    loadStatus: 0,
  },
  chapter: {
    currentId: '',
    loadStatus: 0,
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

      state.search = keyword;
      state.loadStatus = 1;
    },
    loadSearchCompletion(state, action: FetchResponseAction<Manga[]>) {
      const { error, data = [] } = action.payload;
      if (error) {
        state.loadStatus = 0;
        return;
      }

      state.page += 1;
      state.loadStatus = 2;
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

      state.loadStatus = 1;
    },
    loadUpdateCompletion(state, action: FetchResponseAction<Manga[]>) {
      const { error, data = [] } = action.payload;
      if (error) {
        state.loadStatus = 0;
        return;
      }

      state.page += 1;
      state.loadStatus = 2;
      state.list = state.list.concat(data.map((item) => item.id));
      state.isEnd = data.length < 20;
    },
  },
});

const mangaSlice = createSlice({
  name: 'manga',
  initialState: initialState.manga,
  reducers: {
    loadManga(state, action: PayloadAction<string>) {
      state.loadStatus = 1;
      state.currentId = action.payload;
    },
    loadMangaCompletion(
      state,
      action: FetchResponseAction<{ manga: Manga; chapter: ChapterItem[] }>
    ) {
      const { error } = action.payload;
      if (error) {
        state.loadStatus = 0;
        return;
      }

      state.loadStatus = 2;
    },
  },
});

const chapterSlice = createSlice({
  name: 'chapter',
  initialState: initialState.chapter,
  reducers: {
    loadChapter(state, action: PayloadAction<string>) {
      state.loadStatus = 1;
      state.currentId = action.payload;
    },
    loadChapterCompletion(state, action: FetchResponseAction<any>) {
      console.log({ state, action });
    },
  },
});

const dictSlice = createSlice({
  name: 'dict',
  initialState: initialState.dict,
  reducers: {},
  extraReducers: {
    // 加载搜索列表
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
    // 加载最新列表
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
    // 加载漫画详情
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
  },
});

const searchAction = searchSlice.actions;
const searchReducer = searchSlice.reducer;
const updateAction = updateSlice.actions;
const updateReducer = updateSlice.reducer;
const mangaAction = mangaSlice.actions;

const mangaReducer = mangaSlice.reducer;
const chapterAction = chapterSlice.actions;
const chapterReducer = chapterSlice.reducer;
const dictAction = dictSlice.actions;
const dictReducer = dictSlice.reducer;

export const action = {
  ...searchAction,
  ...updateAction,
  ...mangaAction,
  ...chapterAction,
  ...dictAction,
};
export const reducer = combineReducers({
  search: searchReducer,
  update: updateReducer,
  manga: mangaReducer,
  chapter: chapterReducer,
  dict: dictReducer,
});
