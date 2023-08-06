// import 文を使ってstyle.cssファイルを読み込む。参照：https://webpack.js.org/plugins/mini-css-extract-plugin/
// import './style.scss';
// 挫折：mini-css-extract-pluginを使って上記の方法でcssをimportしようとすると、JSframeが呼び出せなくなる。
import { JSFrame } from 'jsframe.js';
import { Review } from './review.js';
import { Word } from './word.js';

// const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
// const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
// const diqtUrl = `${process.env.ROOT_URL}/${locale}`;
// const premiumPlanUrl = `${diqtUrl}/plans/premium`;


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
        const jsFrame = new JSFrame({
            horizontalAlign: 'right'
        })

        const formHtml = `
        <div id="diqt-dict-extension-wrapper">
        <a>
        <div id="diqt-dict-logged-in-user" style="font-size: 10px;">　</div>
        </a>
        <div id="diqt-dict-dictionary-select-form-wrapper">　</div>
        <form method="get" action=""><input type="text" name="keyword" id="diqt-dict-search-form"></form>
        <div id="diqt-dict-search-status" style="text-align: left; color: #6e6e6e;">
        "<span id="diqt-dict-search-keyword" style="font-size: 12px;"></span>"<span id="diqt-dict-search-status-text"></span>
        </div>
        <div id="search-diqt-dict-results"></div>
        </div>`

        const frame = jsFrame.create({
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
            html: formHtml
        });
        frame.setPosition(-20, 100, ['RIGHT_TOP']);
        frame.show();
        const searchForm = document.querySelector('#diqt-dict-search-form');
        // ドラッグしたテキストを辞書で検索できるイベントを付与。
        mouseupSearch();
        // 検索フォームに、テキスト入力から検索できるイベントを付与。
        searchViaForm(searchForm);
        // 検索フォームへのエンターを無効にする。
        preventEnter(searchForm);
        // ウィンドウをページの最上部に持ってくる。
        extensionWrapper = frame.$('#diqt-dict-extension-wrapper');
        const frameDom = extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode;
        // z-indexを限界値に設定し、frameを最前面に表示する。
        frameDom.style.zIndex = '2147483647';
        // （ウィンドウを開いた瞬間に）画面の選択されているテキストを検索する
        searchSelectedText();
        // フォーム直上にユーザーステータス（ログイン状態など）を表示する。
        renderUserStatus();
    } else {
        const frameDom = extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode;
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
    const previousKeywordForm = document.querySelector('#diqt-dict-search-keyword');
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
        const searchForm = document.querySelector('#diqt-dict-search-form');
        if (searchForm) {
            searchForm.value = selTxt;
            searchWord(selTxt);
        }
    }
}


