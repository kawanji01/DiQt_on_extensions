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
                // isLoggedInはinspectCurrentUserに統一して削除予定。
            case 'isLoggedIn':
                isLoggedIn(port);
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


/////////  ログイン検証処理（inspectCurrentUserに移したので削除予定）  /////////
// 以下ログイン済みか否かの判定。options.jsの当該処理のほぼコピペ（isLoggedIn(port)のみ異なる） //
// ログイン済みかそうでないかの状態を返す関数。
/*function inspectState() {
    return new Promise(resolve => {
        chrome.storage.local.get(['booqsDictToken'], function (result) {
            let token = result.booqsDictToken;
            if (token) {
                let url = `https://www.booqs.net/ja/api/v1/extension/is_logged_in?booqs_dict_token=` + token;
                let params = {
                    method: "POST",
                    body: JSON.stringify({ booqs_dict_token: token })
                };
                fetch(url, params)
                    .then((response) => {
                        return response.json();
                    })
                    .then((data) => {
                        // console.log(data);
                        // ログイン済みならユーザー情報を更新しておく。
                        setUserData(data['data']);
                        resolve('loggedIn');
                    })
                    .catch((error) => {
                        console.log(error);
                        resetUserData();
                        resolve('error');
                    });
            } else {
                resetUserData();
                resolve('blankToken');
            }
        });
    })
}
*/



// ログイン済みかどうかを検証して、content_scriptsにレスポンスを返す。

/*async function isLoggedIn(port) {
    const state = await inspectState();
    port.postMessage({ state: state });
}
*/
/////////  ログイン検証処理  /////////




//////// 復習フォームのレンダリング //////
function fetchReviewSetting(wordId) {
    return new Promise(resolve => {
        chrome.storage.local.get(['booqsDictToken'], function (result) {
            let token = result.booqsDictToken;
            if (!token) {
                return resolve('unauthorized');
            }
            let url = `https://www.booqs.net/ja/api/v1/extension/review_setting`;
            console.log(url);
            let params = {
                method: "POST",
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({  word_id: wordId }),
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
                    console.log('success');
                    console.log(data);
                    resolve(data['data']);
                })
                .catch((error) => {
                    console.log('error');
                    console.log(error);
                    resolve(error);
                });
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
        chrome.storage.local.get(['booqsDictToken'], function (result) {
            console.log(settingNumber);
            let token = result.booqsDictToken;
            if (!token) {
                return resolve('unauthorized');
            }
            let url = `https://www.booqs.net/ja/api/v1/extension/create_reminder`;
            console.log(url);
            let params = {
                method: "POST",
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({  quiz_id: quizId, setting_number: settingNumber }),
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
    });
}

async function respondCreateReminder(port, quizId, settingNumber) {
    const data = await postCreateReminder(quizId, settingNumber);
    port.postMessage({ data: data['data'] });
};
/////// 復習設定の新規作成 ///////


/////// 復習設定の更新 ///////
function postUpdateReminder(quizId, settingNumber) {
    return new Promise(resolve => {
        chrome.storage.local.get(['booqsDictToken'], function (result) {
            let token = result.booqsDictToken;
            if (!token) {
                return resolve('unauthorized');
            }
            let url = `https://www.booqs.net/ja/api/v1/extension/update_reminder`;
            let params = {
                method: "POST",
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({  quiz_id: quizId, setting_number: settingNumber }),
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
    });
}

async function respondUpdateReminder(port, quizId, settingNumber) {
    const data = await postUpdateReminder(quizId, settingNumber);
    port.postMessage({ data: data['data'] });
};
/////// 復習設定の更新 ///////


////// 復習設定の削除 ///////
function requestDestroyReminder(quizId) {
    return new Promise(resolve => {
        chrome.storage.local.get(['booqsDictToken'], function (result) {
            let token = result.booqsDictToken;
            if (!token) {
                return resolve('unauthorized');
            }
            let url = `https://www.booqs.net/ja/api/v1/extension/destroy_reminder`;
            let params = {
                method: "POST",
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({  quiz_id: quizId }),
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
    });
}

async function respondDestroyReminder(port, quizId) {
    const data = await requestDestroyReminder(quizId);
    port.postMessage({ data: data['data'] });
};
////// 復習設定の削除 ///////