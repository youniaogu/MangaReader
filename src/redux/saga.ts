import { all, put, fork, call, select, takeLatest, takeEvery } from 'redux-saga/effects';
import { fetchData, handleLatest, handleManga, handleChapter } from '~utils';
import { action } from './slice';

const {
  loadUpdate,
  loadUpdateCompletion,
  loadManga,
  loadMangaCompletion,
  loadChapter,
  loadChapterCompletion,
} = action;

function* loadUpdateSaga() {
  yield takeLatest(loadUpdate.type, function* () {
    const { page, isEnd } = yield select((state) => state.update);

    if (isEnd) {
      yield put(loadUpdateCompletion({ error: new Error('已经到底了!') }));
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

    yield put(loadUpdateCompletion({ error, data: handleLatest(data) }));
  });
}

// https://m.manhuagui.com/s/1.html

// page: 2
// ajax: 1
// order: 0
// key: 1

// post

function* loadMangaSaga() {
  yield takeEvery(loadManga.type, function* () {
    const { currentId } = yield select((state: RootState) => state.manga);

    const { error, data } = yield call(fetchData, {
      url: 'https://m.manhuagui.com/comic/' + currentId,
    });
    const { manga, chapter } = handleManga(data);

    yield put(
      loadMangaCompletion({ error, data: { manga: { ...manga, id: currentId }, chapter } })
    );
  });
}

function* loadChapterSaga() {
  yield takeEvery(loadChapter.type, function* () {
    // const { currentId } = yield select((state: RootState) => state.chapter);

    const { error, data } = yield call(fetchData, {
      url: 'https://m.manhuagui.com/comic/39336/612275.html',
    });

    yield put(loadChapterCompletion({ error, data: handleChapter(data) }));
  });
}

export default function* rootSaga() {
  yield all([fork(loadUpdateSaga), fork(loadMangaSaga), fork(loadChapterSaga)]);
}
