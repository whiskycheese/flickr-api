/* jshint curly:true, debug:true */

// Flickr API key
const API_KEY = '6bcc4c9fd52abb5fa2e26e6c46146238';

// 状態の定数
const IS_INITIALIZED = 'IS_INITIALIZED'; // 最初の状態
const IS_FETCHING = 'IS_FETCHING'; // APIからデータを取得中
const IS_FAILED = 'IS_FAILED'; // APIからデータを取得できなかった
const IS_FOUND = 'IS_FOUND'; // APIから画像データを取得できた
const IS_NOT_FOUND = 'IS_NOT_FOUND'; // APIから画像データを取得できなかった

/**
 * --------------------
 * Flickr API 関連の関数
 * --------------------
 */

// URL作成して返す
const getRequestURL = (searchText) => {
  const parameters = {
    method: 'flickr.photos.search',
    api_key: API_KEY,
    text: searchText, // 検索テキスト
    sort: 'interestingness-desc', // 興味深さ順
    per_page: 32, // 取得件数
    license: '4', // Creative Commons Attributionのみ
    extras: 'owner_name,license', // 追加で取得する情報
    format: 'json', // レスポンスをJSON形式に
    nojsoncallback: 1, // レスポンスの先頭に関数呼び出しを含めない
  };
  const url = new URL('https://api.flickr.com/services/rest');
  url.search = new URLSearchParams(parameters);
  return url;
};

// 個々の画像のURLを作成して返す
const getFlickrImageURL = (photo, size) => {
  let url = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}`;
  if (size) {
    // サイズ指定ありの場合
    url += `_${size}`;
  }
  url += '.jpg';
  return url;
};

// ページのURLを作成して返す
const getFlickrPageURL = (photo) => `https://www.flickr.com/photos/${photo.owner}/${photo.id}`;

// ツールチップのテキストを生成して返す
const getFlickrText = (photo) => {
  let text = `"${photo.title}" by ${photo.ownername}`;
  if (photo.license === '4') {
    // Creative Commons Attribution（CC BY）ライセンス
    text += ' / CC BY';
  }
  return text;
};

/**
 * -------------
 * Vueインスタンス
 * -------------
 */

new Vue({
  el: '#app',

  data: {
    // 前回の検索テキスト
    prevSearchText: '',
    // photoオブジェクト
    photos: [],
    // 現在の状態
    currentState: IS_INITIALIZED,
  },

  // 現在の状態の真偽値を返す。
  computed: {
    isInitialized() {
      return this.currentState === IS_INITIALIZED;
    },
    isFetching() {
      return this.currentState === IS_FETCHING;
    },
    isFailed() {
      return this.currentState === IS_FAILED;
    },
    isFound() {
      return this.currentState === IS_FOUND;
    },
    isNotFound() {
      return this.currentState === IS_NOT_FOUND;
    }
  },

  methods: {
    // 現在の状態を変更する
    toFetching() {
      this.currentState = IS_FETCHING;
    },
    toFailed() {
      this.currentState = IS_FAILED;
    },
    toFound() {
      this.currentState = IS_FOUND;
    },
    toNotFound() {
      this.currentState = IS_NOT_FOUND;
    },

    // フォーム送信時に発火
    fetchImagesFromFlickr(event) {
      // eventは引数として渡されたeventオブジェクト
      // targetはイベント発生した要素なのでform要素
      // elementsはformの部品要素
      // searchは、searchというname属性を持つ要素
      // valueはsearchというname属性を持つ要素の値（検索テキスト）
      const searchText = event.target.elements.search.value;

      // APIからデータを取得中で、なおかつ検索テキストが前回の検索時と同じ場合、再度リクエストしない
      if (this.isFetching && searchText === this.prevSearchText) {
        return;
      }

      // Vueインスタンスのデータとして、検索テキストを保持
      this.prevSearchText = searchText;

      // 取得中...
      this.toFetching();

      // getRequeatURL関数でurlを取得する
      const url = getRequestURL(searchText);

      // 生成したurlでサーバからデータをfetchしてくる
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          // もしステータスがOKじゃなかったら失敗..
          if (data.stat !== 'ok') {
            this.toFailed();
            return;
          }

          // ステータスがOKだったということで、dataの中のphotoオブジェクトを変数に代入
          const fetchedPhotos = data.photos.photo;

          // 検索テキストに該当する画像データがない場合
          if (fetchedPhotos.length === 0) {
            this.toNotFound();
            return;
          }

          // 検索テキストに該当する画像データがあったということで、
          // mapで新しい配列を生成して、photos配列に代入
          this.photos = fetchedPhotos.map((photo) => ({
            id: photo.id,
            imageURL: getFlickrImageURL(photo, 'q'),
            pageURL: getFlickrPageURL(photo),
            text: getFlickrText(photo),
          }));

          // 探せた...
          this.toFound();
        }).catch(() => {
          // fetch ダメだったら失敗...
          this.toFailed();
        });
    },
  },
});