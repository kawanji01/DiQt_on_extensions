// import 文を使ってstyle.cssファイルを読み込む。参照：https://webpack.js.org/plugins/mini-css-extract-plugin/
// import './style.scss';
// 挫折：mini-css-extract-pluginを使って上記の方法でcssをimportしようとすると、JSframeが呼び出せなくなる。
import { JSFrame } from 'jsframe.js';
import { Searcher } from './searcher.js';

const POPUP_ID = 'diqt-dict-popup-to-display-window';
const POPUP_LOGO_URL = 'https://diqt.s3.ap-northeast-1.amazonaws.com/assets/images/main/diqt_logo.svg';

let popupEnabled = true;
let popupControllerInitialized = false;
let popupButton = null;
let popupUpdateRequestId = null;
let suppressNextPopupUpdate = false;
let suppressPopupKeyupUntilCtrlRelease = false;

// Backgroundからタブに送られたメッセージを受信し、タブ内でメッセージに応じた処理を実行する。
chrome.runtime.onMessage.addListener(function (request) {
    switch (request) {
        case "Action":
            // アイコンを押したときに、辞書ウィンドウの表示/非表示を切り替える。/ manifest 3 では書き方に変更があった。参照：https://blog.holyblue.jp/entry/2021/05/03/105010
            toggleFloatingWindow();
            break;
        default:
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
                if (document.getElementById('diqt-dict-extension-wrapper')) {
                    suppressPopupKeyupUntilCtrlRelease = true;
                    cancelScheduledPopupUpdate();
                    hideSelectionPopup();
                }
                toggleFloatingWindow();
                break;
            default:
                break;
        }
    }
});

initializePopupController();

