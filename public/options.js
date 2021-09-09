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
    chrome.storage.local.set({ booqsDictUserName: data['name'] });
    chrome.storage.local.set({ booqsDictIconUrl: data['icon_url'] });
    chrome.storage.local.set({ booqsDictPublicUid: data['public_uid'] });
    chrome.storage.local.set({ booqsDictToken: data['token'] });
    chrome.storage.local.set({ booqsDictPopupDisplayed: data['popup_displayed'] });
}

// localStorageのユーザーデータをすべて消去する
function resetUserData() {
    chrome.storage.local.set({ booqsDictUserName: '' });
    chrome.storage.local.set({ booqsDictIconUrl: '' });
    chrome.storage.local.set({ booqsDictPublicUid: '' });
    chrome.storage.local.set({ booqsDictToken: '' });
    chrome.storage.local.set({ booqsDictPopupDisplayed: '' });
}


// プロフィールページ（ログイン済み画面）をレンダリングする
function renderMypage() {
    let uid = '';
    let iconUrl = '';
    let userName = '';
    let popupDisplayed = '';
    chrome.storage.local.get(['booqsDictPublicUid', 'booqsDictIconUrl', 'booqsDictUserName', 'booqsDictPopupDisplayed'], function (result) {
        uid = result.booqsDictPublicUid;
        iconUrl = result.booqsDictIconUrl;
        userName = result.booqsDictUserName;
        popupDisplayed = result.booqsDictPopupDisplayed;
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

    <dic class="block my-3">
<label class="checkbox" id="booqs-dict-popup-displayed">
  <input type="checkbox" id="booqs-dict-popup-displayed-checkbox" ${checked}>
  <span id="booqs-dict-popup-displayed-text">テキストを選択したときにポップアップを表示する。</span>
</label>
    </div>
  
<div class="block has-text-centered">
  <a href="https://www.booqs.net/ja/users/${uid}" target="_blank" rel="noopener">
  <button class="button is-warning is-light">マイページ</button>
  </a>
</div>

<div class="block has-text-centered">
  <button class="button is-warning is-light" id="logout-btn">ログアウト</button>
</div>

</div>`
        let userPage = document.querySelector("#user-page");
        userPage.innerHTML = profileHtml;
        addEventToLogout();
        AddEventToPopupDisplayed();
    });
}

// プロフィールページのログアウトボタンにイベントを追加
function addEventToLogout() {
    let logoutBtn = document.querySelector("#logout-btn");
    let logoutRequest = () => {
        logoutBtn.value = 'ログアウト中...'
        let url = `https://www.booqs.net/ja/api/v1/extension/logout`;
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
    let checkboxLabel = document.querySelector('#booqs-dict-popup-displayed');
    let checkbox = document.querySelector('#booqs-dict-popup-displayed-checkbox');
    let checkboxText = document.querySelector('#booqs-dict-popup-displayed-text');
    console.log(checkboxText);
    let toggleRequest = () => {
        checkboxText.textContent = '設定中...';
        let url = `https://www.booqs.net/ja/api/v1/extension/update_popup_displayed`;
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
                chrome.storage.local.set({ booqsDictPopupDisplayed: data.data.popup_displayed });
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
  ログインフォーム
</h1>
<p>
  ログインすることで、拡張機能から復習を設定できるようになったり、機械翻訳が利用できるようになります。
</p>
<p>
  まだBooQsにアカウントを登録されていない方は、<a href="https://www.booqs.net/ja/users/new" target="_blank" rel="noopener" class="has-text-success has-text-weight-bold">こちら</a
  >よりご登録ください。
</p>
<p>
  SNSからBooQsにご登録されたユーザー様は、<a href="https://www.booqs.net/ja/login?authentication=sns" target="_blank" rel="noopener" class="has-text-success has-text-weight-bold">こちら</a
  >からログインしてください。
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
      id="booqs-email"
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
      id="booqs-password"
      type="password"
      placeholder="パスワードを入力してください。"
      value=""
    />
  </div>
</div>
<input
  type="button"
  value="ログインする"
  class="button is-success has-text-weight-bold is-block mt-3"
  id="booqs-login-btn"
  style="width: 100%"
/>
</form>`
    let userPage = document.querySelector("#user-page");
    userPage.innerHTML = loginFormHtml;
    addEventToLoginForm();
}

// ログインフォームに、ログインのためのイベントを追加する
function addEventToLoginForm() {
    let btn = document.querySelector("#booqs-login-btn");
    const postFetch = () => {
        let email = document.querySelector("#booqs-email").value;
        // emailに+が含まれていると空白文字として解釈されてしまうのでエンコードしておく。
        // let encodedEmail = encodeURIComponent(email);
        let password = document.querySelector("#booqs-password").value;
        // let encodedPassword = encodeURIComponent(password);
        let url = `https://www.booqs.net/ja/api/v1/extension/sign_in`;
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



// 参考：https://qiita.com/akiras7171/items/37a58506b282c01ff009
/*
function getUserID() {
    return new Promise((resolve, reject) => {
        chrome.cookies.get({ url: 'https://www.booqs.net/', name: '_session_id' }, ((aCookie) => {
            if (aCookie) {
                console.log(aCookie);
                resolve(aCookie);
            } else {
                console.log("not-found");
                reject('error');
            }
        }));
    });
};
*/