// 検索フォームの入力に応じて検索するイベントを付与。
function searchViaForm(form) {
    form.addEventListener('keyup', function () {
        const keyword = form.value
        const previousKeyword = document.querySelector('#diqt-dict-search-keyword').textContent;
        const search = () => {
            const currentKeyword = document.querySelector('#diqt-dict-search-form').value;
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
    const searchKeyword = document.querySelector('#diqt-dict-search-keyword');
    searchKeyword.textContent = keyword;
    if (keyword.length < 50 && keyword.length > 0) {
        document.querySelector('#diqt-dict-search-status-text').textContent = 'の検索結果';
    } else {
        document.querySelector('#diqt-dict-search-status-text').textContent = '';
    }
    // 検索結果をLoaderに変更して、検索中であることを示す。
    const resultForm = document.querySelector('#search-diqt-dict-results');
    resultForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
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
        searchSuccess(data);
        return true;
    });
}

function search() {
    const searchForm = document.querySelector('#diqt-dict-search-form');
    const keyword = searchForm.value;
    searchWord(keyword);
}

// 検索結果を表示する
function searchSuccess(data) {
    const resultForm = document.querySelector('#search-diqt-dict-results');
    resultForm.innerHTML = '';
    const words = data.words;
    const dictionary = data.dictionary;

    chrome.storage.local.get(['diqtUserPublicUid'], function (result) {
        const loginToken = result.diqtUserPublicUid;
        if (words != null) {
            words.forEach(function (word, index, array) {
                // 辞書の項目のHTMLを作成して、画面に挿入する
                const wordHtml = Word.createWordHtml(word, loginToken);
                resultForm.insertAdjacentHTML('beforeend', wordHtml);
                // 意味の翻訳ボタンのイベントを設定する。
                Word.setMeaningTranslation(word, loginToken);
                // 復習ボタンにイベントを設定する。
                Review.setEventsToReviewButtons(word, loginToken);
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

            // 翻訳ボタンを末尾に置き、イベントを付与
            const translationFrom = Word.createTranslationForm(loginToken);
            resultForm.insertAdjacentHTML('beforeend', translationFrom);
            Word.addEventToTranslationForm(loginToken, keyword);
            console.log('Add tranlsation');

        } else if (data.status == undefined) { // CORSエラーが発生した場合の処理
            /////// CORSエラーの再現方法 ////////
            // 1, アイコンのコンテキストメニューから「拡張機能を管理」へ飛ぶ。
            // 2, 拡張機能を一度OFFにしてから再びONにする。
            // 3, 適当なタブをリロードしてから、辞書を引く。
            // 4, エラー発生。内容：Access to fetch at '' from origin 'chrome-extension://gpddlaapalckciombdafdfpeakndmmeg' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
            const corsErrorHtml = `<div class="diqt-dict-meaning" style="margin: 24px 0;">大変申し訳ございません。辞書にアクセスできませんでした。<a id="diqt-dict-option-btn" style="color: #27ae60;">こちら</a>にアクセスした後、再び検索してください。</div>`
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

            const translationForm = Word.createTranslationForm(loginToken);
            const result = notFound + translationForm
            resultForm.insertAdjacentHTML('afterbegin', result);
            Word.addEventToTranslationForm(loginToken, keyword);
        }
    });


}





// ユーザーがログインしているか検証し、ログイン済みならユーザー名を、そうでないならログインフォームへのリンクを表示する。
function renderUserStatus() {
    // contentScriptからリクエスト送ると、 リクエストのoriginが拡張を実行したサイトのものになるので、PostがCORSに防がれる。
    // そのため、content_scriptではなくbackgroundの固定originからリクエストを送るために、Message passingを利用する。
    // またone-time requestでは、レスポンスを受け取る前にportが閉じてしまうため、Long-lived connectionsを利用する。参照：https://developer.chrome.com/docs/extensions/mv3/messaging/
    const port = chrome.runtime.connect({ name: "inspectCurrentUser" });
    port.postMessage({ action: "inspectCurrentUser" });
    port.onMessage.addListener(function (msg) {
        const userData = document.querySelector('#diqt-dict-logged-in-user');
        const dictionaryDate = document.querySelector('#diqt-dict-dictionary-select-form-wrapper');
        const data = msg['data'];
        if (data.status == 200) {
            chrome.storage.local.get(['diqtUserName', 'diqtDictionaries', 'diqtSelectedDictionaryId'], function (result) {
                userData.innerHTML = `<i class="fal fa-user"></i> ${result.diqtUserName} / 設定`
                // 辞書フォームの作成＆表示
                dictionaryDate.innerHTML = createDictionarySelectForm(result.diqtDictionaries, result.diqtSelectedDictionaryId);
                addEventToSelectForm();
            });
        } else {
            userData.innerHTML = '<i class="fal fa-user"></i> ログインする';
        }
        return true;
    });

    // ユーザーのステータス情報にoptions.htmlへのリンクを設定する。
    document.querySelector('#diqt-dict-logged-in-user').addEventListener('click', function () {
        // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
        const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
        rtnPromise.then((response) => { }).catch((error) => { });
    });

}



// 辞書のセレクトフォームを作成
function createDictionarySelectForm(dictionaries, value) {
    let dictionaryId = value;
    console.log(dictionaryId);
    // 辞書のセレクトフォームの初期値を設定
    if (dictionaryId == '' || dictionaryId == undefined) {
        dictionaryId = 1;
        chrome.storage.local.set({ diqtSelectedDictionaryId: `${dictionaryId}` });
    }
    dictionaryId = Number(dictionaryId);
    const dictionaryAry = JSON.parse(dictionaries);
    const optionsHtml = dictionaryAry.map(item => createOption(item, dictionaryId)).join('');
    return `<select id="diqt-dictionary-select-form">
                ${optionsHtml}
            </select>`
}
// 辞書のセレクトフォームのオプションを作成
function createOption(item, value) {
    // item[0] は配列の最初の要素（value属性のためのもの）として想定されます。
    // item[1] は配列の2番目の要素（表示テキストとして想定される）として想定されます。
    const isSelected = item[0] === value ? 'selected' : '';
    return `<option value="${item[0]}" class="diqt-dictionary-select-option" ${isSelected}>${item[1]}</option>`;
}

// 辞書の切り替え
function addEventToSelectForm() {
    let selectForm = document.getElementById('diqt-dictionary-select-form');
    let setDictionaryId = function (event) {
        let selectedDictionaryId = `${event.currentTarget.value}`
        chrome.storage.local.set({ diqtSelectedDictionaryId: selectedDictionaryId });
        search();
    }
    selectForm.addEventListener('change', setDictionaryId);
}


// テキストが選択されたとき、辞書ウィンドウが開いていないなら、辞書ウィンドウを開くためのポップアップを選択されたテキストの近くに表示する。
function displayPopupWhenSelected() {
    chrome.storage.local.get(['diqtPopupDisplayed'], function (result) {
        // 設定で表示がOFFになっている場合、あるいはユーザーがログインしていない場合は、ポップアップを表示しない
        if (result.diqtPopupDisplayed === false || result.diqtPopupDisplayed === '') {
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
                    <img src="https://diqt.s3.ap-northeast-1.amazonaws.com/assets/images/main/diqt_logo.svg" alt="diqt Icon" style="height: 24px;width: 24px; margin: 4px 2px 2px 3px; padding: 0;">
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
