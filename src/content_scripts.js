// import 文を使ってstyle.cssファイルを読み込む。参照：https://webpack.js.org/plugins/mini-css-extract-plugin/
// import './style.scss';
// 挫折：mini-css-extract-pluginを使って上記の方法でcssをimportしようとすると、JSframeが呼び出せなくなる。
import { JSFrame } from 'jsframe.js';
import { Review } from './review.js';

// Backgroundからタブに送られたメッセージを受信し、タブ内でメッセージに応じた処理を実行する。
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request) {
        case "Action":
            // アイコンを押したときに、辞書ウィンドウの表示/非表示を切り替える。/ manifest 3 では書き方に変更があった。参照：https://blog.holyblue.jp/entry/2021/05/03/105010
            toggleFloatingWindow();
            break;
        case "Updated":
            // タブが更新されたときにあらかじめ実行する、テキスト選択時などの処理。
            displayPopupWhenSelected();
            break;
    }
    return true;
});

// ショートカットキー操作
document.addEventListener("keydown", event => {
    if (event.ctrlKey) {
        switch (event.key) {
            // Ctrl + Q でウィンドウを開閉する
            case 'q':
                toggleFloatingWindow();
                break;
        }
    }
});

// 辞書ウィンドウの表示/非表示を切り替える。
function toggleFloatingWindow() {
    let extensionWrapper = document.getElementById('diqt-dict-extension-wrapper');
    if (extensionWrapper == null) {
        let jsFrame = new JSFrame({
            horizontalAlign: 'right'
        })

        const form_html = `
        <div id="diqt-dict-extension-wrapper">
        <a>
        <div id="diqt-dict-logged-in-user" style="font-size: 10px;">　</div>
        </a>
        <form method="get" action=""><input type="text" name="keyword" id="diqt-dict-search-form"></form>
        <div id="diqt-dict-search-status" style="text-align: left; color: #6e6e6e;">
        "<span id="diqt-dict-search-keyword" style="font-size: 12px;"></span>"<span id="diqt-dict-search-status-text"></span>
        </div>
        <div id="search-diqt-dict-results"></div>
        </div>`

        let frame = jsFrame.create({
            name: 'diqt-dict-window',
            title: 'Ctrl + Q で開閉',
            width: 320,
            height: 480,
            movable: true, //マウスで移動可能
            resizable: true, //マウスでリサイズ可能
            appearanceName: 'material',
            appearanceParam: {
                border: {
                    shadow: '2px 2px 10px  rgba(0, 0, 0, 0.5)',
                    width: 0,
                    radius: 6,
                },
                titleBar: {
                    name: 'diqt-dict-window-bar',
                    color: 'white',
                    // Brand color
                    background: '#273132',
                    leftMargin: 16,
                    height: 30,
                    fontSize: 14,
                    buttonWidth: 36,
                    buttonHeight: 16,
                    buttonColor: 'white',
                    buttons: [ // buttons on the right
                        {
                            //Set font-awesome fonts(https://fontawesome.com/icons?d=gallery&m=free)
                            fa: 'fas fa-times', //code of font-awesome
                            name: 'closeButton',
                            visible: true // visibility when window is created.
                        },
                    ],
                },
            },
            style: {
                overflow: 'auto'
            },
            html: form_html
        });
        frame.setPosition(-20, 100, ['RIGHT_TOP']);
        frame.show();
        let searchForm = document.querySelector('#diqt-dict-search-form');
        // ドラッグしたテキストを辞書で検索できるイベントを付与。
        mouseupSearch();
        // 検索フォームに、テキスト入力から検索できるイベントを付与。
        searchViaForm(searchForm);
        // 検索フォームへのエンターを無効にする。
        preventEnter(searchForm);
        // ウィンドウをページの最上部に持ってくる。
        extensionWrapper = frame.$('#diqt-dict-extension-wrapper');
        let frameDom = extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode;
        // z-indexを限界値に設定し、frameを最前面に表示する。
        frameDom.style.zIndex = '2147483647';
        // （ウィンドウを開いた瞬間に）画面の選択されているテキストを検索する
        searchSelectedText();
        // フォーム直上にユーザーステータス（ログイン状態など）を表示する。
        renderUserStatus();
    } else {
        let frameDom = extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode;
        frameDom.remove()
    }

}


