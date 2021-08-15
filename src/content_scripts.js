// 動かねえ：参照：https://github.com/riversun/JSFrame.js#using-npm-module-with-webpack
// import { JSFrame } from './jsframe.js';
//import './jsframe.js';
// import 文を使ってstyle.cssファイルを読み込む。参照：https://webpack.js.org/plugins/mini-css-extract-plugin/
//import './style.scss';

document.addEventListener('mouseup', function(evt) {

    var selObj = window.getSelection();
    const searchForm = document.querySelector('#booqs-dict-search-form');
    if (searchForm != null && selObj != '') {
        searchForm.value = selObj;
        searchWord(selObj);
        //イベントの予期せぬ伝播を防ぐための記述
        evt.stopPropagation();
    }

}, false);

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    if (request == "Action") {
        toggleFloatingWindow();
    }
});

function toggleFloatingWindow() {

    let floadtingWindow = document.getElementsByClassName('jsframe-titlebar-focused');


    if (floadtingWindow.length == 0) {
        jsFrame = new JSFrame({
            horizontalAlign: 'right'
        })

        const form_html = '<div id="booqs-dict-extension-wrapper"><form method="get" action=""><input type="text" name="keyword" id="booqs-dict-search-form"></form><div id ="search-booqs-dict-results"></div></div>'

        let frame = jsFrame.create({
            name: 'booqs-dict-window',
            title: 'BooQs Dictionary',
            width: 320,
            height: 480,
            movable: true, //マウスで移動可能
            resizable: true, //マウスでリサイズ可能
            style: {
                overflow: 'auto'
            },
            html: form_html
        });
        console.log(frame);
        frame.setPosition(-20, 20, ['RIGHT_TOP']);
        frame.show();
        frame.requestFocus();
        console.log("show");

    } else {
        floadtingWindow[0].parentNode.parentNode.remove()
    }

}

function searchWord(keyword) {

    let url = 'https://www.booqs.net/api/v1/extension/search?keyword=' + encodeURIComponent(keyword)

    fetch(url, {
            method: 'GET',
            //body: JSON.stringify({ number: 18 }),
            //headers: { 'Content-Type': 'application/json' },
        })
        .then(res => res.json())
        .then(jsonData => {
            searchSuccess(jsonData)
        })
        .catch(error => { console.log(error); });
}

function searchSuccess(data) {
    console.log(data['data']);
    let resultForm = document.querySelector('#search-booqs-dict-results');
    resultForm.innerHTML = '';
    data['data'].forEach(function(item, index, array) {
            console.log(item, index)
            let entry = '<div class="booqs-dict-entry">' + item['entry'] + '</div>';
            let meaning = '<div class="booqs-dict-meaning">' + item['meaning'] + '</div>';
            let explanation = '<div class="booqs-dict-explanation">' + item['explanation'] + '</div>'
            let reviewURL = `https://www.booqs.net/ja/words/${item['id']}`
            let reviewBtn = `<a href="${reviewURL}" target="_blank" rel="noopener"><div class="booqs-dict-review-btn">復習する</div></a>`
            let dict = entry + meaning + explanation + reviewBtn

            resultForm.insertAdjacentHTML('afterbegin', dict);
        })
        // 通信成功時の処理を記述
    console.log('success');
}