import { all, put, fork, call, select, takeLatest, takeEvery } from 'redux-saga/effects';
import { fetchData, handleBookshelf, handleManga, handleChapter } from '~/utils';
import { action } from './slice';

const {
  loadSearch,
  loadSearchCompletion,
  loadUpdate,
  loadUpdateCompletion,
  loadManga,
  loadMangaCompletion,
  loadChapter,
  loadChapterCompletion,
} = action;

function* loadSearchSaga() {
  yield takeLatest(loadSearch.type, function* () {
    const { keyword, page, isEnd } = yield select((state: RootState) => state.search);

    if (isEnd) {
      yield put(loadSearchCompletion({ error: new Error('已经到底了!') }));
      return;
    }

    const body = new FormData();
    body.append('key', keyword);
    body.append('page', page);
    body.append('ajax', '1');
    body.append('order', '1');

    const { error, data } = yield call(fetchData, {
      url: `https://m.manhuagui.com/s/${keyword}.html/`,
      method: 'POST',
      body: page > 1 ? body : undefined,
    });

    yield put(loadSearchCompletion({ error, data: handleBookshelf(data) }));
  });
}

function* loadUpdateSaga() {
  yield takeLatest(loadUpdate.type, function* () {
    const { page, isEnd } = yield select((state: RootState) => state.update);

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

    yield put(loadUpdateCompletion({ error, data: handleBookshelf(data) }));
  });
}

function* loadMangaSaga() {
  yield takeEvery(loadManga.type, function* () {
    const { mangaId } = yield select((state: RootState) => state.manga);

    const { error, data } = yield call(fetchData, {
      url: 'https://m.manhuagui.com/comic/' + mangaId,
    });
    const { manga, chapter } = handleManga(data);

    yield put(loadMangaCompletion({ error, data: { manga: { ...manga, id: mangaId }, chapter } }));
  });
}

function* loadChapterSaga() {
  yield takeEvery(loadChapter.type, function* () {
    const { mangaId, chapterId } = yield select((state: RootState) => state.chapter);
    const { error, data } = yield call(fetchData, {
      url: `https://m.manhuagui.com/comic/${mangaId}/${chapterId}.html`,
    });

    yield put(loadChapterCompletion({ error, data: handleChapter(data) }));
  });
}

export default function* rootSaga() {
  yield all([
    fork(loadSearchSaga),
    fork(loadUpdateSaga),
    fork(loadMangaSaga),
    fork(loadChapterSaga),
  ]);
}
