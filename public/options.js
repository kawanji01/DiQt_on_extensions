// diqtのルートURLの設定。ngrokを利用する場合には、こことbackground.jsの定数をngrokのURLに書き換える。
const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
const diqtUrl = `${process.env.ROOT_URL}/${locale}`;
const apiKey = process.env.API_KEY;
const secret = process.env.SECRET_KEY;
const basicAuth = "Basic " + btoa(unescape(encodeURIComponent(apiKey + ":" + secret)));


// アクセスして一番最初に実行する関数。
function initializePage() {
    const port = chrome.runtime.connect({ name: "inspectCurrentUser" });
    port.postMessage({ action: "inspectCurrentUser" });
    port.onMessage.addListener(function (msg) {
        const data = msg['data'];
        if (data.status == 200) {
            renderMypage();
        } else {
            renderLoginForm();
        }
    });
}


// localStorageにユーザーデータを格納する。
function setUserData(data) {
    chrome.storage.local.set({ diqtUserName: data['name'] });
    chrome.storage.local.set({ diqtUserIconUrl: data['icon_url'] });
    chrome.storage.local.set({ diqtUserPublicUid: data['public_uid'] });
    chrome.storage.local.set({ diqtPopupDisplayed: data['popup_displayed'] });
}

// localStorageのユーザーデータをすべて消去する
function resetUserData() {
    chrome.storage.local.set({ diqtUserName: '' });
    chrome.storage.local.set({ diqtUserIconUrl: '' });
    chrome.storage.local.set({ diqtUserPublicUid: '' });
    chrome.storage.local.set({ diqtPopupDisplayed: '' });
}


// プロフィールページ（ログイン済み画面）をレンダリングする
function renderMypage() {
    let uid = '';
    let iconUrl = '';
    let userName = '';
    let selectedDictionaryId = '';
    let popupDisplayed = '';
    chrome.storage.local.get(['diqtUserPublicUid', 'diqtUserIconUrl', 'diqtUserName', 'diqtSelectedDictionaryId', 'diqtPopupDisplayed', 'diqtDictionaries'], function (result) {
        uid = result.diqtUserPublicUid;
        iconUrl = result.diqtUserIconUrl;
        userName = result.diqtUserName;
        selectedDictionaryId = result.diqtSelectedDictionaryId;
        popupDisplayed = result.diqtPopupDisplayed;

        if (selectedDictionaryId == '' || selectedDictionaryId == undefined) {
            selectedDictionaryId = 1;
            chrome.storage.local.set({ diqtSelectedDictionaryId: `${selectedDictionaryId}` });
        } else {
            selectedDictionaryId = Number(selectedDictionaryId);
        }
        let checked = ''
        if (popupDisplayed) {
            checked = 'checked';
        }

        const profileHtml = `
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

    ${createDictionarySelectForm(result.diqtDictionaries, selectedDictionaryId)}

    <div class="block has-text-centered">
        <a href="${diqtUrl}" target="_blank" rel="noopener">
            <button class="button is-warning is-light">${chrome.i18n.getMessage("addOrRemoveDictionaries")}</button>
        </a>
    </div>
    

    <dic class="block my-3">
        <label class="checkbox" id="diqt-dict-popup-displayed">
            <input type="checkbox" id="diqt-dict-popup-displayed-checkbox" ${checked}>
            <span id="diqt-dict-popup-displayed-text">${chrome.i18n.getMessage("displayPopup")}</span>
        </label>
    </div>

    
  
<div class="block has-text-centered">
  <a href="${diqtUrl}/users/${uid}" target="_blank" rel="noopener">
  <button class="button is-warning is-light">${chrome.i18n.getMessage("myPage")}</button>
  </a>
</div>

<div class="block has-text-centered">
  <button class="button is-warning is-light" id="logout-btn">${chrome.i18n.getMessage("logOut")}</button>
</div>

</div>`
        const userPage = document.querySelector("#user-page");
        userPage.innerHTML = profileHtml;
        addEventToSelectForm();
        addEventToLogout();
        AddEventToPopupDisplayed();
    });
}

// 辞書のセレクトフォームを作成
function createDictionarySelectForm(dictionaries, value) {
    const dictionaryAry = JSON.parse(dictionaries);
    const optionsHtml = dictionaryAry.map(item => createOption(item, value)).join('');
    return `<div class="block has-text-centered mt-5">
    <div class="select">
        <select id="dictionary-select-form">
            ${optionsHtml}
        </select>
    </div>
</div>`
}
// 辞書のセレクトフォームのオプションを作成
function createOption(item, value) {
    // item[0] は配列の最初の要素（value属性のためのもの）として想定されます。
    // item[1] は配列の2番目の要素（表示テキストとして想定される）として想定されます。
    const isSelected = item[0] === value ? 'selected' : '';
    return `<option value="${item[0]}" class="has-text-weight-bold" ${isSelected}>${item[1]}</option>`;
}

