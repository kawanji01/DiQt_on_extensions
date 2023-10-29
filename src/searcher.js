import { Word } from './word.js';
import { Translator } from './translator.js';
import { AISearcher } from './ai_searcher.js';


export class Searcher {

    static inilialize() {
        // ログイン情報がローカルストレージにある場合
        const searchForm = document.querySelector('#diqt-dict-search-form');
        // ドラッグしたテキストを辞書で検索できるイベントを付与。
        Searcher.mouseupSearch();
        // 検索フォームに、テキスト入力から検索できるイベントを付与。
        Searcher.searchViaForm(searchForm);
        // 検索フォームへのエンターを無効にする。
        Searcher.preventEnter(searchForm);
        // （ウィンドウを開いた瞬間に）画面の選択されているテキストを検索する
        Searcher.searchSelectedText();
    }



    // ドラッグした瞬間に、ドラッグしたテキストの検索を走らせるイベントを付与。
    static mouseupSearch() {
        document.addEventListener('mouseup', function (evt) {
            Searcher.searchSelectedText();
            // イベントの予期せぬ伝播を防ぐための記述
            evt.stopPropagation();
        }, false);
    }

    // ドラッグされているテキストを検索する処理
    static searchSelectedText() {
        const selTxt = window.getSelection().toString();

        // 選択されたテキストが#diqt-dict-extension-wrapper内にあるかどうかを確認
        const wrapperElement = document.querySelector('#diqt-dict-extension-wrapper');
        if (wrapperElement && wrapperElement.contains(window.getSelection().anchorNode)) {
            return; // #diqt-dict-extension-wrapper内のテキストが選択されている場合、処理を終了
        }
        // 検索を実行する前に、検索できる条件を満たしているか検証する。
        const previousKeywordForm = document.querySelector('#diqt-dict-search-keyword');
        let previousKeyword;
        if (previousKeywordForm) {
            previousKeyword = previousKeywordForm.textContent;
        } else {
            previousKeyword = '';
        }
        if (selTxt.length >= 1000) {
            document.querySelector('#search-diqt-dict-results').innerHTML = `<p style="color: #EE5A5A; font-size: 12px;">${chrome.i18n.getMessage("searchLimit")}</p>`
            return;
        }
        // 検索フォーム
        if (selTxt != '' && previousKeyword != selTxt && selTxt.length < 1000) {
            const searchForm = document.querySelector('#diqt-dict-search-form');
            if (searchForm) {
                searchForm.value = selTxt;
                Searcher.searchWord(selTxt);
            }
        }
    }


    // 検索フォームの入力に応じて検索するイベントを付与。
    static searchViaForm(form) {
        form.addEventListener('keyup', function () {
            const keyword = form.value
            const previousKeyword = document.querySelector('#diqt-dict-search-keyword').textContent;
            const search = () => {
                const currentKeyword = document.querySelector('#diqt-dict-search-form').value;
                if (keyword == currentKeyword && keyword != previousKeyword && keyword.length < 1000) {
                    Searcher.searchWord(keyword);
                } else if (keyword.length >= 1000) {
                    // コピペで1000文字以上フォームに入力された場合にエラーを表示する。
                    document.querySelector('#search-diqt-dict-results').innerHTML = `<p style="color: #EE5A5A; font-size: 12px;">${chrome.i18n.getMessage("searchLimit")}</p>`
                }
            }
            // 0.5秒ずつ、検索を走らせるか検証する。
            setTimeout(search, 500);
        });
    }

    // 検索フォームへのエンターを無効にする。
    static preventEnter(form) {
        form.addEventListener('keydown', function (e) {
            if (e.key == 'Enter') {
                e.preventDefault();
            }
        });
    }


    // keywordをdiqtの辞書で検索する
    static searchWord(keyword) {
        // 検索キーワードを更新する
        const searchKeyword = document.querySelector('#diqt-dict-search-keyword');
        searchKeyword.textContent = keyword;
        // 検索中であることを示す。
        Searcher.switchLoading();
        // キーワードが50文字以上なら50文字まで縮めてエンコードする。
        let encodedKeyword;
        if (keyword.length > 50) {
            encodedKeyword = encodeURIComponent(keyword.slice(0, 50));
        } else {
            encodedKeyword = encodeURIComponent(keyword);
        }
        // 実際の検索
        const port = chrome.runtime.connect({ name: "search" });
        port.postMessage({ action: "search", keyword: encodedKeyword });
        port.onMessage.addListener(function (msg) {
            const data = msg['data'];
            const dictionary = data.dictionary;
            // 翻訳やAI検索のボタンを表示する
            Searcher.renderSearchInfo(dictionary, keyword);
            // 辞書の検索結果を表示する
            Searcher.searchSuccess(data);
            return true;
        });
    }

