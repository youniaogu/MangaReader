import { createSlice, combineReducers, PayloadAction } from '@reduxjs/toolkit';

const initialState: RootState = {
  latest: { page: 1, isEnd: false, loadStatus: 0, list: [] },
  manga: {
    search: '',
    loadStatus: 0,
    dict: {},
  },
  chapter: {
    search: '',
    loadStatus: 0,
    dict: {},
  },
};

const latestSlice = createSlice({
  name: 'latest',
  initialState: initialState.latest,
  reducers: {
    loadLatest(state, action: PayloadAction<boolean | undefined>) {
      const isReset = action.payload || false;
      if (isReset) {
        state.page = 1;
        state.list = [];
        state.isEnd = false;
      }
      state.loadStatus = 1;
    },
    loadLatestCompletion(state, action: any) {
      const { error, data = [] } = action.payload;
      if (error) {
        state.loadStatus = 0;
        return;
      }

      state.page += 1;
      state.loadStatus = 2;
      state.list = state.list.concat(data);
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
      state.search = action.payload;
    },
    loadMangaCompletion(state, action) {
      const { error, data } = action.payload;
      if (error) {
        state.loadStatus = 0;
        return;
      }

      if (!state.dict[data.id]) {
        state.dict[data.id] = {
          id: data.id,
          cover: '',
          title: '',
          latest: '',
          updateTime: '',
          author: '',
          tag: '',
          chapter: [],
          status: 0,
        };
      }

      state.loadStatus = 2;
      state.dict[data.id] = data;
    },
  },
});

const chapterSlice = createSlice({
  name: 'chapter',
  initialState: initialState.manga,
  reducers: {
    loadChapter(state, action: PayloadAction<string>) {
      state.loadStatus = 1;
      state.search = action.payload;
    },
    loadChapterCompletion(state, action: any) {
      console.log({ state, action });
    },
  },
});

const latestAction = latestSlice.actions;
const latestReducer = latestSlice.reducer;
const mangaAction = mangaSlice.actions;
const mangaReducer = mangaSlice.reducer;
const chapterAction = chapterSlice.actions;
const chapterReducer = chapterSlice.reducer;

export const action = { ...latestAction, ...mangaAction, ...chapterAction };
export const reducer = combineReducers({
  latest: latestReducer,
  manga: mangaReducer,
  chapter: chapterReducer,
});
