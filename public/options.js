// ログイン済みかそうでないかの状態を返す関数。
function inspectState() {
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

// アクセスして一番最初に実行する関数。
async function initializePage() {
    const state = await inspectState();
    if (state == 'loggedIn') {
        renderProfile();
    } else {
        renderLoginForm();
    }
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




// プロフィールページ（ログイン済み画面）をレンダリングする
function renderProfile() {
    let uid = '';
    let iconUrl = '';
    let userName = '';
    chrome.storage.local.get(['booqsDictPublicUid', 'booqsDictIconUrl', 'booqsDictUserName'], function (result) {
        uid = result.booqsDictPublicUid;
        iconUrl = result.booqsDictIconUrl;
        userName = result.booqsDictUserName;

        let profileHtml = `
<div class="content has-text-centered">
  <a href="https://www.booqs.net/ja/users/${uid}" target="_blank" rel="noopener">
    <figure class="mt-5 image is-128x128 mx-auto">
      <img
        class="is-rounded"
        src="${iconUrl}"
      />
    </figure>

    <h1 class="mt-3 is-size-4 has-text-weight-bold">
      ${userName}
    </h1>
  </a>
  <button class="button is-warning is-light mx-auto my-3" id="logout-btn">ログアウト</button>
</div>`
        let userPage = document.querySelector("#user-page");
        userPage.innerHTML = profileHtml;
        addEventToProfile()
    });
}

// プロフィールページのログアウトボタンなどのイベント追加
function addEventToProfile() {
    let logoutBtn = document.querySelector("#logout-btn");
    let logoutRequest = () => {
        logoutBtn.value = 'ログアウト中...'
        chrome.storage.local.get(['booqsDictToken'], function (result) {
            let token = result.booqsDictToken
            let url = `https://www.booqs.net/ja/api/v1/extension/log_out?booqs_dict_token=` + token;
            let params = {
                method: "POST",
                body: JSON.stringify({ booqs_dict_token: token })
            };

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
        });
    }
    logoutBtn.addEventListener("click", logoutRequest, false);
}

// ログインフォームをレンダリングする
function renderLoginForm() {
    let loginFormHtml = `
<div class="content">
<h1 class="mb-5 mt-3 has-text-centered is-size-2 has-text-weight-bold">
  ログインフォーム
</h1>
<p>
  ログインすることで、拡張機能から直接復習を設定できるようになります。
</p>
<p>
  まだBooQsにアカウントを登録されていない方は、<a href="">こちら</a
  >よりご登録ください。
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
      placeholder="Email input"
      value="sakushahushou@gmail.com"
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
      placeholder="Text input"
      value="foobar"
    />
  </div>
</div>
<input
  type="button"
  value="送信"
  class="button is-primary is-link is-block mt-3"
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
        console.log('clickBtn');
        let email = document.querySelector("#booqs-email").value;
        // emailに+が含まれていると空白文字として解釈されてしまうのでエンコードしておく。
        let encodedEmail = encodeURIComponent(email);
        let password = document.querySelector("#booqs-password").value;
        let encodedPassword = encodeURIComponent(password);
        console.log(encodedEmail);
        console.log(encodedPassword);
        let url = `https://www.booqs.net/ja/api/v1/extension/sign_in?email=${encodedEmail}&password=${encodedPassword}`;
        let params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ email: encodedEmail, password: encodedPassword })
        };
        console.log(url);

        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data['status'] == '200') {
                    setUserData(data['data']);
                    renderProfile();
                } else {
                    console.log(data);
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