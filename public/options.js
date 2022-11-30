// diqtのルートURLの設定。ngrokを利用する場合には、こことbackground.jsの定数をngrokのURLに書き換える。
//const diqtRootUrl = 'https://www.diqt.net';
const diqtRootUrl = 'https://819c-202-177-91-144.ngrok.io/';


// アクセスして一番最初に実行する関数。
function initializePage() {
    let port = chrome.runtime.connect({ name: "inspectCurrentUser" });
    port.postMessage({ action: "inspectCurrentUser" });
    port.onMessage.addListener(function (msg) {
        const data = msg['data'];
        if (data) {
            renderMypage();
        } else {
            renderLoginForm();
        }
    });
}


// localStorageにユーザーデータを格納する。
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


// プロフィールページ（ログイン済み画面）をレンダリングする
function renderMypage() {
    let uid = '';
    let iconUrl = '';
    let userName = '';
    let dictionaryId = '' ;
    let popupDisplayed = '';
    chrome.storage.local.get(['diqtDictPublicUid', 'diqtDictIconUrl', 'diqtDictUserName', 'diqtDictDictionaryId', 'diqtDictPopupDisplayed'], function (result) {
        uid = result.diqtDictPublicUid;
        iconUrl = result.diqtDictIconUrl;
        userName = result.diqtDictUserName;
        dictionaryId = result.diqtDictDictionaryId;
        popupDisplayed = result.diqtDictPopupDisplayed;
        if (dictionaryId == '') {
            dictionaryId = 1;
            chrome.storage.local.set({ diqtDictDictionaryId: `${dictionaryId}` });
        } else {
            dictionaryId = Number(dictionaryId);
        }
        let checked = ''
        if (popupDisplayed) {
            checked = 'checked';
        }

        let profileHtml = `
<div class="content has-text-centered">
  
    <figure class="mt-5 image is-128x128 mx-auto">
      <img
        class="is-rounded"
        src="${iconUrl}"
      />
    </figure>

    <h1 class="mt-3 is-size-4 has-text-weight-bold">
      ${userName}
    </h1>

    ${createDictionarySelectForm(dictionaryId)}
    

    <dic class="block my-3">
        <label class="checkbox" id="diqt-dict-popup-displayed">
            <input type="checkbox" id="diqt-dict-popup-displayed-checkbox" ${checked}>
            <span id="diqt-dict-popup-displayed-text">テキストを選択したときにポップアップを表示する。</span>
        </label>
    </div>

    
  
<div class="block has-text-centered">
  <a href="https://www.diqt.net/ja/users/${uid}" target="_blank" rel="noopener">
  <button class="button is-warning is-light">マイページ</button>
  </a>
</div>

<div class="block has-text-centered">
  <button class="button is-warning is-light" id="logout-btn">ログアウト</button>
</div>

</div>`
        let userPage = document.querySelector("#user-page");
        userPage.innerHTML = profileHtml;
        addEventToSelectForm();
        addEventToLogout();
        AddEventToPopupDisplayed();
    });
}

// 辞書のセレクトフォームを作成
function createDictionarySelectForm(value) {
    let createOption = function(dictId, selectedDictId) {
        if (dictId === selectedDictId) {
            return 'selected';
        } else {
            return ''
        }
    }
    return `<div class="block has-text-centered mt-5">
    <div class="select">
        <select id="dictionary-select-form">
            <option value="1" class="has-text-weight-bold" ${createOption(1, value)}>英和辞書</option>
            <option value="5" class="has-text-weight-bold" ${createOption(5, value)}>英英辞書</option>
        </select>
    </div>
</div>`
}

// 辞書の切り替え
function addEventToSelectForm() {
    let selectForm = document.getElementById('dictionary-select-form');
    let setDictionaryId = function(event) {
        let dictionaryId = `${event.currentTarget.value}`
        chrome.storage.local.set({ diqtDictDictionaryId: dictionaryId });
    }
    selectForm.addEventListener('change', setDictionaryId);
}




// プロフィールページのログアウトボタンにイベントを追加
function addEventToLogout() {
    let logoutBtn = document.querySelector("#logout-btn");
    let logoutRequest = () => {
        logoutBtn.value = 'ログアウト中...'
        let url = `${diqtRootUrl}/ja/api/v1/extensions/sessions/logout`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        }

        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                // ユーザー情報をすべて削除して、ログインフォームを表示する。
                resetUserData();
                renderLoginForm();
                addEventToLoginForm();
            })
            .catch((error) => {
                console.log(error);
            });
    }
    logoutBtn.addEventListener("click", logoutRequest, false);
}




