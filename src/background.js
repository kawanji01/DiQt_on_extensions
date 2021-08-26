// 辞書ウィンドウを開くために、アイコンが押されたことを、現在開いているタブのcontents_scriptsに伝える。（manifest 3では書き方が変わっている）：参照：https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#action-api-unification
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, "Action");
});

// contents_scriptから送られてきたメッセージを通じて、オプション画面を開く。参考：参照： https://stackoverflow.com/questions/49192636/how-can-i-open-my-options-html-currently-i-get-cannot-read-property-create-of
chrome.runtime.onMessage.addListener(function (message) {
    console.log('message');
    switch (message.action) {
        case "openOptionsPage":
            console.log('openoption');
            chrome.runtime.openOptionsPage();
            break;
        default:
            break;
    }
});

/////////  ログイン検証処理  /////////
// content_scriptsから送られてきたメッセージを受け取り、ログイン検証用のリクエストをAPIに投げる。参照：https://developer.chrome.com/docs/extensions/mv3/messaging/
chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        if(msg.action == "isLoggedIn") {
            isLoggedIn(port);
        }
    })
});

// 以下ログイン済みか否かの判定。options.jsのほぼコピペ //
// ログイン済みかそうでないかの状態を返す関数。
function inspectState() {
    return new Promise(resolve => {
        chrome.storage.local.get(['booqsDictToken'], function (result) {
            let token = result.booqsDictToken;
            console.log(token)
            if (token) {
                console.log(token);
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
                        console.log(data);
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

// ログイン済みかどうかを検証して、content_scriptsにレスポンスを返す。
async function isLoggedIn(port) {
    const state = await inspectState();
    port.postMessage({state: state});
}
/////////  ログイン検証処理  /////////