// ドラッグした瞬間に、ドラッグしたテキストの検索を走らせるイベントを付与。
function mouseupSearch() {
    document.addEventListener('mouseup', function (evt) {
        searchSelectedText();
        // イベントの予期せぬ伝播を防ぐための記述
        evt.stopPropagation();
    }, false);
}

// ドラッグされているテキストを検索する処理
function searchSelectedText() {
    const selTxt = window.getSelection().toString();
    let previousKeywordForm = document.querySelector('#diqt-dict-search-keyword');
    let previousKeyword;
    if (previousKeywordForm) {
        previousKeyword = previousKeywordForm.textContent;
    } else {
        previousKeyword = '';
    }
    if (selTxt.length >= 1000) {
        document.querySelector('#search-diqt-dict-results').innerHTML = `<p style="color: #EE5A5A; font-size: 12px;">検索できるのは1000文字未満までです。</p>`
        return;
    }
    // 検索フォーム
    if (selTxt != '' && previousKeyword != selTxt && selTxt.length < 1000) {
        let searchForm = document.querySelector('#diqt-dict-search-form');
        if (searchForm) {
            searchForm.value = selTxt;
            searchWord(selTxt);
        }
    }
}


// 検索フォームの入力に応じて検索するイベントを付与。
function searchViaForm(form) {
    form.addEventListener('keyup', function () {
        let keyword = form.value
        let previousKeyword = document.querySelector('#diqt-dict-search-keyword').textContent;
        const search = () => {
            let currentKeyword = document.querySelector('#diqt-dict-search-form').value;
            if (keyword == currentKeyword && keyword != previousKeyword && keyword.length < 1000) {
                searchWord(keyword);
            } else if (keyword.length >= 1000) {
                // コピペで1000文字以上フォームに入力された場合にエラーを表示する。
                document.querySelector('#search-diqt-dict-results').innerHTML = `<p style="color: #EE5A5A; font-size: 12px;">検索できるのは1000文字未満までです。</p>`
            }
        }
        // 0.5秒ずつ、検索を走らせるか検証する。
        setTimeout(search, 500);
    });
}


// 検索フォームへのエンターを無効にする。
function preventEnter(form) {
    form.addEventListener('keydown', function (e) {
        if (e.key == 'Enter') {
            e.preventDefault();
        }
    });
}


// keywordをdiqtの辞書で検索する
function searchWord(keyword) {
    // 検索キーワードを更新する
    let searchKeyword = document.querySelector('#diqt-dict-search-keyword');
    searchKeyword.textContent = keyword;
    if (keyword.length < 50 && keyword.length > 0) {
        document.querySelector('#diqt-dict-search-status-text').textContent = 'の検索結果';
    } else {
        document.querySelector('#diqt-dict-search-status-text').textContent = '';
    }
    // 検索結果をLoaderに変更して、検索中であることを示す。
    let resultForm = document.querySelector('#search-diqt-dict-results');
    resultForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
    // キーワードが50文字以上なら50文字まで縮めてエンコードする。
    let encodedKeyword;
    if (keyword.length > 50) {
        encodedKeyword = encodeURIComponent(keyword.slice(0, 50));
    } else {
        encodedKeyword = encodeURIComponent(keyword);
    }
    // 実際の検索
    let port = chrome.runtime.connect({ name: "search" });
    port.postMessage({ action: "search", keyword: encodedKeyword });
    port.onMessage.addListener(function (msg) {
        let data = msg['data'];
        searchSuccess(data);
        return true;
    });
}