// ポップアップの表示・非表示チェックボックスにイベントを追加
function AddEventToPopupDisplayed() {
    let checkboxLabel = document.querySelector('#diqt-dict-popup-displayed');
    let checkbox = document.querySelector('#diqt-dict-popup-displayed-checkbox');
    let checkboxText = document.querySelector('#diqt-dict-popup-displayed-text');
    let toggleRequest = () => {
        checkboxText.textContent = '設定中...';
        let url = `${diqtRootUrl}/ja/api/v1/extensions/users/update_popup_displayed`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }
        }

        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                checkbox.checked = data.data.popup_displayed;
                checkboxText.textContent = 'テキストを選択したときにポップアップを表示する。'
                chrome.storage.local.set({ diqtDictPopupDisplayed: data.data.popup_displayed });
            })
            .catch((error) => {
                console.log(error);
            });
    }
    checkboxLabel.addEventListener("click", toggleRequest, false);
}

// ログインフォームをレンダリングする
function renderLoginForm() {
    let loginFormHtml = `
<div class="content">
<h1 class="mb-5 mt-3 has-text-centered is-size-2 has-text-weight-bold">
  ログイン
</h1>
<p>
  ログインすることで、復習を設定できるようになったり、機械翻訳が利用できるようになります。
</p>

</div>

<form class="fetchForm">
<div id="feedback">
</div>
<div class="field">
  <label class="label">Email</label>
  <div class="control">
    <input
      class="input"
      id="diqt-email"
      type="email"
      placeholder="メールアドレスを入力してください。"
      value=""
    />
  </div>
</div>

<div class="field">
  <label class="label">Password</label>
  <div class="control">
    <input
      class="input"
      id="diqt-password"
      type="password"
      placeholder="パスワードを入力してください。"
      value=""
    />
  </div>
</div>
<input
  type="button"
  value="ログインする"
  class="button is-success has-text-weight-bold is-block is-medium mt-5"
  id="diqt-login-btn"
  style="width: 100%"
/>
</form>
<p>　</p>
<h5 class="mb-3 mt-5 has-text-centered is-size-4 has-text-grey">
<span class="has-text-weight-light">———</span> or <span class="has-text-weight-light">———</span>
</h3>
<div class="columns has-text-centered">
  <div class="column is-three-fifths is-offset-one-fifth">
    <a href="https://www.diqt.net/ja/login?authentication=sns" target="_blank" rel="noopener">
        <button class="button is-danger my-3 is-medium is-fullwidth has-text-weight-bold">Googleで続ける</button>
    </a>

    <a href="https://www.diqt.net/ja/login?authentication=sns" target="_blank" rel="noopener">
        <button class="button is-info my-3 is-medium is-fullwidth has-text-weight-bold">Twitterで続ける</button>
    </a>

    <a href="https://www.diqt.net/ja/login?authentication=sns" target="_blank" rel="noopener">
        <button class="button is-black my-3 is-medium is-fullwidth has-text-weight-bold">Appleで続ける</button>
    </a>

    <p>　</p>
    <p class="my-5 has-text-weight-bold">
        アカウントを持っていませんか？ <a href="https://www.diqt.net/ja/users/new" target="_blank" rel="noopener" style="color: #f79c4f;">新規登録</a
        >
    </p>


  </div>
</div>

`
    let userPage = document.querySelector("#user-page");
    userPage.innerHTML = loginFormHtml;
    addEventToLoginForm();
}

// ログインフォームに、ログインのためのイベントを追加する
function addEventToLoginForm() {
    let btn = document.querySelector("#diqt-login-btn");
    const postFetch = () => {
        let email = document.querySelector("#diqt-email").value;
        // emailに+が含まれていると空白文字として解釈されてしまうのでエンコードしておく。
        // let encodedEmail = encodeURIComponent(email);
        let password = document.querySelector("#diqt-password").value;
        // let encodedPassword = encodeURIComponent(password);
        let url = `${diqtRootUrl}/ja/api/v1/extensions/sessions/sign_in`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ email: email, password: password }),
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
                if (data['status'] == '200') {
                    setUserData(data['data']);
                    renderMypage();
                } else {
                    let errorHtml = `
                    <div class="notification is-danger is-light my-3">
                    メールアドレスとパスワードの組み合わせが正しくありません。
                    </div>`
                    let feedback = document.querySelector('#feedback');
                    feedback.innerHTML = errorHtml;
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };
    btn.addEventListener("click", postFetch, false);
}



// ページのイニシャライズして、ログインフォームかプロフィールページのどちらかを表示する）
initializePage()

