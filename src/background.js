// diqtのルートURLの設定。ngrokを利用する場合には、こことoptions.jsの定数をngrokのURLに書き換える。

import { DIQT_URL, BASIC_AUTH } from './constants.js';


// 辞書ウィンドウを開くために、アイコンが押されたことを、現在開いているタブのcontents_scriptsに伝える。（manifest 3では書き方が変わっている）：参照：https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#action-api-unification
chrome.action.onClicked.addListener(function (tab) {
    // Could not establish connection. Receiving end does not exist.の解決
    // ref: https://blog.holyblue.jp/entry/2022/07/11/084839
    const rtnPromise = chrome.tabs.sendMessage(tab.id, "Action");
    rtnPromise.then((response) => { }).catch((error) => { });
});

// タブがアップデート（画面遷移など）されたことをcontent_scriptsに伝える。参考：https://developer.chrome.com/docs/extensions/reference/tabs/#event-onUpdated
chrome.tabs.onUpdated.addListener(function (tabId) {
    // Could not establish connection. Receiving end does not exist.の解決
    // ref: https://blog.holyblue.jp/entry/2022/07/11/084839
    const rtnPromise = chrome.tabs.sendMessage(tabId, "Updated");
    rtnPromise.then((response) => { }).catch((error) => { });
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
                respondSearch(port, msg.keyword);
                break;
            case 'createReview':
                respondCreateReview(port, msg.quizId);
                break;
            case 'updateReview':
                respondUpdateReview(port, msg.reviewId, msg.settingNumber);
                break;
            case 'destroyReview':
                respondDestroyReview(port, msg.reviewId);
                break;
            case 'googleTranslation':
                respondGoogleTranslation(port, msg.keyword, msg.sourceLangNumber, msg.targetLangNumber);
                break;
            case 'deeplTranslation':
                respondDeepLTranslation(port, msg.keyword, msg.sourceLangNumber, msg.targetLangNumber);
                break;
            case 'aiSearch':
                respondAISearch(port, msg.keyword, msg.sourceLangNumber, msg.targetLangNumber, msg.promptKey, msg.version, msg.streaming);
                break;
        }
    })
});

///////// 現在のユーザーを取得する ///////
function fetchCurrentUser() {
    return new Promise(resolve => {
        const url = `${DIQT_URL}/api/v1/extensions/users/current`;
        const params = {
            method: "GET",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
            }
        };
        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data['user']) {
                    setUserData(data['user']);
                } else {
                    resetUserData();
                }
                resolve(data);
            })
            .catch((error) => {
                console.log(error);
                resolve('error');
            });
    });
}

// is_logged_inやsign_inのJSONをlocalStorageに格納する。
function setUserData(data) {
    chrome.storage.local.set({ diqtUserName: data['name'] });
    chrome.storage.local.set({ diqtUserIconUrl: data['icon_url'] });
    chrome.storage.local.set({ diqtUserPublicUid: data['public_uid'] });
    chrome.storage.local.set({ diqtPopupDisplayed: data['popup_displayed'] });
    chrome.storage.local.set({ diqtDictionaries: data['dictionaries'] });
}

// localStorageのユーザーデータをすべて消去する
function resetUserData() {
    chrome.storage.local.set({ diqtUserName: '' });
    chrome.storage.local.set({ diqtUserIconUrl: '' });
    chrome.storage.local.set({ diqtUserPublicUid: '' });
    chrome.storage.local.set({ diqtPopupDisplayed: '' });
}

async function inspectCurrentUser(port) {
    const data = await fetchCurrentUser();
    port.postMessage({ data: data });
}

///////// 現在のユーザーを取得する ///////


