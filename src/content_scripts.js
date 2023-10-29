// import 文を使ってstyle.cssファイルを読み込む。参照：https://webpack.js.org/plugins/mini-css-extract-plugin/
// import './style.scss';
// 挫折：mini-css-extract-pluginを使って上記の方法でcssをimportしようとすると、JSframeが呼び出せなくなる。
import { JSFrame } from 'jsframe.js';
import { Searcher } from './searcher.js';


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
        <div id="diqt-dict-logged-in-user" style="font-size: 10px;">Loading...</div>
        </a>
        <div id="diqt-dict-dictionary-select-form-wrapper">Loading...</div>
        <form method="get" action=""><input type="text" name="keyword" id="diqt-dict-search-form" placeholder="${chrome.i18n.getMessage("searchPlaceholder")}"></form>
        <div id="diqt-dict-search-status">
            <div>${chrome.i18n.getMessage("searchContent")}:</div>
            "<span id="diqt-dict-search-keyword"></span>"
            <div id="diqt-dict-keyword-translation-wrapper"></div>
            <div id="diqt-dict-ai-search-wrapper"></div>
        </div>
        <div id="search-diqt-dict-results"></div>
        </div>`

        const frame = jsFrame.create({
            name: 'diqt-dict-window',
            title: chrome.i18n.getMessage("ctrlQ"),
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
        // ウィンドウをページの最上部に持ってくる。
        extensionWrapper = frame.$('#diqt-dict-extension-wrapper');
        const frameDom = extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode;
        // z-indexを限界値に設定し、frameを最前面に表示する。
        frameDom.style.zIndex = '2147483647';
        chrome.storage.local.get(['diqtUserPublicUid'], function (result) {
            if (result.diqtUserPublicUid) {
                // ログイン情報がローカルストレージにある場合は、検索イベントを付与して、可能なら検索を実行する。
                Searcher.inilialize();
                // フォーム直上にユーザーステータス（ログイン状態など）を表示する。
                renderUserStatus();
            } else {
                // ログイン情報がローカルストレージにない場合は、APIにリクエストを送り、ログイン情報を取得する。
                renderUserStatus();
            }
        });


    } else {
        const frameDom = extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode;
        frameDom.remove()
    }

}





// ユーザーがログインしているか検証し、ログイン済みならユーザー名を、そうでないならログインフォームへのリンクを表示する。
function renderUserStatus() {
    // contentScriptからリクエスト送ると、 リクエストのoriginが拡張を実行したサイトのものになるので、PostがCORSに防がれる。
    // そのため、content_scriptではなくbackgroundの固定originからリクエストを送るために、Message passingを利用する。
    // またone-time requestでは、レスポンスを受け取る前にportが閉じてしまうため、Long-lived connectionsを利用する。参照：https://developer.chrome.com/docs/extensions/mv3/messaging/
    const port = chrome.runtime.connect({ name: "inspectCurrentUser" });
    port.postMessage({ action: "inspectCurrentUser" });
    port.onMessage.addListener(function (msg) {
        const data = msg['data'];
        if (data.status == 200) {
            // ログイン時の処理
            chrome.storage.local.get(['diqtUserName', 'diqtDictionaries', 'diqtSelectedDictionaryId'], function (result) {
                loggedInUser(result.diqtUserName, result.diqtDictionaries, result.diqtSelectedDictionaryId);
            });
        } else if (data.status == 401) {
            // 未ログイン時の処理
            notLoggedInUser();
        } else {
            // その他のエラー時の処理
            const userData = document.querySelector('#diqt-dict-logged-in-user');
            userData.innerHTML = `<i class="fal fa-user"></i> Error`
            const dictionaryDate = document.querySelector('#diqt-dict-dictionary-select-form-wrapper');
            dictionaryDate.innerHTML = `<p>${chrome.i18n.getMessage("statusError")}</p>`
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

// ログイン時の処理
function loggedInUser(userName, dictionaries, selectedDictionaryId) {
    // ユーザーステータスを更新
    const userData = document.querySelector('#diqt-dict-logged-in-user');
    userData.innerHTML = `<i class="fal fa-user"></i> ${userName} / ${chrome.i18n.getMessage("settings")}`
    // 辞書フォームの作成＆表示
    const dictionaryDate = document.querySelector('#diqt-dict-dictionary-select-form-wrapper');
    dictionaryDate.innerHTML = createDictionarySelectForm(dictionaries, selectedDictionaryId);
    addEventToSelectForm();
}

// 未ログイン時の処理
function notLoggedInUser() {
    // ユーザーステータスを更新
    const page = document.querySelector('#diqt-dict-extension-wrapper');
    page.innerHTML = `<p style="font-size: 16px;">${chrome.i18n.getMessage("signInRecommendation")}</p><button class="diqt-dict-submit-review-btn" id="diqt-dict-sign-in-btn">${chrome.i18n.getMessage("signIn")}</button>`;
    document.querySelector('#diqt-dict-sign-in-btn').addEventListener('click', function () {
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
    console.log(dictionaries);
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
    console.log(`item[0]: ${item[0]} / item[1]: ${item[1]}`);
    return `<option value="${item[0]}" class="diqt-dictionary-select-option" ${isSelected}>${item[1]}</option>`;
}

// 辞書の切り替え
function addEventToSelectForm() {
    let selectForm = document.getElementById('diqt-dictionary-select-form');
    let setDictionaryId = function (event) {
        let selectedDictionaryId = `${event.currentTarget.value}`
        chrome.storage.local.set({ diqtSelectedDictionaryId: selectedDictionaryId });
        // 辞書の切り替え時に検索を実行する。
        Searcher.search();
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
        document.addEventListener('selectionchange', selection);
    });
}