// 検索結果を表示する
function searchSuccess(data) {
    let resultForm = document.querySelector('#search-diqt-dict-results');
    resultForm.innerHTML = '';
    let words = data.words;
    let dictionary = data.dictionary;

    chrome.storage.local.get(['diqtDictToken'], function (result) {
        let loginToken = result.diqtDictToken;
        if (words != null) {
            words.forEach(function (word, index, array) {
                // 辞書の項目のHTMLを作成して、画面に挿入する
                let wordHtml = createWordHtml(word, loginToken);
                resultForm.insertAdjacentHTML('beforeend', wordHtml);
                // 意味の翻訳ボタンのイベントを設定する。
                setMeaningTranslation(word, loginToken);
                // 復習ボタンのイベントを設定する。
                Review.setEventToReviewBtn(word.quiz.id, word.review, loginToken);
                // 例文の復習ボタンのイベントを設定する。
                let sentence = word.sentence;
                if (sentence) {
                    Review.setEventToReviewBtn(word.sentence_quiz.id, word.sentence_review, loginToken);
                }
            });
            // 解説のクリックサーチを有効にする
            activateClickSearch(resultForm);
            // 項目の読み上げを有効にする。
            enableTTS(resultForm);
            // 検索キーワードが辞書に登録されていない場合、「項目の追加ボタン」などを表示する。
            let keyword = document.querySelector('#diqt-dict-search-keyword').textContent;
            if (words[0]['entry'] != keyword) {
                resultForm.insertAdjacentHTML('beforeend', notFoundFormHtml(keyword, dictionary));
            } else {
                resultForm.insertAdjacentHTML('beforeend', newWordHtml(keyword, dictionary));
            }

            // 翻訳ボタンを末尾に置き、イベントを付与
            let translationFrom = createTranslationForm(loginToken);
            resultForm.insertAdjacentHTML('beforeend', translationFrom);
            addEventToTranslationForm(loginToken, keyword);
            console.log('Add tranlsation');

        } else if (data.status == undefined) { // CORSエラーが発生した場合の処理
            /////// CORSエラーの再現方法 ////////
            // 1, アイコンのコンテキストメニューから「拡張機能を管理」へ飛ぶ。
            // 2, 拡張機能を一度OFFにしてから再びONにする。
            // 3, 適当なタブをリロードしてから、辞書を引く。
            // 4, エラー発生。内容：Access to fetch at '' from origin 'chrome-extension://gpddlaapalckciombdafdfpeakndmmeg' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
            let corsErrorHtml = `<div class="diqt-dict-meaning" style="margin: 24px 0;">大変申し訳ございません。辞書にアクセスできませんでした。<a id="diqt-dict-option-btn" style="color: #27ae60;">こちら</a>にアクセスした後、再び検索してください。</div>`
            resultForm.insertAdjacentHTML('afterbegin', corsErrorHtml);
            // 5, なぜかこのCORSのエラーは、一度option画面（chrome-extension://gpddlaapalckciombdafdfpeakndmmeg/options.html）にアクセスすると治るので、option画面へのリンクを設置する。
            let optionBtn = document.querySelector('#diqt-dict-option-btn');
            optionBtn.addEventListener('click', function () {
                // 
                let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
        } else {
            // 検索結果が見つからなかったり、検索文字数をオーバーした場合の処理
            let keyword = document.querySelector('#diqt-dict-search-keyword').textContent;
            keyword = keyword.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            let notFound = ``;
            if (keyword.length < 50 && keyword.length > 0) {
                notFound = notFoundFormHtml(keyword, dictionary);
            }

            let translationForm = createTranslationForm(loginToken);
            let result = notFound + translationForm
            resultForm.insertAdjacentHTML('afterbegin', result);
            addEventToTranslationForm(loginToken, keyword);
        }
    });


}

// WordのHTMLを作成する
function createWordHtml(word, loginToken) {
    //let tags = createTagsHtml(word.tags);
    let wordURL = `https://www.diqt.net/ja/words/${word.id}`;
    /* タイトル */
    let entry = `<div class="diqt-dict-entry">
                                <span>${word.entry}</span><button class="diqt-dict-speech-btn"><i class="fas fa-volume-up"></i></button>
                             </div>`;
    /* 意味 */
    let meaning = `<div class="diqt-dict-meaning">${markNotation(word.meaning)}</div>`;
    /* 意味の翻訳ボタン */
    let meaningTranslation = createMeaningTranslation(word);
    /* 復習ボタン */
    let review = word.review;
    let quizId = word.quiz.id;
    let reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quizId}">${Review.createReviewBtnHtml(quizId, review, loginToken)}</div>`;

    /* 解説 */
    //let explanationLabel = '';
    //let explanation = '';
    //if (word.explanation) {
    //    explanationLabel = `<div style="text-align: left; margin-top: 16px"><div class="diqt-dict-label">解説</div></div>`
    //    explanation = `<div class="diqt-dict-explanation">${markNotation(word.explanation)}</div>`
    //}
    //let explanationBtn = `<a href="${wordURL}" target="_blank" rel="noopener" class="diqt-dict-explanation-btn">詳細を見る</a>`;
    /* 例文 */
    let sentenceHtml = createSentenceHtml(word, loginToken);
    /* 項目の編集ボタン */
    let linkToImproveWord = liknToImproveHtml(wordURL, 'この項目を編集する');
    /* 項目編集ボタンの上の余白 */
    // let spaceBeforeImproveWordBtn = '<div style="width: 100%; height: 16px;"></div>'
    /* 項目と次の項目の間の余白 */
    let bottomSpace = '<div style="width: 100%; height: 24px;"></div>'
    /* 項目のレンダリング */
    let wordHtml = entry + meaning + meaningTranslation + reviewBtn + sentenceHtml + linkToImproveWord + bottomSpace;
    return wordHtml;
}

// 意味の翻訳ボタンを作成する
function createMeaningTranslation(word) {
    if (word.lang_number_of_entry == word.lang_number_of_meaning) {
        return `<div id="small-translation-buttons-word-${word.id}" style="padding-left: 4px;">
                    <span class="diqt-google-translation-btn-wrapper">
                        <a href="#" class="diqt-google-translation-btn" style="color: #27ae60;"><u>Google翻訳</u></a>
                    </span>
                    <span >/</span>
                    <span class="diqt-deepl-translation-btn-wrapper">
                        <a href="#" class="diqt-deepl-translation-btn" style="color: #27ae60;"><u>DeepL翻訳</u></a>
                    </span>
                    <p class="diqt-google-translation-form"></p>
                    <p class="diqt-deepl-translation-form"></p>
                </div>`;
    }
    return '';
}

//  意味の翻訳イベントを設定する。
function setMeaningTranslation(word, loginToken) {
    if (word.lang_number_of_entry == word.lang_number_of_meaning) {
        let buttons = document.getElementById(`small-translation-buttons-word-${word.id}`);
        // google翻訳
        let googleButton = buttons.querySelector('.diqt-google-translation-btn');
        let googleWrapper = buttons.querySelector('.diqt-google-translation-btn-wrapper');
        let googleTranslationForm = buttons.querySelector('.diqt-google-translation-form');
        googleButton.addEventListener('click', function () {
            if (loginToken) {
                googleWrapper.innerHTML = '<span>翻訳中...</span>';
                let port = chrome.runtime.connect({ name: "googleTranslation" });
                port.postMessage({ action: "googleTranslation", keyword: word.meaning });
                port.onMessage.addListener(function (msg) {
                    let data = msg['data'];
                    googleWrapper.innerHTML = '<span>完了</span>';
                    if (data['status'] == "200") {
                        let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>Google翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                        googleTranslationForm.innerHTML = translation;
                    } else {
                        googleTranslationForm.innerHTML = `<a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                    }
                    return true;
                });
            } else {
                // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
                return true;
            }
        });
        // Deepl翻訳
        let deeplButton = buttons.querySelector('.diqt-deepl-translation-btn');
        let deeplWrapper = buttons.querySelector('.diqt-deepl-translation-btn-wrapper');
        let deeplTranslationForm = buttons.querySelector('.diqt-deepl-translation-form');
        deeplButton.addEventListener('click', function () {
            if (loginToken) {
                deeplWrapper.innerHTML = '<span>翻訳中...</span>';
                let port = chrome.runtime.connect({ name: "deeplTranslation" });
                port.postMessage({ action: "deeplTranslation", keyword: word.meaning });
                port.onMessage.addListener(function (msg) {
                    let data = msg['data'];
                    deeplWrapper.innerHTML = '<span>完了</span>';
                    if (data['status'] == "200") {
                        let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>DeepL翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                        deeplTranslationForm.innerHTML = translation;
                    } else {
                        deeplTranslationForm.innerHTML = `<a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                    }
                    return true;
                });
            } else {
                // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
                return true;
            }
        });
    }
}




// 例文のHTMLを作成する
function createSentenceHtml(word, loginToken) {
    let sentence = word.sentence;
    let quiz = word.sentence_quiz;
    let review = word.sentence_review;
    if (sentence == null || quiz == null) {
        // 例文がない場合は、例文を追加するリンクための項目の編集リンクを返す
        //return liknToImproveHtml(`https://www.diqt.net/ja/words/${word.id}/edit`, '例文を追加する');
        return '';
    }
    // 例文と翻訳
    let label = `<div style="text-align: left; margin-top: 16px"><div class="diqt-dict-label">例文</div></div>`;
    let original = `<div class="diqt-dict-explanation">${markNotation(sentence.original)}</div>`;
    let translation = `<div class="diqt-dict-explanation">${sentence.translation}</div>`;
    // 例文の復習ボタン 
    let quizId = quiz.id;
    //let review = sentence.quiz.review;
    let reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quizId}">${Review.createReviewBtnHtml(quizId, review, loginToken)}</div>`;
    // 例文の編集ボタン
    let sentenceUrl = `https://www.diqt.net/ja/sentences/${sentence.id}`
    let linkToImproveSentence = liknToImproveHtml(sentenceUrl, 'この例文を編集する');
    // 例文のHTML
    let sentenceHtml = label + original + translation + reviewBtn + linkToImproveSentence;
    return sentenceHtml;
}




