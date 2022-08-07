// diqtのルートURLの設定。ngrokを利用する場合には、こことoptions.jsの定数をngrokのURLに書き換える。
//const diqtRootUrl = 'https://www.diqt.net';
const diqtRootUrl = 'https://74b5-117-18-195-105.ngrok.io';

// 辞書ウィンドウを開くために、アイコンが押されたことを、現在開いているタブのcontents_scriptsに伝える。（manifest 3では書き方が変わっている）：参照：https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#action-api-unification
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, "Action");
});

// タブがアップデート（画面遷移など）されたことをcontent_scriptsに伝える。参考：https://developer.chrome.com/docs/extensions/reference/tabs/#event-onUpdated
chrome.tabs.onUpdated.addListener(function (tabId) {
    chrome.tabs.sendMessage(tabId, "Updated");
});


// contents_scriptから送られてきたone-timeメッセージを通じて、オプション画面を開く。参考：参照： https://stackoverflow.com/questions/49192636/how-can-i-open-my-options-html-currently-i-get-cannot-read-property-create-of
chrome.runtime.onMessage.addListener(function (message) {
    switch (message.action) {
        case "openOptionsPage":
            chrome.runtime.openOptionsPage();
            break;
        default:
            break;
    }
});


// content_scriptsから送られてきたlong-termメッセージを受け取り、それぞれの処理を実行するルーティング。参照：https://developer.chrome.com/docs/extensions/mv3/messaging/
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        switch (msg.action) {
            case 'inspectCurrentUser':
                inspectCurrentUser(port);
                break;
            case 'search':
                respondSearch(port, msg.keyword)
                break;
            case 'createReview':
                respondCreateReview(port, msg.quizId)
                break;
            case 'updateReview':
                respondUpdateReview(port, msg.reviewId, msg.settingNumber);
                break;
            case 'destroyReview':
                respondDestroyReview(port, msg.reviewId);
                break;
            case 'googleTranslation':
                respondGoogleTranslation(port, msg.keyword)
                break;
            case 'deeplTranslation':
                respondDeepLTranslation(port, msg.keyword)
                break;
        }
    })
});

///////// 現在のユーザーを取得する ///////
function fetchCurrentUser() {
    return new Promise(resolve => {
        let url = `${diqtRootUrl}/ja/api/v1/extensions/users/inspect_current_user`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data['data']) {
                    setUserData(data['data']);
                } else {
                    resetUserData();
                }
                resolve(data['data']);
            })
            .catch((error) => {
                console.log(error);
                resolve('error');
            });
    });
}

// is_logged_inやsign_inのJSONをlocalStorageに格納する。
function setUserData(data) {
    chrome.storage.local.set({ diqtDictUserName: data['name'] });
    chrome.storage.local.set({ diqtDictIconUrl: data['icon_url'] });
    chrome.storage.local.set({ diqtDictPublicUid: data['public_uid'] });
    chrome.storage.local.set({ diqtDictToken: data['token'] });
    chrome.storage.local.set({ diqtDictPopupDisplayed: data['popup_displayed'] });
}

// localStorageのユーザーデータをすべて消去する
function resetUserData() {
    chrome.storage.local.set({ diqtDictUserName: '' });
    chrome.storage.local.set({ diqtDictIconUrl: '' });
    chrome.storage.local.set({ diqtDictPublicUid: '' });
    chrome.storage.local.set({ diqtDictToken: '' });
    chrome.storage.local.set({ diqtDictPopupDisplayed: '' });
}

async function inspectCurrentUser(port) {
    const data = await fetchCurrentUser();
    port.postMessage({ data: data });
}

///////// 現在のユーザーを取得する ///////


/////// 復習設定の新規作成 ///////
function postCreateReview(quizId) {
    return new Promise(resolve => {
        let url = `${diqtRootUrl}/ja/api/v1/extensions/reviews`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ quiz_id: quizId }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.log(error);
                resolve(error);
            });
    });
}

async function respondCreateReview(port, quizId) {
    const data = await postCreateReview(quizId);
    port.postMessage({ data: data });
}
/////// 復習設定の新規作成 ///////


/////// 復習設定の更新 ///////
function postUpdateReview(reviewId, settingNumber) {
    return new Promise(resolve => {
        let url = `${diqtRootUrl}/ja/api/v1/extensions/reviews/${reviewId}`;
        let params = {
            method: "PATCH",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ interval_setting: settingNumber }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.log(error);
                resolve(error);
            });
    });
}

async function respondUpdateReview(port, quizId, settingNumber) {
    const data = await postUpdateReview(quizId, settingNumber);
    port.postMessage({ data: data });
}
/////// 復習設定の更新 ///////


////// 復習設定の削除 ///////
function requestDestroyReview(reviewId) {
    return new Promise(resolve => {
        let url = `${diqtRootUrl}/ja/api/v1/extensions/reviews/${reviewId}`;
        let params = {
            method: "DELETE",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.log(error);
                resolve(error);
            });
    });
}

async function respondDestroyReview(port, reviewId) {
    const data = await requestDestroyReview(reviewId);
    port.postMessage({ data: data });
}
////// 復習設定の削除 ///////


///// Google翻訳 /////
function requestGoogleTranslation(keyword) {
    return new Promise(resolve => {
        let url = `${diqtRootUrl}/ja/api/v1/extensions/words/google_translate`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ keyword: keyword }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.log(error)
                resolve(error);
            });
    });
}

async function respondGoogleTranslation(port, keyword) {
    const data = await requestGoogleTranslation(keyword);
    port.postMessage({ data: data });
}
///// Google翻訳 /////



///// Deepl翻訳 /////
function requestDeeplTranslation(keyword) {
    return new Promise(resolve => {
        let url = `${diqtRootUrl}/ja/api/v1/extensions/words/deepl_translate`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ keyword: keyword }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.log(error)
                resolve(error);
            });
    });
}

async function respondDeepLTranslation(port, keyword) {
    const data = await requestDeeplTranslation(keyword);
    port.postMessage({ data: data });
}
///// Deepl翻訳 /////


////// 検索 //////
function requestSearch(keyword) {
    return new Promise(resolve => {
        let url = `${diqtRootUrl}/api/v1/extensions/words/search`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ keyword: keyword, dictionary_id: 1 }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                resolve(data);
            })
            .catch((error) => {
                console.log(error)
                resolve(error);
            });
    });
}

async function respondSearch(port, keyword) {
    const data = await requestSearch(keyword);
    port.postMessage({ data: data });
}
////// 検索 //////
