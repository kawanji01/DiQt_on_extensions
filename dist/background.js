(()=>{const e="https://www.diqt.net";chrome.action.onClicked.addListener((function(e){chrome.tabs.sendMessage(e.id,"Action").then((e=>{})).catch((e=>{}))})),chrome.tabs.onUpdated.addListener((function(e){chrome.tabs.sendMessage(e,"Updated").then((e=>{})).catch((e=>{}))})),chrome.runtime.onMessage.addListener((function(e){switch(e.action){case"openOptionsPage":chrome.runtime.openOptionsPage()}})),chrome.runtime.onConnect.addListener((function(t){t.onMessage.addListener((function(n){switch(n.action){case"inspectCurrentUser":!async function(t){const n=await new Promise((t=>{fetch(`${e}/ja/api/v1/extensions/users/inspect_current_user`,{method:"POST",mode:"cors",credentials:"include",dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}}).then((e=>e.json())).then((e=>{e.data?function(e){chrome.storage.local.set({diqtDictUserName:e.name}),chrome.storage.local.set({diqtDictIconUrl:e.icon_url}),chrome.storage.local.set({diqtDictPublicUid:e.public_uid}),chrome.storage.local.set({diqtDictToken:e.token}),chrome.storage.local.set({diqtDictPopupDisplayed:e.popup_displayed})}(e.data):(chrome.storage.local.set({diqtDictUserName:""}),chrome.storage.local.set({diqtDictIconUrl:""}),chrome.storage.local.set({diqtDictPublicUid:""}),chrome.storage.local.set({diqtDictToken:""}),chrome.storage.local.set({diqtDictPopupDisplayed:""})),t(e.data)})).catch((e=>{console.log(e),t("error")}))}));t.postMessage({data:n})}(t);break;case"search":!async function(t,n){const o=await function(t){return new Promise((n=>{let o=`${e}/api/v1/extensions/dictionaries/1/search`,s={method:"POST",mode:"cors",credentials:"include",body:JSON.stringify({keyword:t}),dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}};fetch(o,s).then((e=>e.json())).then((e=>{n(e)})).catch((e=>{console.log(e),n(e)}))}))}(n);t.postMessage({data:o})}(t,n.keyword);break;case"createReview":!async function(t,n){const o=await function(t){return new Promise((n=>{let o=`${e}/ja/api/v1/extensions/reviews`,s={method:"POST",mode:"cors",credentials:"include",body:JSON.stringify({quiz_id:t}),dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}};fetch(o,s).then((e=>e.json())).then((e=>{n(e)})).catch((e=>{console.log(e),n(e)}))}))}(n);t.postMessage({data:o})}(t,n.quizId);break;case"updateReview":!async function(t,n,o){const s=await function(t,n){return new Promise((o=>{let s=`${e}/ja/api/v1/extensions/reviews/${t}`,a={method:"PATCH",mode:"cors",credentials:"include",body:JSON.stringify({interval_setting:n}),dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}};fetch(s,a).then((e=>e.json())).then((e=>{o(e)})).catch((e=>{console.log(e),o(e)}))}))}(n,o);t.postMessage({data:s})}(t,n.reviewId,n.settingNumber);break;case"destroyReview":!async function(t,n){const o=await function(t){return new Promise((n=>{fetch(`${e}/ja/api/v1/extensions/reviews/${t}`,{method:"DELETE",mode:"cors",credentials:"include",dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}}).then((e=>e.json())).then((e=>{n(e)})).catch((e=>{console.log(e),n(e)}))}))}(n);t.postMessage({data:o})}(t,n.reviewId);break;case"googleTranslation":!async function(t,n){const o=await function(t){return new Promise((n=>{let o=`${e}/ja/api/v1/extensions/words/google_translate`,s={method:"POST",mode:"cors",credentials:"include",body:JSON.stringify({keyword:t}),dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}};fetch(o,s).then((e=>e.json())).then((e=>{n(e)})).catch((e=>{console.log(e),n(e)}))}))}(n);t.postMessage({data:o})}(t,n.keyword);break;case"deeplTranslation":!async function(t,n){const o=await function(t){return new Promise((n=>{let o=`${e}/ja/api/v1/extensions/words/deepl_translate`,s={method:"POST",mode:"cors",credentials:"include",body:JSON.stringify({keyword:t}),dataType:"json",headers:{"Content-Type":"application/json;charset=utf-8"}};fetch(o,s).then((e=>e.json())).then((e=>{n(e)})).catch((e=>{console.log(e),n(e)}))}))}(n);t.postMessage({data:o})}(t,n.keyword)}}))}))})();