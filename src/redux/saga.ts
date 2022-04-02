import { all, put, fork, call, select, takeLatest, takeEvery } from 'redux-saga/effects';
import { fetchData, handleLatest, handleManga, handleChapter } from '~utils';
import { action } from './slice';

const {
  loadLatest,
  loadLatestCompletion,
  loadManga,
  loadMangaCompletion,
  loadChapter,
  loadChapterCompletion,
} = action;

function* loadLatestSaga() {
  yield takeLatest(loadLatest.type, function* () {
    const { page, isEnd } = yield select((state) => state.latest);

    if (isEnd) {
      yield put(loadLatestCompletion({ error: new Error('已经到底了!') }));
      return;
    }

    const { error, data } = yield call(fetchData, {
      url: 'https://m.manhuagui.com/update/',
      body: {
        page,
        ajax: 1,
        order: 1,
      },
    });

    yield put(loadLatestCompletion({ error, data: handleLatest(data) }));
  });
}

function* loadMangaSaga() {
  yield takeEvery(loadManga.type, function* () {
    const { search } = yield select((state: RootState) => state.manga);

    const { error, data } = yield call(fetchData, {
      url: 'https://m.manhuagui.com/comic/' + search,
    });

    yield put(loadMangaCompletion({ error, data: { ...handleManga(data), id: search } }));
  });
}

function* loadChapterSaga() {
  yield takeEvery(loadChapter.type, function* () {
    // const { search } = yield select((state: RootState) => state.chapter);

    const { error, data } = yield call(fetchData, {
      url: 'https://m.manhuagui.com/comic/39336/612275.html',
    });

    yield put(loadChapterCompletion({ error, data: handleChapter(data) }));
  });
}

export default function* rootSaga() {
  yield all([fork(loadLatestSaga), fork(loadMangaSaga), fork(loadChapterSaga)]);
}
