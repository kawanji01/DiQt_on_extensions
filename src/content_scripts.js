// 動かねえ：参照：https://github.com/riversun/JSFrame.js#using-npm-module-with-webpack
// import { JSFrame } from './jsframe.js';
//import './jsframe.js';
// import 文を使ってstyle.cssファイルを読み込む。参照：https://webpack.js.org/plugins/mini-css-extract-plugin/
//import './style.scss';
// 挫折：mini-css-extract-pluginを使って上記の方法でcssをimportしようとすると、JSframeが呼び出せなくなる。



// アイコンを押したときに、辞書ウィンドウの表示/非表示を切り替える。/ manifest 3 では書き方に変更があった。参照：https://blog.holyblue.jp/entry/2021/05/03/105010
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request == "Action") {
        toggleFloatingWindow();
    }
});

// 辞書ウィンドウの表示/非表示を切り替える。
function toggleFloatingWindow() {

    let extensionWrapper = document.getElementById('booqs-dict-extension-wrapper');

    if (extensionWrapper == null) {
        jsFrame = new JSFrame({
            horizontalAlign: 'right'
        })

        const form_html = '<div id="booqs-dict-extension-wrapper"><form method="get" action=""><input type="text" name="keyword" id="booqs-dict-search-form"></form><div id="booqs-dict-search-status">"<span id="booqs-dict-search-keyword"></span>"<span id="booqs-dict-search-status-text">の検索結果</span></div><div id="search-booqs-dict-results"></div></div>'

        let frame = jsFrame.create({
            name: 'booqs-dict-window',
            title: 'BooQs Dictionary',
            width: 320,
            height: 480,
            movable: true, //マウスで移動可能
            resizable: true, //マウスでリサイズ可能
            appearanceName: 'material',
            appearanceParam: {
                border: {
                    shadow: '2px 2px 10px  rgba(0, 0, 0, 0.5)',
                    width: 0,
                    radius: 6,
                },
                titleBar: {
                    name: 'booqs-dict-window-bar',
                    color: 'white',
                    // Brand color
                    background: '#273132',
                    leftMargin: 16,
                    height: 30,
                    fontSize: 14,
                    buttonWidth: 36,
                    buttonHeight: 16,
                    buttonColor: 'white',
                    buttons: [ // buttons on the right
                        {
                            //Set font-awesome fonts(https://fontawesome.com/icons?d=gallery&m=free)
                            fa: 'fas fa-times', //code of font-awesome
                            name: 'closeButton',
                            visible: true // visibility when window is created.
                        },
                    ],
                },
            },
            style: {
                overflow: 'auto'
            },
            html: form_html
        });
        console.log(frame);
        frame.setPosition(-20, 100, ['RIGHT_TOP']);
        frame.show();
        frame.requestFocus();
        let searchForm = document.querySelector('#booqs-dict-search-form');
        // ドラッグしたテキストを辞書で検索できるようにする。
        searchSelectedText(searchForm);
        // フォーム経由の検索できるようにする。
        searchViaForm(searchForm);
        // 検索フォームへのエンターを効かないようにする。
        preventEnter(searchForm);
        // wiki記法をクリックするだけで検索できるようにする。
        //activateClickSearch(searchForm);

    } else {
        extensionWrapper.parentNode.parentNode.parentNode.parentNode.parentNode.remove()
    }

}



// ドラッグしたテキストを辞書で検索する
function searchSelectedText(form) {
    document.addEventListener('mouseup', function(evt) {
        const selTxt = window.getSelection().toString();
        const previousKeyword = document.querySelector('#booqs-dict-search-keyword').textContent;
        // 検索フォーム
        if (selTxt != '' && previousKeyword != selTxt && selTxt.length < 50) {
            form.value = selTxt;
            searchWord(selTxt);
            //イベントの予期せぬ伝播を防ぐための記述
            evt.stopPropagation();
        }
    }, false);
}


// 検索フォームの入力に応じて検索する。
function searchViaForm(form) {
    form.addEventListener('keyup', function() {
        let keyword = form.value
        let previousKeyword = document.querySelector('#booqs-dict-search-keyword').textContent;
        const search = () => {
            let currentKeyword = document.querySelector('#booqs-dict-search-form').value;
            if (keyword == currentKeyword && keyword != previousKeyword && keyword.length < 50) {
                searchWord(keyword);
            }
        }
        setTimeout(search, 500);
    });
}


// 検索フォームへのエンターを効かないようにする。
function preventEnter(form) {
    form.addEventListener('keydown', function(e) {
        if (e.key == 'Enter') {
            e.preventDefault();
        }
    });
}