// 翻訳ボタンを生成する
function createTranslationForm(loginToken) {
    let translationForm;
    if (loginToken) {
        translationForm = `<div id="diqt-dict-translation-form">
        <div id="diqt-dict-google-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">Googleで翻訳する</div></div>
        <div id="diqt-dict-deepl-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">DeepLで翻訳する</div></div>
        </div>`
    } else {
        translationForm = `<div id="diqt-dict-translation-form">
        <div id="diqt-dict-google-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">Googleで翻訳する</div></div>
        <div id="diqt-dict-deepl-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">DeepLで翻訳する</div></div>
        <p><a id="diqt-dict-login-for-translation" style="color: #27ae60;">ログイン</a>することで、機械翻訳が利用できるようになります。</p>
        </div>`
    }
    return translationForm
}

// 「改善ボタン」と「詳細ボタン」のhtmlを生成する（項目と例文に使用）
function liknToImproveHtml(url, label) {
    let html = `<div style="display: flex;">
                    <a href="${url + '/edit'}" target="_blank" rel="noopener" class="diqt-dict-link-to-improve" style="margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-edit"></i>${label}</a>
                    <a href="${url}" target="_blank" rel="noopener" class="diqt-dict-link-to-improve" style="margin-left: auto; margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-external-link" style="margin-right: 4px;"></i>詳細</a>
                </div>`;
    return html;
}

