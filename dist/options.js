const booqsRootUrl="https://www.booqs.net";function initializePage(){let e=chrome.runtime.connect({name:"inspectCurrentUser"});e.postMessage({action:"inspectCurrentUser"}),e.onMessage.addListener((function(e){e.data?renderMypage():renderLoginForm()}))}function setUserData(e){chrome.storage.local.set({booqsDictUserName:e.name}),chrome.storage.local.set({booqsDictIconUrl:e.icon_url}),chrome.storage.local.set({booqsDictPublicUid:e.public_uid}),chrome.storage.local.set({booqsDictToken:e.token}),chrome.storage.local.set({booqsDictPopupDisplayed:e.popup_displayed})}function resetUserData(){chrome.storage.local.set({booqsDictUserName:""}),chrome.storage.local.set({booqsDictIconUrl:""}),chrome.storage.local.set({booqsDictPublicUid:""}),chrome.storage.local.set({booqsDictToken:""}),chrome.storage.local.set({booqsDictPopupDisplayed:""})}function renderMypage(){let e="",t="",o="",n="";chrome.storage.local.get(["booqsDictPublicUid","booqsDictIconUrl","booqsDictUserName","booqsDictPopupDisplayed"],(function(s){e=s.booqsDictPublicUid,t=s.booqsDictIconUrl,o=s.booqsDictUserName,n=s.booqsDictPopupDisplayed;let a="";n&&(a="checked");let i=`\n<div class="content has-text-centered">\n  \n    <figure class="mt-5 image is-128x128 mx-auto">\n      <img\n        class="is-rounded"\n        src="${t}"\n      />\n    </figure>\n\n    <h1 class="mt-3 is-size-4 has-text-weight-bold">\n      ${o}\n    </h1>\n\n    <dic class="block my-3">\n<label class="checkbox" id="booqs-dict-popup-displayed">\n  <input type="checkbox" id="booqs-dict-popup-displayed-checkbox" ${a}>\n  <span id="booqs-dict-popup-displayed-text">テキストを選択したときにポップアップを表示する。</span>\n</label>\n    </div>\n  \n<div class="block has-text-centered">\n  <a href="https://www.booqs.net/ja/users/${e}" target="_blank" rel="noopener">\n  <button class="button is-warning is-light">マイページ</button>\n  </a>\n</div>\n\n<div class="block has-text-centered">\n  <button class="button is-warning is-light" id="logout-btn">ログアウト</button>\n</div>\n\n</div>`;document.querySelector("#user-page").innerHTML=i,addEventToLogout(),AddEventToPopupDisplayed()}))}function addEventToLogout(){let e=document.querySelector("#logout-btn");e.addEventListener("click",(()=>{e.value="ログアウト中...",fetch(`${booqsRootUrl}/ja/api/v1/extensions/sessions/logout`,{method:"POST",mode:"cors",credentials:"include",dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}}).then((e=>e.json())).then((e=>{resetUserData(),renderLoginForm(),addEventToLoginForm()})).catch((e=>{console.log(e)}))}),!1)}function AddEventToPopupDisplayed(){let e=document.querySelector("#booqs-dict-popup-displayed"),t=document.querySelector("#booqs-dict-popup-displayed-checkbox"),o=document.querySelector("#booqs-dict-popup-displayed-text");e.addEventListener("click",(()=>{o.textContent="設定中...",fetch(`${booqsRootUrl}/ja/api/v1/extensions/users/update_popup_displayed`,{method:"POST",mode:"cors",credentials:"include",dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}}).then((e=>e.json())).then((e=>{t.checked=e.data.popup_displayed,o.textContent="テキストを選択したときにポップアップを表示する。",chrome.storage.local.set({booqsDictPopupDisplayed:e.data.popup_displayed})})).catch((e=>{console.log(e)}))}),!1)}function renderLoginForm(){document.querySelector("#user-page").innerHTML='\n<div class="content">\n<h1 class="mb-5 mt-3 has-text-centered is-size-2 has-text-weight-bold">\n  ログイン\n</h1>\n<p>\n  ログインすることで、復習を設定できるようになったり、機械翻訳が利用できるようになります。\n</p>\n\n</div>\n\n<form class="fetchForm">\n<div id="feedback">\n</div>\n<div class="field">\n  <label class="label">Email</label>\n  <div class="control">\n    <input\n      class="input"\n      id="booqs-email"\n      type="email"\n      placeholder="メールアドレスを入力してください。"\n      value=""\n    />\n  </div>\n</div>\n\n<div class="field">\n  <label class="label">Password</label>\n  <div class="control">\n    <input\n      class="input"\n      id="booqs-password"\n      type="password"\n      placeholder="パスワードを入力してください。"\n      value=""\n    />\n  </div>\n</div>\n<input\n  type="button"\n  value="ログインする"\n  class="button is-success has-text-weight-bold is-block is-medium mt-5"\n  id="booqs-login-btn"\n  style="width: 100%"\n/>\n</form>\n<p>　</p>\n<h5 class="mb-3 mt-5 has-text-centered is-size-4 has-text-grey">\n<span class="has-text-weight-light">———</span> or <span class="has-text-weight-light">———</span>\n</h3>\n<div class="columns has-text-centered">\n  <div class="column is-three-fifths is-offset-one-fifth">\n    <a href="https://www.booqs.net/ja/login?authentication=sns" target="_blank" rel="noopener">\n        <button class="button is-danger my-3 is-medium is-fullwidth has-text-weight-bold">Googleで続ける</button>\n    </a>\n\n    <a href="https://www.booqs.net/ja/login?authentication=sns" target="_blank" rel="noopener">\n        <button class="button is-info my-3 is-medium is-fullwidth has-text-weight-bold">Twitterで続ける</button>\n    </a>\n\n    <a href="https://www.booqs.net/ja/login?authentication=sns" target="_blank" rel="noopener">\n        <button class="button is-black my-3 is-medium is-fullwidth has-text-weight-bold">Appleで続ける</button>\n    </a>\n\n    <p>　</p>\n    <p class="my-5 has-text-weight-bold">\n        アカウントを持っていませんか？ <a href="https://www.booqs.net/ja/users/new" target="_blank" rel="noopener" style="color: #f79c4f;">新規登録</a\n        >\n    </p>\n\n\n  </div>\n</div>\n\n',addEventToLoginForm()}function addEventToLoginForm(){document.querySelector("#booqs-login-btn").addEventListener("click",(()=>{let e=document.querySelector("#booqs-email").value,t=document.querySelector("#booqs-password").value,o=`${booqsRootUrl}/ja/api/v1/extensions/sessions/sign_in`,n={method:"POST",mode:"cors",credentials:"include",body:JSON.stringify({email:e,password:t}),dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}};fetch(o,n).then((e=>e.json())).then((e=>{if("200"==e.status)setUserData(e.data),renderMypage();else{let e='\n                    <div class="notification is-danger is-light my-3">\n                    メールアドレスとパスワードの組み合わせが正しくありません。\n                    </div>';document.querySelector("#feedback").innerHTML=e}})).catch((e=>{console.log(e)}))}),!1)}initializePage();