/*console.log('background');
document.addEventListener('mouseup', function(evt) {

    var selObj = window.getSelection();
    //alert("選択した文字列: " + selObj);
    //イベントの予期せぬ伝播を防ぐための記述
    const popup = document.getElementById('booqs-dict-popup');
    const p = document.createElement('p');
    if (selObj != '') {
        p.textContent(selObj);
        popup.appendChild(p);
        evt.stopPropagation();
    }


}, false);

let floatingWindow = document.getElementsByClassName('jsframe-titlebar-focused');
console.log(floatingWindow.length);




// 拡張機能がインストールされたときの処理
chrome.runtime.onInstalled.addListener(function() {

    console.log('runtime');
    // 親階層のメニューを生成
    const parent_menu = chrome.contextMenus.create({
        type: "normal",
        id: "parent",
        title: "背景色を変えるメニュー"
    });

    //子階層のメニューを親(parent_menu)に追加
    chrome.contextMenus.create({
        id: "red",
        parentId: parent_menu,
        title: "赤色"
    });

    chrome.contextMenus.create({
        id: "blue",
        parentId: parent_menu,
        title: "青色"
    });
});
*/

// manifest 3では書き方が変わっている：参照：https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#action-api-unification
chrome.action.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, "Action");
});