/////// 復習設定の新規作成 ///////
function postCreateReview(quizId) {
    return new Promise(resolve => {
        const url = `${DIQT_URL}/api/v1/extensions/reviews`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ quiz_id: quizId }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
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
        const url = `${DIQT_URL}/api/v1/extensions/reviews/${reviewId}`;
        const params = {
            method: "PATCH",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ interval_setting: settingNumber }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
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
        const url = `${DIQT_URL}/api/v1/extensions/reviews/${reviewId}`;
        const params = {
            method: "DELETE",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
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

// 意味や例文の翻訳を取得する
function requestGoogleTranslation(keyword, sourceLangNumber, targetLangNumber) {
    return new Promise(resolve => {
        const url = `${DIQT_URL}/api/v1/extensions/langs/google_translate`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                context: keyword,
                source_lang_number: sourceLangNumber, target_lang_number: targetLangNumber
            }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
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

async function respondGoogleTranslation(port, keyword, sourceLangNumber, targetLangNumber) {
    const data = await requestGoogleTranslation(keyword, sourceLangNumber, targetLangNumber);
    port.postMessage({ data: data });
}
///// Google翻訳 /////



///// Deepl翻訳 /////

// 意味や例文の翻訳を取得する
function requestDeeplTranslation(keyword, sourceLangNumber, targetLangNumber) {
    return new Promise(resolve => {
        const url = `${DIQT_URL}/api/v1/extensions/langs/deepl_translate`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({
                context: keyword,
                source_lang_number: sourceLangNumber, target_lang_number: targetLangNumber
            }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
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

async function respondDeepLTranslation(port, keyword, sourceLangNumber, targetLangNumber) {
    const data = await requestDeeplTranslation(keyword, sourceLangNumber, targetLangNumber);
    port.postMessage({ data: data });
}

///// Deepl翻訳 /////

////// AI検索 //////
async function respondAISearch(port, keyword, sourceLangNumber, targetLangNumber, promptKey, version, streaming) {
    const versionNumber = Number(version) || 0;
    const useStreaming = streaming === 1 || streaming === '1' || versionNumber >= 4;
    if (useStreaming) {
        await streamAISearch(port, keyword, sourceLangNumber, targetLangNumber, promptKey, versionNumber);
        return;
    }
    const data = await requestAISearch(keyword, sourceLangNumber, targetLangNumber, promptKey, versionNumber);
    port.postMessage({ data: data });
}
function requestAISearch(keyword, sourceLangNumber, targetLangNumber, promptKey, version) {
    return new Promise(resolve => {
        const url = `${DIQT_URL}/api/v1/extensions/langs/ai_search`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ keyword: keyword, source_lang_number: sourceLangNumber, target_lang_number: targetLangNumber, prompt_key: promptKey, version: version }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
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
                //console.log(error)
                resolve(error);
            });
    });
}

async function streamAISearch(port, keyword, sourceLangNumber, targetLangNumber, promptKey, version) {
    const url = `${DIQT_URL}/api/v1/extensions/langs/ai_search`;
    const params = {
        method: "POST",
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
            keyword: keyword,
            source_lang_number: sourceLangNumber,
            target_lang_number: targetLangNumber,
            prompt_key: promptKey,
            version: version,
            streaming: 1
        }),
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'authorization': BASIC_AUTH,
            'Accept': 'text/event-stream'
        }
    };

    let response;
    try {
        response = await fetch(url, params);
    } catch (error) {
        port.postMessage({ data: { status: 500, message: error.message } });
        return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('text/event-stream')) {
        let data = null;
        try {
            data = await response.json();
        } catch (error) {
            data = { status: response.status, message: 'AI search failed' };
        }
        port.postMessage({ data: data });
        return;
    }

    if (!response.body) {
        port.postMessage({ data: { status: response.status, message: 'AI search stream unavailable' } });
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let doneSent = false;

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            buffer += decoder.decode(value, { stream: true });
            buffer = buffer.replace(/\r\n/g, '\n');
            const events = buffer.split('\n\n');
            buffer = events.pop();
            events.forEach((eventChunk) => {
                const lines = eventChunk.split('\n');
                lines.forEach((line) => {
                    if (!line.startsWith('data:')) {
                        return;
                    }
                    const dataLine = line.replace(/^data:\s*/, '');
                    if (!dataLine) {
                        return;
                    }
                    if (dataLine === '[DONE]') {
                        doneSent = true;
                        port.postMessage({ data: { done: true } });
                        return;
                    }
                    let payload;
                    try {
                        payload = JSON.parse(dataLine);
                    } catch (error) {
                        port.postMessage({ data: { delta: dataLine } });
                        return;
                    }
                    if (payload && Object.prototype.hasOwnProperty.call(payload, 'delta')) {
                        port.postMessage({ data: { delta: payload.delta } });
                    }
                });
            });
        }
    } catch (error) {
        port.postMessage({ data: { status: 500, message: error.message } });
        return;
    }

    if (!doneSent) {
        port.postMessage({ data: { done: true } });
    }
}


////// 検索 //////
function requestSearch(keyword, dictionaryId) {
    return new Promise(resolve => {
        const url = `${DIQT_URL}/api/v1/extensions/dictionaries/${dictionaryId}/search`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ keyword: keyword }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': BASIC_AUTH,
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
                //console.log(error)
                resolve(error);
            });
    });
}

async function respondSearch(port, keyword) {
    chrome.storage.local.get(['diqtSelectedDictionaryId'], async function (result) {
        let dictionaryId = result.diqtSelectedDictionaryId;
        // console.log(dictionaryId);
        if (dictionaryId == '' || dictionaryId == undefined) {
            dictionaryId = 1;
            chrome.storage.local.set({ diqtSelectedDictionaryId: `${dictionaryId}` });
        }
        // console.log(`respondSearch: ${dictionaryId}`);
        const data = await requestSearch(keyword, dictionaryId);
        port.postMessage({ data: data });
    });
}
////// 検索 //////


////// TextToSpeech //////
// 音声を再生する関数
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "playAudio") {
        playSound(request.url)
            .then(response => {
                sendResponse({ success: true, response });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // 非同期応答を示すために true を返す
    }
});

async function playSound(source, volume = 1) {
    await createOffscreen();
    // メッセージ送信を待機して、オフスクリーンドキュメントが存在することを確実にする
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ play: { source, volume } }, response => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

async function createOffscreen() {
    console.log('createOffscreen');
    if (await chrome.offscreen.hasDocument()) {
        console.log('Offscreen document already exists');
        return;
    }
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'testing'
    });
}
////// TextToSpeech //////