    static switchLoading() {
        // 検索情報を空白に、検索結果をLoaderに変更して、検索中であることを示す。
        const translationWrapper = document.querySelector('#diqt-dict-keyword-translation-wrapper');
        translationWrapper.innerHTML = ``;
        const aiSearchWrapper = document.querySelector('#diqt-dict-ai-search-wrapper');
        aiSearchWrapper.innerHTML = ``;
        const resultForm = document.querySelector('#search-diqt-dict-results');
        // Loaderを表示する
        resultForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
    }



    static search() {
        const searchForm = document.querySelector('#diqt-dict-search-form');
        const keyword = searchForm.value;
        Searcher.searchWord(keyword);
    }

    // 検索結果を表示する
    static searchSuccess(data) {
        const resultForm = document.querySelector('#search-diqt-dict-results');
        resultForm.innerHTML = '';
        const words = data.words;
        const dictionary = data.dictionary;

        if (words != null) {
            words.forEach(function (word, index, array) {
                // 辞書の項目のHTMLを作成して、画面に挿入する
                const wordHtml = Word.createWordHtml(word);
                resultForm.insertAdjacentHTML('beforeend', wordHtml);
                // 生成したWordにイベントを設定する
                Word.setEventsToWord(word);
            });
            // 解説のクリックサーチを有効にする
            Word.activateClickSearch(resultForm);
            // 項目の読み上げを有効にする。
            Word.enableTTS(resultForm);
            // 検索キーワードが辞書に登録されていない場合、「項目の追加ボタン」などを表示する。
            const keyword = document.querySelector('#diqt-dict-search-keyword').textContent;
            if (words[0]['entry'] != keyword) {
                resultForm.insertAdjacentHTML('beforeend', Word.notFoundFormHtml(keyword, dictionary));
            } else {
                resultForm.insertAdjacentHTML('beforeend', Word.newWordHtml(keyword, dictionary));
            }


        } else if (data.status == undefined) { // CORSエラーが発生した場合の処理
            /////// CORSエラーの再現方法 ////////
            // 1, アイコンのコンテキストメニューから「拡張機能を管理」へ飛ぶ。
            // 2, 拡張機能を一度OFFにしてから再びONにする。
            // 3, 適当なタブをリロードしてから、辞書を引く。
            // 4, エラー発生。内容：Access to fetch at '' from origin 'chrome-extension://gpddlaapalckciombdafdfpeakndmmeg' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
            const corsErrorHtml = `<div class="diqt-dict-meaning" style="margin: 24px 0;">${chrome.i18n.getMessage("searchError")}<a id="diqt-dict-option-btn" style="color: #27ae60;">${chrome.i18n.getMessage("searchErrorSolution")}</a></div>`
            resultForm.insertAdjacentHTML('afterbegin', corsErrorHtml);
            // 5, なぜかこのCORSのエラーは、一度option画面（chrome-extension://gpddlaapalckciombdafdfpeakndmmeg/options.html）にアクセスすると治るので、option画面へのリンクを設置する。
            const optionBtn = document.querySelector('#diqt-dict-option-btn');
            optionBtn.addEventListener('click', function () {
                // 
                const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
        } else {
            // 検索結果が見つからなかったり、検索文字数をオーバーした場合の処理
            let keyword = document.querySelector('#diqt-dict-search-keyword').textContent;
            keyword = keyword.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            let notFound = ``;
            if (keyword.length < 50 && keyword.length > 0) {
                notFound = Word.notFoundFormHtml(keyword, dictionary);
            }
        }
    }


    static renderSearchInfo(dictionary, keyword) {
        if (dictionary) {
            // 翻訳ボタンの表示
            const translationWrapper = document.querySelector('#diqt-dict-keyword-translation-wrapper');
            Translator.addTranslationButtons(translationWrapper, keyword, dictionary.lang_number_of_entry, dictionary.lang_number_of_meaning);
            // AI検索ボタンの表示
            AISearcher.addAISearchForm(keyword, dictionary);
        }
    }




}