// 辞書に検索キーワードが登録されていなかった場合に表示する「項目追加ボタン」や「Web検索ボタン」を生成する。
function notFoundFormHtml(keyword, dictionary) {
    let notFound = `<div class="diqt-dict-meaning" style="margin: 24px 0;">${keyword}は辞書に登録されていません。</div>`;
    let createNewWord = `<a href="https://www.diqt.net/ja/words/new?dictionary_id=${dictionary.id}&text=${keyword}" target="_blank" rel="noopener" style="text-decoration: none;">
                <div class="diqt-dict-review-btn" style="font-weight: bold;">辞書に登録する</div></a>`;
    let searchWeb = `<a href="https://www.google.com/search?q=${keyword}+意味&oq=${keyword}+意味"" target="_blank" rel="noopener" style="text-decoration: none;">
            <div class="diqt-dict-review-btn" style="font-weight: bold;">Webで検索する</div></a>`;
    let html = notFound + createNewWord + searchWeb;
    return html;
}

// 辞書の追加とWeb検索ボタン
function newWordHtml(keyword, dictionary) {
    let createNewWord = `<a href="https://www.diqt.net/ja/words/new?dictionary_id=${dictionary.id}&text=${keyword}" target="_blank" rel="noopener" style="text-decoration: none;">
                <div class="diqt-dict-review-btn" style="font-weight: bold;">辞書に登録する</div></a>`;
    let searchWeb = `<a href="https://www.google.com/search?q=${keyword}+意味&oq=${keyword}+意味"" target="_blank" rel="noopener" style="text-decoration: none;">
            <div class="diqt-dict-review-btn" style="font-weight: bold;">Webで検索する</div></a>`;
    let html = createNewWord + searchWeb;
    return html;
}

