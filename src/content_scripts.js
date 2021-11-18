// 動かねえ：参照：https://github.com/riversun/JSFrame.js#using-npm-module-with-webpack
// import { JSFrame } from './jsframe.js';
// import './jsframe.js';
// import 文を使ってstyle.cssファイルを読み込む。参照：https://webpack.js.org/plugins/mini-css-extract-plugin/
// import './style.scss';
// 挫折：mini-css-extract-pluginを使って上記の方法でcssをimportしようとすると、JSframeが呼び出せなくなる。



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
});

// 辞書ウィンドウの表示/非表示を切り替える。
function toggleFloatingWindow() {
    let extensionWrapper = document.getElementById('booqs-dict-extension-wrapper');
    if (extensionWrapper == null) {
        jsFrame = new JSFrame({
            horizontalAlign: 'right'
        })

        const form_html = `
        <div id="booqs-dict-extension-wrapper">
        <a>
        <div id="booqs-dict-logged-in-user" style="font-size: 10px;">　</div>
        </a>
        <form method="get" action=""><input type="text" name="keyword" id="booqs-dict-search-form"></form>
        <div id="booqs-dict-search-status">
        "<span id="booqs-dict-search-keyword" style="font-size: 12px;"></span>"<span id="booqs-dict-search-status-text"></span>
        </div>
        <div id="search-booqs-dict-results"></div>
        </div>`

        let frame = jsFrame.create({
            name: 'booqs-dict-window',
            title: 'BooQs',
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
                    name: 'booqs-dict-window-bar',
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
        let searchForm = document.querySelector('#booqs-dict-search-form');
        // ドラッグしたテキストを辞書で検索できるイベントを付与。
        mouseupSearch();
        // 検索フォームに、テキスト入力から検索できるイベントを付与。
        searchViaForm(searchForm);
        // 検索フォームへのエンターを無効にする。
        preventEnter(searchForm);
        // ウィンドウをページの最上部に持ってくる。
        extensionWrapper = frame.$('#booqs-dict-extension-wrapper');
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
    let previousKeywordForm = document.querySelector('#booqs-dict-search-keyword');
    let previousKeyword;
    if (previousKeywordForm) {
        previousKeyword = previousKeywordForm.textContent;
    } else {
        previousKeyword = '';
    }
    if (selTxt.length >= 1000) {
        document.querySelector('#search-booqs-dict-results').innerHTML = `<p style="color: #EE5A5A; font-size: 12px;">検索できるのは1000文字未満までです。</p>`
        return;
    }
    // 検索フォーム
    if (selTxt != '' && previousKeyword != selTxt && selTxt.length < 1000) {
        let searchForm = document.querySelector('#booqs-dict-search-form');
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
        let previousKeyword = document.querySelector('#booqs-dict-search-keyword').textContent;
        const search = () => {
            let currentKeyword = document.querySelector('#booqs-dict-search-form').value;
            if (keyword == currentKeyword && keyword != previousKeyword && keyword.length < 1000) {
                searchWord(keyword);
            } else if (keyword.length >= 1000) {
                // コピペで1000文字以上フォームに入力された場合にエラーを表示する。
                document.querySelector('#search-booqs-dict-results').innerHTML = `<p style="color: #EE5A5A; font-size: 12px;">検索できるのは1000文字未満までです。</p>`
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


// keywordをBooQsの辞書で検索する
function searchWord(keyword) {
    // 検索キーワードを更新する
    let searchKeyword = document.querySelector('#booqs-dict-search-keyword');
    searchKeyword.textContent = keyword;
    if (keyword.length < 50 && keyword.length > 0) {
        document.querySelector('#booqs-dict-search-status-text').textContent = 'の検索結果';
    } else {
        document.querySelector('#booqs-dict-search-status-text').textContent = '';
    }
    // 検索結果をLoaderに変更して、検索中であることを示す。
    let resultForm = document.querySelector('#search-booqs-dict-results');
    resultForm.innerHTML = `<div class="center"><div class="lds-ripple-booqs-dict"><div></div><div></div></div></div>`;
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
    });
}

// 検索結果を表示する
function searchSuccess(data) {
    let resultForm = document.querySelector('#search-booqs-dict-results');
    resultForm.innerHTML = '';
    chrome.storage.local.get(['booqsDictToken'], function (result) {
        let loginToken = result.booqsDictToken
        console.log(data);
        if (data['data'] != null) {
            data['data'].forEach(function (item, index, array) {
                let tags = createTagsHtml(item['tags']);
                let wordURL = `https://www.booqs.net/ja/words/${item['id']}`
                let entry = `<div class="booqs-dict-entry">
                <span>${item['entry']}</span><button class="booqs-dict-speech-btn"><i class="fas fa-volume-up"></i></button>
                <a href="${wordURL}" target="_blank" rel="noopener" style="color: #6e6e6e;"><i class="far fa-external-link-alt" style="float: right; margin-top: 4px; margin-right: 8px;"></i></a>
                </div>`;
                let meaning = '<div class="booqs-dict-meaning">' + item['meaning'] + '</div>';
                let explanation = '<div class="booqs-dict-explanation">' + markNotation(item['explanation']) + '</div>'
                let reviewBtn;
                if (loginToken) {
                    reviewBtn = `<div class="booqs-dict-async-review-btn booqs-dict-review-btn" id="booqs-dict-review-${item['id']}" style="font-weight: bold;">復習する</div><div class="booqs-dict-review-form" id="booqs-dict-review-form-${item['id']}"></div>`
                } else {
                    reviewBtn = `<div class="booqs-dict-review-btn" id="booqs-dict-review-btn-${item['id']}" style="font-weight: bold;">復習する</div></a>`
                }
                let linkToImprove = `<a href="${wordURL + '/edit'}" target="_blank" rel="noopener" class="booqs-dict-link-to-improve">この項目を改善する</a>`
                let dict = tags + entry + meaning + explanation + reviewBtn + linkToImprove;
                resultForm.insertAdjacentHTML('beforeend', dict);

                // ログインしていた場合に、拡張内で非同期で復習を設定できるようにする。
                if (loginToken) {
                    asyncReviewReviewSetting(loginToken, item['id']);
                } else {
                    const reviewLink = document.querySelector(`#booqs-dict-review-btn-${item['id']}`);
                    // options.htmlへのリンクを設定する。
                    reviewLink.addEventListener('click', function () {
                        // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                        chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                    });
                }
            });
            // 解説のクリックサーチを有効にする
            activateClickSearch(resultForm);
            // 項目の読み上げを有効にする。
            enableTTS(resultForm);
        } else if (data.status == undefined) { // CORSエラーが発生した場合の処理
            /////// CORSエラーの再現方法 ////////
            // 1, アイコンのコンテキストメニューから「拡張機能を管理」へ飛ぶ。
            // 2, 拡張機能を一度OFFにしてから再びONにする。
            // 3, 適当なタブをリロードしてから、辞書を引く。
            // 4, エラー発生。内容：Access to fetch at 'https://www.booqs.net/api/v1/extension/search_word' from origin 'chrome-extension://gpddlaapalckciombdafdfpeakndmmeg' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
            let corsErrorHtml = `<div class="booqs-dict-meaning" style="margin: 24px 0;">大変申し訳ございません。辞書にアクセスできませんでした。<a id="booqs-dict-option-btn" style="color: #27ae60;">こちら</a>にアクセスした後、再び検索してください。</div>`
            resultForm.insertAdjacentHTML('afterbegin', corsErrorHtml);
            // 5, なぜかこのCORSのエラーは、一度option画面（chrome-extension://gpddlaapalckciombdafdfpeakndmmeg/options.html）にアクセスすると治るので、option画面へのリンクを設置する。
            let optionBtn = document.querySelector('#booqs-dict-option-btn');
            optionBtn.addEventListener('click', function () {
                chrome.runtime.sendMessage({ "action": "openOptionsPage" });
            });
        } else {
            let keyword = document.querySelector('#booqs-dict-search-keyword').textContent;
            keyword = keyword.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            let notFound;
            let createNewWord;
            if (keyword.length < 50 && keyword.length > 0) {
                notFound = `<div class="booqs-dict-meaning" style="margin: 24px 0;">${keyword}は辞書に登録されていません。</div>`
                createNewWord = `<a href="https://www.booqs.net/ja/words/new?dict_uid=c6bbf748&text=${keyword}" target="_blank" rel="noopener" style="text-decoration: none;">
                <div class="booqs-dict-review-btn" style="font-weight: bold;">辞書に登録する</div></a>`
            } else {
                notFound = ``;
                createNewWord = ``;
            }
            let translationForm;
            if (loginToken) {
                translationForm = `<div id="booqs-dict-translation-form">
                <div id="booqs-dict-google-translation"><div class="booqs-dict-review-btn" style="font-weight: bold;">Googleで翻訳する</div></div>
                <div id="booqs-dict-deepl-translation"><div class="booqs-dict-review-btn" style="font-weight: bold;">DeepLで翻訳する</div></div>
                </div>`
            } else {
                translationForm = `<div id="booqs-dict-translation-form">
                <div id="booqs-dict-google-translation"><div class="booqs-dict-review-btn" style="font-weight: bold;">Googleで翻訳する</div></div>
                <div id="booqs-dict-deepl-translation"><div class="booqs-dict-review-btn" style="font-weight: bold;">DeepLで翻訳する</div></div>
                <p><a id="booqs-dict-login-for-translation" style="color: #27ae60;">ログイン</a>することで、機械翻訳が利用できるようになります。</p>
                </div>`
            }
            let result = notFound + createNewWord + translationForm
            resultForm.insertAdjacentHTML('afterbegin', result);
            addEventToTranslationForm(loginToken, keyword);
        }
    });


}

// 翻訳フォームにイベントを付与
function addEventToTranslationForm(loginToken, keyword) {
    const googleTranslationForm = document.querySelector('#booqs-dict-google-translation');
    const deeplTranslationForm = document.querySelector('#booqs-dict-deepl-translation');
    if (loginToken) {
        // Google翻訳
        googleTranslationForm.addEventListener('click', function () {
            googleTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-booqs-dict"><div></div><div></div></div></div>`;
            let port = chrome.runtime.connect({ name: "googleTranslation" });
            port.postMessage({ action: "googleTranslation", keyword: keyword });
            port.onMessage.addListener(function (msg) {
                let data = msg['data'];
                if (data['status'] == "200") {
                    let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>Google翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                    googleTranslationForm.innerHTML = translation;
                } else {
                    let message = `<p style="margin: 24px 0;"><a href="https://www.booqs.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                    googleTranslationForm.innerHTML = message;
                }
            });
        });
        // DeepL翻訳
        deeplTranslationForm.addEventListener('click', function () {
            deeplTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-booqs-dict"><div></div><div></div></div></div>`;
            let deeplPort = chrome.runtime.connect({ name: "deeplTranslation" });
            deeplPort.postMessage({ action: "deeplTranslation", keyword: keyword });
            deeplPort.onMessage.addListener(function (msg) {
                let data = msg['data'];
                if (data['status'] == "200") {
                    let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>DeepL翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                    deeplTranslationForm.innerHTML = translation;
                } else {
                    let message = `<p style="margin: 24px 0;"><a href="https://www.booqs.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                    deeplTranslationForm.innerHTML = message;
                }
            });
        });

    } else {
        // options.htmlへのリンクを設定する。
        googleTranslationForm.addEventListener('click', function () {
            // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
            chrome.runtime.sendMessage({ "action": "openOptionsPage" });
        });
        deeplTranslationForm.addEventListener('click', function () {
            chrome.runtime.sendMessage({ "action": "openOptionsPage" });
        });
        const loginBtn = document.querySelector('#booqs-dict-login-for-translation');
        loginBtn.addEventListener('click', function () {
            chrome.runtime.sendMessage({ "action": "openOptionsPage" });
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
                linkHtml = `<a class="booqs-notation-link" data-value="${item[0]}">${item[0]}</a>`
            } else {
                linkHtml = `<a class="booqs-notation-link" data-value="${item[1]}">${item[0]}</a>`
            }
            processedArray.push(linkHtml);
        }
    })
    return processedArray.join('')
}

// wiki記法でリンクになっている単語をクリックすると、自動で辞書を検索するようにする。
function activateClickSearch(results) {
    const links = results.querySelectorAll('.booqs-notation-link')
    const searchForm = document.querySelector('#booqs-dict-search-form');
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
    const speechBtns = results.querySelectorAll('.booqs-dict-speech-btn')
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
function createTagsHtml(text) {
    if (text == null) {
        return `<div class="booqs-dict-word-tags-wrapper"></div>`
    }

    let tagsArray = text.split(',');
    let tagsHtmlArray = [];
    if (tagsArray.includes('ngsl')) {
        let ngsl = `<a href="https://www.booqs.net/ja/chapters/c63ab6e5" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>基礎英単語</a>`
        tagsHtmlArray.push(ngsl);
    }
    if (tagsArray.includes('nawl')) {
        let nawl = `<a href="https://www.booqs.net/ja/chapters/5cedf1da" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>学術頻出語</a>`
        tagsHtmlArray.push(nawl);
    }
    if (tagsArray.includes('tsl')) {
        let tsl = `<a href="https://www.booqs.net/ja/chapters/26c399f0" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>TOEIC頻出語</a>`
        tagsHtmlArray.push(tsl);
    }
    if (tagsArray.includes('bsl')) {
        let bsl = `<a href="https://www.booqs.net/ja/chapters/4d46ce7f" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>ビジネス頻出語</a>`
        tagsHtmlArray.push(bsl);
    }
    if (tagsArray.includes('phrase')) {
        let phrase = `<a href="https://www.booqs.net/ja/chapters/c112b566" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>頻出英熟語</a>`
        tagsHtmlArray.push(phrase);
    }
    if (tagsArray.includes('phave')) {
        let phave = `<a href="https://www.booqs.net/ja/chapters/3623e0d5" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>頻出句動詞</a>`
        tagsHtmlArray.push(phave);
    }
    return `<div class="booqs-dict-word-tags-wrapper">${tagsHtmlArray.join('')}</div>`
}


// ユーザーがログインしているか検証し、ログイン済みならユーザー名を、そうでないならログインフォームへのリンクを表示する。
function renderUserStatus() {
    // contentScriptからリクエスト送ると、 リクエストのoriginが拡張を実行したサイトのものになるので、PostがCORSに防がれる。
    // そのため、content_scriptではなくbackgroundの固定originからリクエストを送るために、Message passingを利用する。
    // またone-time requestでは、レスポンスを受け取る前にportが閉じてしまうため、Long-lived connectionsを利用する。参照：https://developer.chrome.com/docs/extensions/mv3/messaging/
    let port = chrome.runtime.connect({ name: "inspectCurrentUser" });
    port.postMessage({ action: "inspectCurrentUser" });
    port.onMessage.addListener(function (msg) {
        let userData = document.querySelector('#booqs-dict-logged-in-user');
        let data = msg['data'];
        if (data) {
            chrome.storage.local.get(['booqsDictUserName'], function (result) {
                userData.innerHTML = `<i class="fal fa-user"></i> ${result.booqsDictUserName}`
            });
        } else {
            userData.innerHTML = '<i class="fal fa-user"></i> ログインする';
        }
    });

    // ユーザーのステータス情報にoptions.htmlへのリンクを設定する。
    document.querySelector('#booqs-dict-logged-in-user').addEventListener('click', function () {
        // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
        chrome.runtime.sendMessage({ "action": "openOptionsPage" });
    });

}

/////// 復習設定関係の処理 ///////
// 拡張内で非同期で設定できる復習メニューを表示する
function asyncReviewReviewSetting(loginToken, wordId) {
    let reviewBtn = document.querySelector("#booqs-dict-review-" + wordId);
    let reviewForm = reviewBtn.nextSibling;
    reviewBtn.addEventListener('click', function () {
        reviewForm.innerHTML = `<div class="center"><div class="lds-ripple-booqs-dict"><div></div><div></div></div></div>`;
        renderReviewForm(wordId);
    });
};

// 復習設定フォームをレンダリングする。
function renderReviewForm(wordId) {
    let reviewForm = document.querySelector("#booqs-dict-review-form-" + wordId);
    let port = chrome.runtime.connect({ name: "renderReviewForm" });
    port.postMessage({ action: "renderReviewForm", wordId: wordId });
    port.onMessage.addListener(function (msg) {
        let response = msg.data;
        if (response.status == '401') {
            reviewForm.innerHTML = `<p style="font-size: 12px; margin: 16px 0; color: #ee5a5aff;">${response.message}</p>`
        } else {
            let data = response.data;
            reviewForm.innerHTML = reviewFormHtml(data);
            addEventToForm(data);
        }
    });
}

// 復習設定フォームのHTMLを返す関数。
function reviewFormHtml(data) {
    let wordId = data.word_id;
    let html;
    if (data.reminder_id) {
        html = `
        <div class="boqqs-dict-reminder-status">
        <p>復習予定：${data.review_day}</p>
        <p>復習設定：${reviewInterval(data.setting)}に復習する</p>  
        <div class="booqs-dict-destroy-review-btn" id="booqs-dict-destroy-review-btn-${wordId}"><i class="far fa-trash"></i> 復習設定を削除する</div>
        </div>      
<div class="booqs-dict-select-form cp_sl01">
<select id="booqs-dict-select-form-${wordId}" style="height: 32px;" required>
	${createOptions(data)}
</select>
</div>
<button class="booqs-dict-submit-review-btn" id="booqs-dict-update-review-btn-${wordId}">設定する</button>
<div class="booqs-dict-recommend-premium" id="booqs-dict-recommend-premium-${wordId}"></div>`
    } else {
        html = `      
<div class="booqs-dict-select-form cp_sl01">
<select id="booqs-dict-select-form-${wordId}" style="height: 32px;" required>
	${createOptions(data)}
</select>
</div>
<button class="booqs-dict-submit-review-btn" id="booqs-dict-create-review-btn-${wordId}">設定する</button>
<div class="booqs-dict-recommend-premium" id="booqs-dict-recommend-premium-${wordId}"></div>`
    }
    return html;
}

// settingの番号を復習間隔に変換する関数
function reviewInterval(setting) {
    setting = Number(setting);
    let interval = '';
    switch (setting) {
        case 0:
            interval = `明日`;
            break;
        case 1:
            interval = '3日後';
            break;
        case 2:
            interval = '１週間後';
            break;
        case 3:
            interval = '２週間後';
            break;
        case 4:
            interval = '３週間後';
            break;
        case 5:
            interval = '１ヶ月後';
            break;
        case 6:
            interval = '２ヶ月後';
            break;
        case 7:
            interval = '３ヶ月後';
            break;
        case 8:
            interval = '６ヶ月後';
            break;
        case 9:
            interval = '1年後';
            break
    }
    return interval;
}

// 復習間隔を選択するためのoptionを作成する関数
function createOptions(data) {
    let selectedNumber = 0;
    if (data.setting) {
        selectedNumber = Number(data.setting);
    }
    let html = ``
    for (let i = 0; i < 10; i++) {
        let icon = '';
        if (i != 0 && data.premium == 'false') {
            icon = '🔒 '
        }
        if (i == selectedNumber) {
            html = html + `<option value="${i}" selected>${icon}${reviewInterval(i)}に復習する</option>`
        } else {
            html = html + `<option value="${i}">${icon}${reviewInterval(i)}に復習する</option>`
        }
    }
    return html
}

// 復習設定フォームにイベントを設定する。
function addEventToForm(data) {
    let wordId = data.word_id;
    let quizId = data.quiz_id;
    if (data.reminder_id) {
        // 復習設定を更新するための設定
        updateReviewSetting(wordId, quizId);
        // 復習設定を削除するための設定
        destroyReviewSetting(wordId, quizId);
    } else {
        // 復習設定を新規作成するための設定
        createReviewSetting(wordId, quizId);
    }

    if (data.premium == 'false') {
        // 有料機能にロックをかける。また無料会員がプレミアム会員向けのoptionを選択したときにプレミアムプランを紹介する。
        recommendPremium(wordId);
    }
}

// 復習設定を新規作成する
function createReviewSetting(wordId, quizId) {
    let submitBtn = document.querySelector("#booqs-dict-create-review-btn-" + wordId);
    submitBtn.addEventListener('click', function () {
        submitBtn.textContent = '設定中...'
        let settingNumber = document.querySelector("#booqs-dict-select-form-" + wordId).value;
        let port = chrome.runtime.connect({ name: "createReminder" });
        port.postMessage({ action: "createReminder", quizId: quizId, settingNumber: settingNumber });
        port.onMessage.addListener(function (msg) {
            let response = msg.data
            if (response.status == '401') {
                submitBtn.textContent = response.message;
                return
            }
            let data = response.data;
            let reviewForm = document.querySelector("#booqs-dict-review-form-" + data.word_id);
            reviewForm.innerHTML = ''
            let reviewBtn = reviewForm.previousSibling;
            reviewBtn.textContent = `${reviewInterval(data.setting)}に復習する`
        });
    });
}

// 復習設定を更新する
function updateReviewSetting(wordId, quizId) {
    let submitBtn = document.querySelector("#booqs-dict-update-review-btn-" + wordId);
    submitBtn.addEventListener('click', function () {
        submitBtn.textContent = '設定中...'
        let settingNumber = document.querySelector("#booqs-dict-select-form-" + wordId).value;
        let port = chrome.runtime.connect({ name: "updateReminder" });
        port.postMessage({ action: "updateReminder", quizId: quizId, settingNumber: settingNumber });
        port.onMessage.addListener(function (msg) {
            let response = msg.data
            if (response.status == '401') {
                submitBtn.textContent = response.message;
                return
            }
            let data = response.data;
            let reviewForm = document.querySelector("#booqs-dict-review-form-" + data.word_id);
            reviewForm.innerHTML = '';
            let reviewBtn = reviewForm.previousSibling;
            reviewBtn.textContent = `${reviewInterval(data.setting)}に復習する`
        });
    });
}

// 復習設定を削除する
function destroyReviewSetting(wordId, quizId) {
    let deleteBtn = document.querySelector(`#booqs-dict-destroy-review-btn-${wordId}`);
    deleteBtn.addEventListener('click', function () {
        deleteBtn.textContent = '設定中...';
        let port = chrome.runtime.connect({ name: "destroyReminder" });
        port.postMessage({ action: "destroyReminder", quizId: quizId });
        port.onMessage.addListener(function (msg) {
            let response = msg.data;
            if (response.status == '401') {
                deleteBtn.textContent = response.message;
                return
            }
            let data = response.data;
            let reviewForm = document.querySelector("#booqs-dict-review-form-" + data.word_id);
            reviewForm.innerHTML = '';
            let reviewBtn = reviewForm.previousSibling;
            reviewBtn.textContent = `復習する`
        });
    });
}

// プレミアム会員向けのoptionが選択されたときに、プレミアムプラン説明ページへのリンクを表示する。
function recommendPremium(wordId) {
    const textWrapper = document.querySelector(`#booqs-dict-recommend-premium-${wordId}`);
    const submitBtn = textWrapper.previousElementSibling;
    const select = document.querySelector(`#booqs-dict-select-form-${wordId}`);
    let settingNumber = Number(select.value);
    const recommendationHtml = `<p>プレミアム会員になることで、復習を自由に設定できるようになります！</p>
    <p><a href="https://www.booqs.net/ja/select_plan" target="_blank" rel="noopener"><i class="far fa-crown"></i> プレミアムプランの詳細を見る</a></p>`

    if (settingNumber != 0) {
        submitBtn.classList.add("hidden");
        textWrapper.innerHTML = recommendationHtml;
    }

    select.addEventListener('change', function () {
        settingNumber = Number(this.value);
        if (settingNumber == 0) {
            submitBtn.classList.remove("hidden");
            textWrapper.innerHTML = '';
        } else {
            submitBtn.classList.add("hidden");
            textWrapper.innerHTML = recommendationHtml;
        }
    });
}


// テキストが選択されたとき、辞書ウィンドウが開いていないなら、辞書ウィンドウを開くためのポップアップを選択されたテキストの近くに表示する。
function displayPopupWhenSelected() {
    chrome.storage.local.get(['booqsDictPopupDisplayed'], function (result) {
        // 設定で表示がOFFになっている場合、あるいはユーザーがログインしていない場合は、ポップアップを表示しない
        if (result.booqsDictPopupDisplayed === false || result.booqsDictPopupDisplayed === '') {
            return;
        }

        const selection = () => {
            const dictWrapper = document.querySelector('#booqs-dict-extension-wrapper');
            const sel = window.getSelection();
            const selText = sel.toString();
            let popup = document.querySelector('#booqs-dict-popup-to-display-window');
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
                const popupHtml = `<button id="booqs-dict-popup-to-display-window" style="position: absolute; width: 32px; height: 32px; background-color: #273132; top: ${topPx}px; left: ${leftPx}px; z-index: 2147483647; border: 0; border-radius: 4px; padding: 0; margin: 0;">
                    <img src="https://kawanji.s3.ap-northeast-1.amazonaws.com/assets/BooQs_logo.svg" alt="BooQs Icon" style="height: 24px;width: 24px; margin: 4px 2px 2px 3px; padding: 0;">
                    </button>`
                const bodyElement = document.querySelector('html body');
                bodyElement.insertAdjacentHTML('beforeend', popupHtml);
                // popupに辞書ウィンドウを開くイベントを追加
                popup = document.querySelector('button#booqs-dict-popup-to-display-window');
                popup.addEventListener('click', function () {
                    toggleFloatingWindow();
                    popup.remove();
                });
            }
        }
        document.addEventListener('selectionchange', selection)


    });
}