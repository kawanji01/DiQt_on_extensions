(()=>{const e="http://localhost:3000",t="Basic "+btoa(unescape(encodeURIComponent("4fc8087015e6bd355e48d5fee254822e6baa679e:2e187d8f2e6d5a324458e75b8e1c376f603a1b7d")));function n(){let n="",o="",a="",l="",c="";chrome.storage.local.get(["diqtUserPublicUid","diqtUserIconUrl","diqtUserName","diqtSelectedDictionaryId","diqtPopupDisplayed","diqtDictionaries"],(function(d){n=d.diqtUserPublicUid,o=d.diqtUserIconUrl,a=d.diqtUserName,l=d.diqtSelectedDictionaryId,c=d.diqtPopupDisplayed,""==l||null==l?(l=1,chrome.storage.local.set({diqtSelectedDictionaryId:`${l}`})):l=Number(l);let r="";c&&(r="checked");let u=`\n<div class="content has-text-centered">\n  \n    <figure class="mt-5 image is-128x128 mx-auto">\n      <img\n        class="is-rounded"\n        src="${o}"\n      />\n    </figure>\n\n    <h1 class="mt-3 is-size-4 has-text-weight-bold">\n      ${a}\n    </h1>\n\n    ${p=d.diqtDictionaries,h=l,`<div class="block has-text-centered mt-5">\n    <div class="select">\n        <select id="dictionary-select-form">\n            ${JSON.parse(p).map((e=>function(e,t){const n=e[0]===t?"selected":"";return`<option value="${e[0]}" class="has-text-weight-bold" ${n}>${e[1]}</option>`}(e,h))).join("")}\n        </select>\n    </div>\n</div>`}\n    \n\n    <dic class="block my-3">\n        <label class="checkbox" id="diqt-dict-popup-displayed">\n            <input type="checkbox" id="diqt-dict-popup-displayed-checkbox" ${r}>\n            <span id="diqt-dict-popup-displayed-text">テキストを選択したときにポップアップを表示する。</span>\n        </label>\n    </div>\n\n    \n  \n<div class="block has-text-centered">\n  <a href="https://www.diqt.net/ja/users/${n}" target="_blank" rel="noopener">\n  <button class="button is-warning is-light">マイページ</button>\n  </a>\n</div>\n\n<div class="block has-text-centered">\n  <button class="button is-warning is-light" id="logout-btn">ログアウト</button>\n</div>\n\n</div>`;var p,h;document.querySelector("#user-page").innerHTML=u,document.getElementById("dictionary-select-form").addEventListener("change",(function(e){let t=`${e.currentTarget.value}`;chrome.storage.local.set({diqtSelectedDictionaryId:t})})),function(){let n=document.querySelector("#logout-btn");n.addEventListener("click",(()=>{n.value="ログアウト中...",fetch(`${e}/ja/api/v1/extensions/sessions/logout`,{method:"POST",mode:"cors",credentials:"include",dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8",authorization:t}}).then((e=>e.json())).then((e=>{chrome.storage.local.set({diqtUserName:""}),chrome.storage.local.set({diqtUserIconUrl:""}),chrome.storage.local.set({diqtUserPublicUid:""}),chrome.storage.local.set({diqtPopupDisplayed:""}),s(),i()})).catch((e=>{console.log(e)}))}),!1)}(),function(){let n=document.querySelector("#diqt-dict-popup-displayed"),s=document.querySelector("#diqt-dict-popup-displayed-checkbox"),i=document.querySelector("#diqt-dict-popup-displayed-text");n.addEventListener("click",(()=>{i.textContent="設定中...",fetch(`${e}/ja/api/v1/extensions/users/update_popup_displayed`,{method:"POST",mode:"cors",credentials:"include",dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8",authorization:t}}).then((e=>e.json())).then((e=>{s.checked=e.data.popup_displayed,i.textContent="テキストを選択したときにポップアップを表示する。",chrome.storage.local.set({diqtPopupDisplayed:e.data.popup_displayed})})).catch((e=>{console.log(e)}))}),!1)}()}))}function s(){document.querySelector("#user-page").innerHTML='\n<div class="content">\n<h1 class="mb-5 mt-3 has-text-centered is-size-2 has-text-weight-bold">\n  ログイン\n</h1>\n<p>\n  ログインすることで、復習を設定できるようになったり、機械翻訳が利用できるようになります。\n</p>\n\n</div>\n\n<form class="fetchForm">\n<div id="feedback">\n</div>\n<div class="field">\n  <label class="label">Email</label>\n  <div class="control">\n    <input\n      class="input"\n      id="diqt-email"\n      type="email"\n      placeholder="メールアドレスを入力してください。"\n      value=""\n    />\n  </div>\n</div>\n\n<div class="field">\n  <label class="label">Password</label>\n  <div class="control">\n    <input\n      class="input"\n      id="diqt-password"\n      type="password"\n      placeholder="パスワードを入力してください。"\n      value=""\n    />\n  </div>\n</div>\n<input\n  type="button"\n  value="ログインする"\n  class="button is-success has-text-weight-bold is-block is-medium mt-5"\n  id="diqt-login-btn"\n  style="width: 100%"\n/>\n</form>\n<p>　</p>\n<h5 class="mb-3 mt-5 has-text-centered is-size-4 has-text-grey">\n<span class="has-text-weight-light">———</span> or <span class="has-text-weight-light">———</span>\n</h3>\n<div class="columns has-text-centered">\n  <div class="column is-three-fifths is-offset-one-fifth">\n    <a href="https://www.diqt.net/ja/login?authentication=sns" target="_blank" rel="noopener">\n        <button class="button is-danger my-3 is-medium is-fullwidth has-text-weight-bold">Googleで続ける</button>\n    </a>\n\n    <a href="https://www.diqt.net/ja/login?authentication=sns" target="_blank" rel="noopener">\n        <button class="button is-info my-3 is-medium is-fullwidth has-text-weight-bold">Twitterで続ける</button>\n    </a>\n\n    <a href="https://www.diqt.net/ja/login?authentication=sns" target="_blank" rel="noopener">\n        <button class="button is-black my-3 is-medium is-fullwidth has-text-weight-bold">Appleで続ける</button>\n    </a>\n\n    <p>　</p>\n    <p class="my-5 has-text-weight-bold">\n        アカウントを持っていませんか？ <a href="https://www.diqt.net/ja/users/new" target="_blank" rel="noopener" style="color: #f79c4f;">新規登録</a\n        >\n    </p>\n\n\n  </div>\n</div>\n\n',i()}function i(){document.querySelector("#diqt-login-btn").addEventListener("click",(()=>{let s=document.querySelector("#diqt-email").value,i=document.querySelector("#diqt-password").value,o=`${e}/ja/api/v1/extensions/sessions/sign_in`,a={method:"POST",mode:"cors",credentials:"include",body:JSON.stringify({email:s,password:i}),dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8",authorization:t}};fetch(o,a).then((e=>e.json())).then((e=>{if("200"==e.status)!function(e){chrome.storage.local.set({diqtUserName:e.name}),chrome.storage.local.set({diqtUserIconUrl:e.icon_url}),chrome.storage.local.set({diqtUserPublicUid:e.public_uid}),chrome.storage.local.set({diqtPopupDisplayed:e.popup_displayed})}(e.data),n();else{let e='\n                    <div class="notification is-danger is-light my-3">\n                    メールアドレスとパスワードの組み合わせが正しくありません。\n                    </div>';document.querySelector("#feedback").innerHTML=e}})).catch((e=>{console.log(e)}))}),!1)}!function(){let e=chrome.runtime.connect({name:"inspectCurrentUser"});e.postMessage({action:"inspectCurrentUser"}),e.onMessage.addListener((function(e){e.data?n():s()}))}()})();