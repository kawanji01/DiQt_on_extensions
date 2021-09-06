// 辞書ウィンドウを開くために、アイコンが押されたことを、現在開いているタブのcontents_scriptsに伝える。（manifest 3では書き方が変わっている）：参照：https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#action-api-unification
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, "Action");
});

// contents_scriptから送られてきたメッセージを通じて、オプション画面を開く。参考：参照： https://stackoverflow.com/questions/49192636/how-can-i-open-my-options-html-currently-i-get-cannot-read-property-create-of
chrome.runtime.onMessage.addListener(function (message) {
    console.log('message');
    switch (message.action) {
        case "openOptionsPage":
            chrome.runtime.openOptionsPage();
            break;
        default:
            break;
    }
});


// content_scriptsから送られてきたlong-termなメッセージを受け取り、それぞれの処理を実行するルーティング。参照：https://developer.chrome.com/docs/extensions/mv3/messaging/
chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (msg) {
        switch (msg.action) {
            case 'inspectCurrentUser':
                inspectCurrentUser(port);
                break;
            case 'search':
                respondSearch(port, msg.keyword)
                break;
            case 'renderReviewForm':
                respondReviewSetting(port, msg.wordId);
                break;
            case 'createReminder':
                respondCreateReminder(port, msg.quizId, msg.settingNumber)
                break;
            case 'updateReminder':
                respondUpdateReminder(port, msg.quizId, msg.settingNumber);
                break;
            case 'destroyReminder':
                respondDestroyReminder(port, msg.quizId);
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
        let url = `https://www.booqs.net/ja/api/v1/extension/inspect_current_user`;
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
                console.log(data);
                resolve(data['data']);
            })
            .catch((error) => {
                resolve('error');
            });
    });
}

// is_logged_inやsign_inのJSONをlocalStorageに格納する。
function setUserData(data) {
    chrome.storage.local.set({ booqsDictUserName: data['name'] });
    chrome.storage.local.set({ booqsDictIconUrl: data['icon_url'] });
    chrome.storage.local.set({ booqsDictPublicUid: data['public_uid'] });
    chrome.storage.local.set({ booqsDictToken: data['token'] });
}

// localStorageのユーザーデータをすべて消去する
function resetUserData() {
    chrome.storage.local.set({ booqsDictUserName: '' });
    chrome.storage.local.set({ booqsDictIconUrl: '' });
    chrome.storage.local.set({ booqsDictPublicUid: '' });
    chrome.storage.local.set({ booqsDictToken: '' });
}

async function inspectCurrentUser(port) {
    const data = await fetchCurrentUser();
    port.postMessage({ data: data });
}

///////// 現在のユーザーを取得する ///////



//////// 復習フォームのレンダリング //////
function fetchReviewSetting(wordId) {
    return new Promise(resolve => {
        let url = `https://www.booqs.net/ja/api/v1/extension/review_setting`;
        console.log(url);
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ word_id: wordId }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        };
        console.log(url);
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

async function respondReviewSetting(port, wordId) {
    const data = await fetchReviewSetting(wordId);
    port.postMessage({ data: data });
}
//////// 復習フォームのレンダリング //////


/////// 復習設定の新規作成 ///////
function postCreateReminder(quizId, settingNumber) {
    return new Promise(resolve => {
        let url = `https://www.booqs.net/ja/api/v1/extension/create_reminder`;
        console.log(url);
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ quiz_id: quizId, setting_number: settingNumber }),
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
                console.log('create-error：' + error)
                resolve(error);
            });
    });
}

async function respondCreateReminder(port, quizId, settingNumber) {
    const data = await postCreateReminder(quizId, settingNumber);
    port.postMessage({ data: data });
};
/////// 復習設定の新規作成 ///////


/////// 復習設定の更新 ///////
function postUpdateReminder(quizId, settingNumber) {
    return new Promise(resolve => {
        let url = `https://www.booqs.net/ja/api/v1/extension/update_reminder`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ quiz_id: quizId, setting_number: settingNumber }),
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
                console.log('update-error：' + error)
                resolve(error);
            });
    });
}

async function respondUpdateReminder(port, quizId, settingNumber) {
    const data = await postUpdateReminder(quizId, settingNumber);
    port.postMessage({ data: data });
};
/////// 復習設定の更新 ///////


////// 復習設定の削除 ///////
function requestDestroyReminder(quizId) {
    return new Promise(resolve => {
        let url = `https://www.booqs.net/ja/api/v1/extension/destroy_reminder`;
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
                console.log(data);
                resolve(data);
            })
            .catch((error) => {
                console.log('destroy-error：' + error)
                resolve(error);
            });
    });
}

async function respondDestroyReminder(port, quizId) {
    const data = await requestDestroyReminder(quizId);
    port.postMessage({ data: data });
};
////// 復習設定の削除 ///////


///// Google翻訳 /////
function requestGoogleTranslation(keyword) {
    return new Promise(resolve => {
        let url = `https://www.booqs.net/ja/api/v1/extension/google_translate`;
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
                console.log(data);
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
};
///// Google翻訳 /////



///// Deepl翻訳 /////
function requestDeeplTranslation(keyword) {
    return new Promise(resolve => {
        let url = `https://www.booqs.net/ja/api/v1/extension/deepl_translate`;
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
                console.log(data);
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
        let url = 'https://www.booqs.net/api/v1/extension/search_word';
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
                console.log(data);
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