// 辞書ウィンドウの表示/非表示を切り替える。
function toggleFloatingWindow() {
    let extensionWrapper = document.getElementById('diqt-dict-extension-wrapper');
    if (extensionWrapper == null) {
        hideSelectionPopup();

        const jsFrame = new JSFrame({
            horizontalAlign: 'right'
        });

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
        </div>`;

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
        frame.on('closeButton', 'mousedown', function () {
            suppressNextPopupUpdate = true;
            cancelScheduledPopupUpdate();
            hideSelectionPopup();
        });
        frame.on('closeButton', 'click', function () {
            suppressNextPopupUpdate = false;
            Searcher.cleanupSelectionSearch();
            cancelScheduledPopupUpdate();
            hideSelectionPopup();
        });

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
        Searcher.cleanupSelectionSearch();
        hideSelectionPopup();
        const frameDom = extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode;
        frameDom.remove();
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
            userData.innerHTML = `<i class="fal fa-user"></i> Error`;
            const dictionaryDate = document.querySelector('#diqt-dict-dictionary-select-form-wrapper');
            dictionaryDate.innerHTML = `<p>${chrome.i18n.getMessage("statusError")}</p>`;
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
    userData.innerHTML = `<i class="fal fa-user"></i> ${userName} / ${chrome.i18n.getMessage("settings")}`;
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
            </select>`;
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
    const selectForm = document.getElementById('diqt-dictionary-select-form');
    const setDictionaryId = function (event) {
        const selectedDictionaryId = `${event.currentTarget.value}`;
        chrome.storage.local.set({ diqtSelectedDictionaryId: selectedDictionaryId });
        // 辞書の切り替え時に検索を実行する。
        Searcher.search();
    };
    selectForm.addEventListener('change', setDictionaryId);
}

function initializePopupController() {
    if (popupControllerInitialized) {
        return;
    }

    popupControllerInitialized = true;

    chrome.storage.local.get(['diqtPopupDisplayed'], function (result) {
        syncPopupDisplaySetting(result.diqtPopupDisplayed);
    });

    chrome.storage.onChanged.addListener(function (changes, areaName) {
        if (areaName !== 'local' || !changes.diqtPopupDisplayed) {
            return;
        }

        syncPopupDisplaySetting(changes.diqtPopupDisplayed.newValue);
    });

    document.addEventListener('mousedown', handleDocumentMouseDown, true);
    document.addEventListener('mouseup', schedulePopupUpdate, true);
    document.addEventListener('keyup', handleSelectionKeyup, true);
}

function handleDocumentMouseDown(event) {
    if (popupButton && popupButton.contains(event.target)) {
        return;
    }

    hideSelectionPopup();
}

function handleSelectionKeyup(event) {
    if (suppressPopupKeyupUntilCtrlRelease) {
        if (!event.ctrlKey) {
            suppressPopupKeyupUntilCtrlRelease = false;
        }
        return;
    }

    const selection = window.getSelection();
    if (event.key === 'Escape' || isPopupVisible() || (selection && selection.toString() !== '')) {
        schedulePopupUpdate();
    }
}

function schedulePopupUpdate() {
    if (suppressNextPopupUpdate) {
        suppressNextPopupUpdate = false;
        cancelScheduledPopupUpdate();
        hideSelectionPopup();
        return;
    }

    cancelScheduledPopupUpdate();

    popupUpdateRequestId = window.requestAnimationFrame(function () {
        popupUpdateRequestId = null;
        updatePopupForSelection();
    });
}

function cancelScheduledPopupUpdate() {
    if (popupUpdateRequestId != null) {
        window.cancelAnimationFrame(popupUpdateRequestId);
        popupUpdateRequestId = null;
    }
}

function updatePopupForSelection() {
    if (!popupEnabled) {
        hideSelectionPopup();
        return;
    }

    if (document.querySelector('#diqt-dict-extension-wrapper')) {
        hideSelectionPopup();
        return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        hideSelectionPopup();
        return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText === '') {
        hideSelectionPopup();
        return;
    }

    if (selectionIntersectsElement(selection, document.querySelector('#diqt-dict-extension-wrapper')) || isEditableSelection(selection)) {
        hideSelectionPopup();
        return;
    }

    const range = selection.getRangeAt(0);
    const textRect = getSelectionRect(range);
    if (!textRect) {
        hideSelectionPopup();
        return;
    }

    showSelectionPopup(textRect);
}

function syncPopupDisplaySetting(value) {
    popupEnabled = value !== false && value !== '';

    if (!popupEnabled) {
        cancelScheduledPopupUpdate();
        hideSelectionPopup();
        return;
    }

    schedulePopupUpdate();
}

function getSelectionRect(range) {
    const clientRects = range.getClientRects();
    const textRect = clientRects.length > 0 ? clientRects[clientRects.length - 1] : range.getBoundingClientRect();

    if (!textRect || (textRect.width === 0 && textRect.height === 0)) {
        return null;
    }

    return textRect;
}

function isEditableSelection(selection) {
    if (isEditableElement(document.activeElement)) {
        return true;
    }

    return [selection.anchorNode, selection.focusNode].some(function (node) {
        return isEditableElement(getElementFromNode(node));
    });
}

function isEditableElement(element) {
    if (!element) {
        return false;
    }

    return element.matches('input, textarea, [contenteditable], [contenteditable="true"], [contenteditable="plaintext-only"]')
        || element.closest('input, textarea, [contenteditable], [contenteditable="true"], [contenteditable="plaintext-only"]') != null
        || element.isContentEditable;
}

function getElementFromNode(node) {
    if (!node) {
        return null;
    }

    return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
}

function selectionIntersectsElement(selection, element) {
    if (!element) {
        return false;
    }

    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    return [selection.anchorNode, selection.focusNode, range ? range.commonAncestorContainer : null].some(function (node) {
        return element.contains(node);
    });
}

function showSelectionPopup(textRect) {
    const popup = ensurePopupButton();
    if (!popup) {
        return;
    }

    const topPx = window.pageYOffset + textRect.bottom + 8;
    const leftPx = window.pageXOffset + textRect.left;
    popup.style.top = `${topPx}px`;
    popup.style.left = `${leftPx}px`;
    popup.style.display = 'block';
}

function ensurePopupButton() {
    if (popupButton && popupButton.isConnected) {
        return popupButton;
    }

    const bodyElement = document.body;
    if (!bodyElement) {
        return null;
    }

    popupButton = document.getElementById(POPUP_ID);
    if (!popupButton) {
        popupButton = document.createElement('button');
        popupButton.id = POPUP_ID;
        popupButton.type = 'button';
        popupButton.style.position = 'absolute';
        popupButton.style.display = 'none';
        popupButton.style.width = '32px';
        popupButton.style.height = '32px';
        popupButton.style.backgroundColor = '#273132';
        popupButton.style.zIndex = '2147483647';
        popupButton.style.border = '0';
        popupButton.style.borderRadius = '4px';
        popupButton.style.padding = '0';
        popupButton.style.margin = '0';
        popupButton.style.cursor = 'pointer';

        const image = document.createElement('img');
        image.src = POPUP_LOGO_URL;
        image.alt = 'diqt Icon';
        image.style.height = '24px';
        image.style.width = '24px';
        image.style.margin = '4px 2px 2px 3px';
        image.style.padding = '0';
        popupButton.appendChild(image);

        popupButton.addEventListener('click', function () {
            toggleFloatingWindow();
            hideSelectionPopup();
        });
    }

    if (!popupButton.isConnected) {
        bodyElement.appendChild(popupButton);
    }

    return popupButton;
}

function isPopupVisible() {
    return popupButton != null && popupButton.style.display !== 'none';
}

function hideSelectionPopup() {
    if (popupButton) {
        popupButton.style.display = 'none';
    }
}