// 辞書の切り替え
function addEventToSelectForm() {
    const selectForm = document.getElementById('dictionary-select-form');
    const setDictionaryId = function (event) {
        const selectedDictionaryId = `${event.currentTarget.value}`;
        chrome.storage.local.set({ diqtSelectedDictionaryId: selectedDictionaryId });
    }
    selectForm.addEventListener('change', setDictionaryId);
}




// プロフィールページのログアウトボタンにイベントを追加
function addEventToLogout() {
    const logoutBtn = document.querySelector("#logout-btn");
    const logoutRequest = () => {
        logoutBtn.value = chrome.i18n.getMessage("loggingOut");
        const url = `${diqtUrl}/api/v1/extensions/sessions/logout`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': basicAuth,
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
    const checkboxLabel = document.querySelector('#diqt-dict-popup-displayed');
    const checkbox = document.querySelector('#diqt-dict-popup-displayed-checkbox');
    const checkboxText = document.querySelector('#diqt-dict-popup-displayed-text');
    const toggleRequest = () => {
        checkboxText.textContent = chrome.i18n.getMessage("nowSetting");
        const url = `${diqtUrl}/api/v1/extensions/users/update_popup_displayed`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': basicAuth,
            }
        }

        fetch(url, params)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                checkbox.checked = data.data.popup_displayed;
                checkboxText.textContent = chrome.i18n.getMessage("displayPopup");
                chrome.storage.local.set({ diqtPopupDisplayed: data.data.popup_displayed });
            })
            .catch((error) => {
                console.log(error);
            });
    }
    checkboxLabel.addEventListener("click", toggleRequest, false);
}

// ログインフォームをレンダリングする
function renderLoginForm() {
    const loginFormHtml = `
<div class="content">
<h1 class="mb-5 mt-3 has-text-centered is-size-2 has-text-weight-bold">
  ${chrome.i18n.getMessage("loginTitle")}
</h1>
<p>
${chrome.i18n.getMessage("loginDescription")}
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
      placeholder="${chrome.i18n.getMessage("emailPlaceholder")}"
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
      placeholder="${chrome.i18n.getMessage("passwordPlaceholder")}"
      value=""
    />
  </div>
</div>
<input
  type="button"
  value="${chrome.i18n.getMessage("login")}"
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
    <a href="${diqtUrl}/login?authentication=sns" target="_blank" rel="noopener">
        <button class="button is-danger my-3 is-medium is-fullwidth has-text-weight-bold">${chrome.i18n.getMessage("continueWithGoogle")}</button>
    </a>

    <a href="${diqtUrl}/login?authentication=sns" target="_blank" rel="noopener">
        <button class="button is-black my-3 is-medium is-fullwidth has-text-weight-bold">${chrome.i18n.getMessage("continueWithApple")}</button>
    </a>

    <p>　</p>
    <p class="my-5 has-text-weight-bold">
    ${chrome.i18n.getMessage("noAccount")} <a href="${diqtUrl}/users/new" target="_blank" rel="noopener" style="color: #f79c4f;">${chrome.i18n.getMessage("signUp")}</a>
    </p>


  </div>
</div>

`
    const userPage = document.querySelector("#user-page");
    userPage.innerHTML = loginFormHtml;
    addEventToLoginForm();
}

// ログインフォームに、ログインのためのイベントを追加する
function addEventToLoginForm() {
    const btn = document.querySelector("#diqt-login-btn");
    const postFetch = () => {
        const email = document.querySelector("#diqt-email").value;
        // emailに+が含まれていると空白文字として解釈されてしまうのでエンコードしておく。
        // const encodedEmail = encodeURIComponent(email);
        const password = document.querySelector("#diqt-password").value;
        // const encodedPassword = encodeURIComponent(password);
        const url = `${diqtUrl}/api/v1/extensions/sessions/sign_in`;
        const params = {
            method: "POST",
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ email: email, password: password }),
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'authorization': basicAuth,
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
                    const errorHtml = `
                    <div class="notification is-danger is-light my-3">
                    ${chrome.i18n.getMessage("wrongCombination")}
                    </div>`
                    const feedback = document.querySelector('#feedback');
                    feedback.innerHTML = errorHtml;
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };
    btn.addEventListener("click", postFetch, false);
}