// 翻訳フォームにイベントを付与
function addEventToTranslationForm(loginToken, keyword) {
    const googleTranslationForm = document.querySelector('#diqt-dict-google-translation');
    const deeplTranslationForm = document.querySelector('#diqt-dict-deepl-translation');
    if (loginToken) {
        // Google翻訳
        googleTranslationForm.addEventListener('click', function () {
            googleTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
            let port = chrome.runtime.connect({ name: "googleTranslation" });
            port.postMessage({ action: "googleTranslation", keyword: keyword });
            port.onMessage.addListener(function (msg) {
                let data = msg['data'];
                if (data['status'] == "200") {
                    let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>Google翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                    googleTranslationForm.innerHTML = translation;
                } else {
                    let message = `<p style="margin: 24px 0;"><a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                    googleTranslationForm.innerHTML = message;
                }
                return true;
            });
        });
        // DeepL翻訳
        deeplTranslationForm.addEventListener('click', function () {
            deeplTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
            let deeplPort = chrome.runtime.connect({ name: "deeplTranslation" });
            deeplPort.postMessage({ action: "deeplTranslation", keyword: keyword });
            deeplPort.onMessage.addListener(function (msg) {
                let data = msg['data'];
                if (data['status'] == "200") {
                    let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>DeepL翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                    deeplTranslationForm.innerHTML = translation;
                } else {
                    let message = `<p style="margin: 24px 0;"><a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                    deeplTranslationForm.innerHTML = message;
                }
                return true;
            });
        });

    } else {
        // options.htmlへのリンクを設定する。
        googleTranslationForm.addEventListener('click', function () {
            // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
            let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
            rtnPromise.then((response) => { }).catch((error) => { });
        });
        deeplTranslationForm.addEventListener('click', function () {
            let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
            rtnPromise.then((response) => { }).catch((error) => { });
        });
        const loginBtn = document.querySelector('#diqt-dict-login-for-translation');
        loginBtn.addEventListener('click', function () {
            let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
            rtnPromise.then((response) => { }).catch((error) => { });
        });
    }
}

// 記法が使われた解説テキストをマークアップする。
function markNotation(text) {
    // 改行コードをすべて<br>にする。
    let expTxt = text.replace(/\r?\n/g, '<br>');
    // wiki記法（[[text]]）でテキストを分割する。
    let expTxtArray = expTxt.split(/(\[{2}.*?\]{2})/);
    let processedArray = [];
    expTxtArray.forEach(function (item, index, array) {
        if (item.match(/\[{2}.+\]{2}/) == null) {
            processedArray.push(item);
        } else {
            item = item.replace(/\[{2}/g, "").replace(/\]{2}/g, "");
            item = item.split(/\|/, 2);
            let linkHtml;
            if (item[1] == undefined) {
                linkHtml = `<a class="diqt-notation-link" data-value="${item[0]}">${item[0]}</a>`
            } else {
                linkHtml = `<a class="diqt-notation-link" data-value="${item[1]}">${item[0]}</a>`
            }
            processedArray.push(linkHtml);
        }
    })
    return processedArray.join('')
}