// keywordをBooQsの辞書で検索する
function searchWord(keyword) {
    // 検索キーワードを更新する
    let searchKeyword = document.querySelector('#booqs-dict-search-keyword');
    searchKeyword.textContent = keyword;
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

// 検索結果を表示する
function searchSuccess(data) {
    console.log(data['data']);
    let resultForm = document.querySelector('#search-booqs-dict-results');
    resultForm.innerHTML = '';
    if (data['data'] != null) {
        data['data'].forEach(function(item, index, array) {
            console.log(item, index)
            let tags = createTagsHtml(item['tags']);
            let entry = '<div class="booqs-dict-entry">' + item['entry'] + '</div>';
            let meaning = '<div class="booqs-dict-meaning">' + item['meaning'] + '</div>';
            let explanation = '<div class="booqs-dict-explanation">' + markNotation(item['explanation']) + '</div>'
            let wordURL = `https://www.booqs.net/ja/words/${item['id']}`
            let reviewBtn = `<a href="${wordURL}?type=review" target="_blank" rel="noopener"><div class="booqs-dict-review-btn">復習する</div></a>`
            let linkToImprove = `<a href="${wordURL + '/edit'}" target="_blank" rel="noopener" class="booqs-dict-link-to-improve">この項目を改善する</a>`
            let dict = tags + entry + meaning + explanation + reviewBtn + linkToImprove

            resultForm.insertAdjacentHTML('beforeend', dict);
            // 解説のクリックサーチを有効にする
            activateClickSearch(resultForm);
        })
    } else {
        let keyword = document.querySelector('#booqs-dict-search-keyword').textContent;
        let notFound = `<div class="booqs-dict-meaning" style="margin: 24px 0;">${keyword}は辞書に登録されていません。</div>`
        let createNewWord = `<a href="https://www.booqs.net/ja/words/new?dict_uid=c6bbf748&text=${keyword}" target="_blank" rel="noopener"><div class="booqs-dict-review-btn" style="font-weight: bold;">辞書に登録する</div></a>`
        let result = notFound + createNewWord
        resultForm.insertAdjacentHTML('afterbegin', result);
    }

}


// 記法が使われた解説テキストをマークアップする。
function markNotation(text) {
    //const expObj = result.querySelector('booqs-dict-explanation');
    // 改行コードをすべて<br>にする。
    let expTxt = text.replace(/\r?\n/g, '<br>');
    // wiki記法（[[text]]）でテキストを分割する。
    let expTxtArray = expTxt.split(/(\[{2}.*?\]{2})/);
    let processedArray = [];
    expTxtArray.forEach(function(item, index, array) {
        if (item.match(/\[{2}.+\]{2}/) == null) {
            processedArray.push(item);
        } else {
            item = item.replace(/\[{2}/g, "").replace(/\]{2}/g, "");
            item = item.split(/\|/, 2);
            let linkHtml;
            if (item[1] == undefined) {
                linkHtml = `<a class="booqs-notation-link" data-value="${item[0]}">${item[0]}</a>`
            } else {
                linkHtml = `<a class="booqs-notation-link" data-value="${item[1]}">${item[0]}</a>`
            }
            processedArray.push(linkHtml);
        }
    })
    return processedArray.join('')
}

// wiki記法でリンクになっている単語をクリックすると、自動で辞書を検索するようにする。
function activateClickSearch(results) {
    let links = results.querySelectorAll('.booqs-notation-link')
    let searchForm = document.querySelector('#booqs-dict-search-form');
    links.forEach(function(target) {
        target.addEventListener('click', function(event) {
            let keyword = event.target.dataset["value"];
            // 検索フォームのvalueとキーワードが異なるなら検索を実行する
            if (searchForm.value != keyword) {
                searchForm.value = keyword;
                searchWord(keyword);
            }
            // 画面遷移をキャンセル
            return false;
        });
    })
}

// タグのhtmlを作成する
function createTagsHtml(text) {
    if (text == null) {
        return `<div class="booqs-dict-word-tags-wrapper"></div>`
    }

    let tagsArray = text.split(',');
    let tagsHtmlArray = [];
    if (tagsArray.includes('ngsl')) {
        let ngsl = `<a href="https://www.booqs.net/ja/chapters/c63ab6e5" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>基礎英単語</a>`
        tagsHtmlArray.push(ngsl);
    }
    if (tagsArray.includes('nawl')) {
        let nawl = `<a href="https://www.booqs.net/ja/chapters/5cedf1da" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>学術頻出語</a>`
        tagsHtmlArray.push(nawl);
    }
    if (tagsArray.includes('tsl')) {
        let tsl = `<a href="https://www.booqs.net/ja/chapters/26c399f0" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>TOEIC頻出語</a>`
        tagsHtmlArray.push(tsl);
    }
    if (tagsArray.includes('bsl')) {
        let bsl = `<a href="https://www.booqs.net/ja/chapters/4d46ce7f" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>ビジネス頻出語</a>`
        tagsHtmlArray.push(bsl);
    }
    if (tagsArray.includes('phrase')) {
        let phrase = `<a href="https://www.booqs.net/ja/chapters/c112b566" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>頻出英熟語</a>`
        tagsHtmlArray.push(phrase);
    }
    if (tagsArray.includes('phave')) {
        let phave = `<a href="https://www.booqs.net/ja/chapters/3623e0d5" target="_blank" rel="noopener" class="booqs-dict-word-tag"><i class="fal fa-tag"></i>頻出句動詞</a>`
        tagsHtmlArray.push(phave);
    }
    return `<div class="booqs-dict-word-tags-wrapper">${tagsHtmlArray.join('')}</div>`
}