// アプリの宣伝リンクをレンダリングする
function renderAppLinks() {
    const appLinks = document.querySelector("#app-links");
    let buttonHtml = '';
    if (locale == 'ja') {
        buttonHtml = `
        <a href="https://apps.apple.com/jp/app/diqt/id1594559036?uo=4" target="_blank" rel="nofollow"
            class="appreach__aslink"><img src="https://nabettu.github.io/appreach/img/itune_ja.svg"></a>
        <a href="https://play.google.com/store/apps/details?id=com.booqs.booqs_mobile" target="_blank" rel="nofollow"
            class="appreach__gplink"><img src="https://nabettu.github.io/appreach/img/gplay_ja.png"></a>`;
    } else {
        buttonHtml = `
        <a href="https://apps.apple.com/en/app/diqt/id1594559036?uo=4" target="_blank" rel="nofollow"
            class="appreach__aslink"><img src="https://diqt.s3.ap-northeast-1.amazonaws.com/assets/images/lp/app_store_en.png"></a>
        <a href="https://play.google.com/store/apps/details?id=com.booqs.booqs_mobile" target="_blank" rel="nofollow"
            class="appreach__gplink"><img src="https://diqt.s3.ap-northeast-1.amazonaws.com/assets/images/lp/google_play_en.png"></a>`;
    }
    const appLinksHtml = ` 
    <h5 class="mb-5 mt-3 has-text-centered has-text-weight-bold">
    ${chrome.i18n.getMessage("appLinksTitle")}
  </h5>

  <div class="appreach">
    <img
      src="https://is2-ssl.mzstatic.com/image/thumb/Purple112/v4/5f/68/68/5f68681f-631e-d7c8-8d1c-bb964ff65aed/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.jpg"
      alt="DiQt" class="appreach__icon">
    <div class="appreach__detail">
      <p class="appreach__name">DiQt</p>
      <p class="appreach__info"><span class="appreach__price">${chrome.i18n.getMessage("free")}</span></p>
      <p class="appreach__star">
        <span class="appreach__star__base">★★★★★</span><span class="appreach__star__evaluate"
          style="width: 90%;">★★★★★</span>
      </p>
    </div>
    <div class="appreach__links">
        ${buttonHtml}
    </div>
  </div>` ;
    appLinks.innerHTML = appLinksHtml;
}


function renderFooter() {
    const footer = document.querySelector("#diqt-footer");
    const footerHtml = `
    <div class="content has-text-centered has-text-light">
      <div class="columns">
        <div class="column">
          <div class="my-2">
            <a href="${diqtUrl}" target="_blank" rel="noopener" class="has-text-success-light">${chrome.i18n.getMessage("aboutDiQt")}</a>
          </div>

          <div class="my-2">
            <a href="https://chrome.google.com/webstore/detail/booqs-dictionary/khgjdchimekphdebkmcknjkphkbpbpkj"
              target="_blank" rel="noopener" class="has-text-success-light">${chrome.i18n.getMessage("storePage")}</a>
          </div>

          

          <div class="my-2">
            <a href="${diqtUrl}/about" target="_blank" rel="noopener"
              class="has-text-success-light">${chrome.i18n.getMessage("company")}</a>
          </div>

          <div class="my-2">
            <a href="${diqtUrl}/contact" target="_blank" rel="noopener"
              class="has-text-success-light">${chrome.i18n.getMessage("contact")}</a>
          </div>

          <div class="my-2">
            <a href="${diqtUrl}/legal" target="_blank" rel="noopener"
                class="has-text-success-light">${chrome.i18n.getMessage("legal")}</a>
          </div>

          <div class="my-2">
            <a href="${diqtUrl}/terms_of_service" target="_blank" rel="noopener"
              class="has-text-success-light">${chrome.i18n.getMessage("termsOfService")}</a>
          </div>

          <div class="my-2">
            <a href="${diqtUrl}/privacy_policy" target="_blank" rel="noopener"
              class="has-text-success-light">${chrome.i18n.getMessage("privacyPolicy")}</a>
          </div>

        </div>
      </div>
    </div>
    `;
    footer.innerHTML = footerHtml;
}


// ページのイニシャライズして、ログインフォームかプロフィールページのどちらかを表示する）
initializePage();
const appName = document.querySelector("#app-name");
appName.textContent = chrome.i18n.getMessage("appName");
renderAppLinks();
renderFooter();