// wiki記法でリンクになっている単語をクリックすると、自動で辞書を検索するようにする。
function activateClickSearch(results) {
    const links = results.querySelectorAll('.diqt-notation-link')
    const searchForm = document.querySelector('#diqt-dict-search-form');
    links.forEach(function (target) {
        target.addEventListener('click', function (event) {
            let keyword = event.target.dataset["value"];
            // 検索フォームのvalueとキーワードが異なるなら検索を実行する
            if (searchForm.value != keyword) {
                searchForm.value = keyword;
                searchWord(keyword);
            }
            // 画面遷移をキャンセル
            return false;
        });
    })
}

// 項目を読み上げさせる。
function enableTTS(results) {
    const speechBtns = results.querySelectorAll('.diqt-dict-speech-btn')
    // 事前に一度これを実行しておかないと、初回のvoice取得時に空配列が返されてvoiceがundefinedになってしまう。参考：https://www.codegrid.net/articles/2016-web-speech-api-1/
    speechSynthesis.getVoices()
    speechBtns.forEach(function (target) {
        target.addEventListener('click', function (event) {
            // 読み上げを止める。
            speechSynthesis.cancel();
            let speechTxt = target.previousElementSibling.textContent;
            let msg = new SpeechSynthesisUtterance();
            let voice = speechSynthesis.getVoices().find(function (voice) {
                return voice.name === "Samantha"
            });
            msg.voice = voice;
            msg.lang = 'en-US'; // en-US or ja-JP
            msg.volume = 1.0; // 音量 min 0 ~ max 1
            msg.rate = 1.0; // 速度 min 0 ~ max 10
            msg.pitch = 1.0; // 音程 min 0 ~ max 2
            msg.text = speechTxt; // 喋る内容
            // 発話実行
            speechSynthesis.speak(msg);
            // 画面遷移をキャンセル
            return false;
        });
    })
}

// タグのhtmlを作成する
/* function createTagsHtml(text) {
    if (text == null) {
        return `<div class="diqt-dict-word-tags-wrapper"></div>`
    }

    let tagsArray = text.split(',');
    let tagsHtmlArray = [];
    if (tagsArray.includes('ngsl')) {
        let ngsl = `<a href="https://www.diqt.net/ja/chapters/c63ab6e5" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>基礎英単語</a>`
        tagsHtmlArray.push(ngsl);
    }
    if (tagsArray.includes('nawl')) {
        let nawl = `<a href="https://www.diqt.net/ja/chapters/5cedf1da" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>学術頻出語</a>`
        tagsHtmlArray.push(nawl);
    }
    if (tagsArray.includes('tsl')) {
        let tsl = `<a href="https://www.diqt.net/ja/chapters/26c399f0" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>TOEIC頻出語</a>`
        tagsHtmlArray.push(tsl);
    }
    if (tagsArray.includes('bsl')) {
        let bsl = `<a href="https://www.diqt.net/ja/chapters/4d46ce7f" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>ビジネス頻出語</a>`
        tagsHtmlArray.push(bsl);
    }
    if (tagsArray.includes('phrase')) {
        let phrase = `<a href="https://www.diqt.net/ja/chapters/c112b566" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>頻出英熟語</a>`
        tagsHtmlArray.push(phrase);
    }
    if (tagsArray.includes('phave')) {
        let phave = `<a href="https://www.diqt.net/ja/chapters/3623e0d5" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>頻出句動詞</a>`
        tagsHtmlArray.push(phave);
    }
    return `<div class="diqt-dict-word-tags-wrapper">${tagsHtmlArray.join('')}</div>`
} */


// ユーザーがログインしているか検証し、ログイン済みならユーザー名を、そうでないならログインフォームへのリンクを表示する。
function renderUserStatus() {
    // contentScriptからリクエスト送ると、 リクエストのoriginが拡張を実行したサイトのものになるので、PostがCORSに防がれる。
    // そのため、content_scriptではなくbackgroundの固定originからリクエストを送るために、Message passingを利用する。
    // またone-time requestでは、レスポンスを受け取る前にportが閉じてしまうため、Long-lived connectionsを利用する。参照：https://developer.chrome.com/docs/extensions/mv3/messaging/
    let port = chrome.runtime.connect({ name: "inspectCurrentUser" });
    port.postMessage({ action: "inspectCurrentUser" });
    port.onMessage.addListener(function (msg) {
        let userData = document.querySelector('#diqt-dict-logged-in-user');
        let data = msg['data'];
        if (data) {
            chrome.storage.local.get(['diqtDictUserName'], function (result) {
                userData.innerHTML = `<i class="fal fa-user"></i> ${result.diqtDictUserName} / 設定`
            });
        } else {
            userData.innerHTML = '<i class="fal fa-user"></i> ログインする';
        }
        return true;
    });

    // ユーザーのステータス情報にoptions.htmlへのリンクを設定する。
    document.querySelector('#diqt-dict-logged-in-user').addEventListener('click', function () {
        // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
        let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
        rtnPromise.then((response) => { }).catch((error) => { });
    });

}


// テキストが選択されたとき、辞書ウィンドウが開いていないなら、辞書ウィンドウを開くためのポップアップを選択されたテキストの近くに表示する。
function displayPopupWhenSelected() {
    chrome.storage.local.get(['diqtDictPopupDisplayed'], function (result) {
        // 設定で表示がOFFになっている場合、あるいはユーザーがログインしていない場合は、ポップアップを表示しない
        if (result.diqtDictPopupDisplayed === false || result.diqtDictPopupDisplayed === '') {
            return;
        }

        const selection = () => {
            const dictWrapper = document.querySelector('#diqt-dict-extension-wrapper');
            const sel = window.getSelection();
            const selText = sel.toString();
            let popup = document.querySelector('#diqt-dict-popup-to-display-window');
            if (popup) {
                popup.remove();
            }
            if (dictWrapper == null && selText != '') {
                const sel = window.getSelection()
                const range = sel.getRangeAt(0)
                const textRange = document.createRange()

                // offsetが0だと -1 したときに429496729となりエラーが発生する。
                if (range.endOffset == 0) {
                    return;
                }
                textRange.setStart(range.endContainer, range.endOffset - 1)
                textRange.setEnd(range.endContainer, range.endOffset)
                const textRect = textRange.getBoundingClientRect();

                // テキストエリアでは選択位置の座標が取得できないので、ポップアップも表示しないようにする。
                if (textRect.top == 0 && textRect.left == 0) {
                    return;
                }
                // ページの上端から要素の上端までの距離（topPX）と、ページの左端から要素の左端までの距離（leftPx）を算出する / 参考: https://lab.syncer.jp/Web/JavaScript/Snippet/10/
                const topPx = window.pageYOffset + textRect.top + 32;
                const leftPx = window.pageXOffset + textRect.left;
                const popupHtml = `<button id="diqt-dict-popup-to-display-window" style="position: absolute; width: 32px; height: 32px; background-color: #273132; top: ${topPx}px; left: ${leftPx}px; z-index: 2147483647; border: 0; border-radius: 4px; padding: 0; margin: 0;">
                    <img src="https://kawanji.s3.ap-northeast-1.amazonaws.com/assets/diqt_logo.svg" alt="diqt Icon" style="height: 24px;width: 24px; margin: 4px 2px 2px 3px; padding: 0;">
                    </button>`
                const bodyElement = document.querySelector('html body');
                bodyElement.insertAdjacentHTML('beforeend', popupHtml);
                // popupに辞書ウィンドウを開くイベントを追加
                popup = document.querySelector('button#diqt-dict-popup-to-display-window');
                popup.addEventListener('click', function () {
                    toggleFloatingWindow();
                    popup.remove();
                });
            }
        }
        document.addEventListener('selectionchange', selection)


    });
}
