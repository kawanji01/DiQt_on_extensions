import { Review } from './review.js';
export class Word {

    // WordのHTMLを作成する
    static createWordHtml(word, loginToken) {
        //let tags = createTagsHtml(word.tags);
        let wordURL = `https://www.diqt.net/ja/words/${word.id}`;
        /* タイトル */
        let entry = `<div class="diqt-dict-entry">
                                <span>${word.entry}</span><button class="diqt-dict-speech-btn"><i class="fas fa-volume-up"></i></button>
                             </div>`;
        /* 意味 */
        let meaning = `<div class="diqt-dict-meaning">${markNotation(word.meaning)}</div>`;
        /* 意味の翻訳ボタン */
        let meaningTranslation = createMeaningTranslation(word);
        /* 復習ボタン */
        let review = word.review;
        let quizId = word.quiz.id;
        let reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quizId}">${Review.createReviewBtnHtml(quizId, review, loginToken)}</div>`;

        /* 解説 */
        //let explanationLabel = '';
        //let explanation = '';
        //if (word.explanation) {
        //    explanationLabel = `<div style="text-align: left; margin-top: 16px"><div class="diqt-dict-label">解説</div></div>`
        //    explanation = `<div class="diqt-dict-explanation">${markNotation(word.explanation)}</div>`
        //}
        //let explanationBtn = `<a href="${wordURL}" target="_blank" rel="noopener" class="diqt-dict-explanation-btn">詳細を見る</a>`;
        /* 例文 */
        let sentenceHtml = createSentenceHtml(word, loginToken);
        /* 項目の編集ボタン */
        let linkToImproveWord = liknToImproveHtml(wordURL, 'この項目を編集する');
        /* 項目編集ボタンの上の余白 */
        // let spaceBeforeImproveWordBtn = '<div style="width: 100%; height: 16px;"></div>'
        /* 項目と次の項目の間の余白 */
        let bottomSpace = '<div style="width: 100%; height: 24px;"></div>'
        /* 項目のレンダリング */
        let wordHtml = entry + meaning + meaningTranslation + reviewBtn + sentenceHtml + linkToImproveWord + bottomSpace;
        return wordHtml;
    }

    // 意味の翻訳ボタンを作成する
    static createMeaningTranslation(word) {
        if (word.lang_number_of_entry == word.lang_number_of_meaning) {
            return `<div id="small-translation-buttons-word-${word.id}" style="padding-left: 4px;">
                    <span class="diqt-google-translation-btn-wrapper">
                        <a href="#" class="diqt-google-translation-btn" style="color: #27ae60;"><u>Google翻訳</u></a>
                    </span>
                    <span >/</span>
                    <span class="diqt-deepl-translation-btn-wrapper">
                        <a href="#" class="diqt-deepl-translation-btn" style="color: #27ae60;"><u>DeepL翻訳</u></a>
                    </span>
                    <p class="diqt-google-translation-form"></p>
                    <p class="diqt-deepl-translation-form"></p>
                </div>`;
        }
        return '';
    }

    //  意味の翻訳イベントを設定する。
    static setMeaningTranslation(word, loginToken) {
        if (word.lang_number_of_entry == word.lang_number_of_meaning) {
            let buttons = document.getElementById(`small-translation-buttons-word-${word.id}`);
            // google翻訳
            let googleButton = buttons.querySelector('.diqt-google-translation-btn');
            let googleWrapper = buttons.querySelector('.diqt-google-translation-btn-wrapper');
            let googleTranslationForm = buttons.querySelector('.diqt-google-translation-form');
            googleButton.addEventListener('click', function () {
                if (loginToken) {
                    googleWrapper.innerHTML = '<span>翻訳中...</span>';
                    let port = chrome.runtime.connect({ name: "googleTranslation" });
                    port.postMessage({ action: "googleTranslation", keyword: word.meaning });
                    port.onMessage.addListener(function (msg) {
                        let data = msg['data'];
                        googleWrapper.innerHTML = '<span>完了</span>';
                        if (data['status'] == "200") {
                            let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>Google翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                            googleTranslationForm.innerHTML = translation;
                        } else {
                            googleTranslationForm.innerHTML = `<a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                        }
                        return true;
                    });
                } else {
                    // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                    let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                    rtnPromise.then((response) => { }).catch((error) => { });
                    return true;
                }
            });
            // Deepl翻訳
            let deeplButton = buttons.querySelector('.diqt-deepl-translation-btn');
            let deeplWrapper = buttons.querySelector('.diqt-deepl-translation-btn-wrapper');
            let deeplTranslationForm = buttons.querySelector('.diqt-deepl-translation-form');
            deeplButton.addEventListener('click', function () {
                if (loginToken) {
                    deeplWrapper.innerHTML = '<span>翻訳中...</span>';
                    let port = chrome.runtime.connect({ name: "deeplTranslation" });
                    port.postMessage({ action: "deeplTranslation", keyword: word.meaning });
                    port.onMessage.addListener(function (msg) {
                        let data = msg['data'];
                        deeplWrapper.innerHTML = '<span>完了</span>';
                        if (data['status'] == "200") {
                            let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>DeepL翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                            deeplTranslationForm.innerHTML = translation;
                        } else {
                            deeplTranslationForm.innerHTML = `<a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                        }
                        return true;
                    });
                } else {
                    // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                    let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                    rtnPromise.then((response) => { }).catch((error) => { });
                    return true;
                }
            });
        }
    }




    // 例文のHTMLを作成する
    static createSentenceHtml(word, loginToken) {
        let sentence = word.sentence;
        let quiz = word.sentence_quiz;
        let review = word.sentence_review;
        if (sentence == null || quiz == null) {
            // 例文がない場合は、例文を追加するリンクための項目の編集リンクを返す
            //return liknToImproveHtml(`https://www.diqt.net/ja/words/${word.id}/edit`, '例文を追加する');
            return '';
        }
        // 例文と翻訳
        let label = `<div style="text-align: left; margin-top: 16px"><div class="diqt-dict-label">例文</div></div>`;
        let original = `<div class="diqt-dict-explanation">${markNotation(sentence.original)}</div>`;
        let translation = `<div class="diqt-dict-explanation">${sentence.translation}</div>`;
        // 例文の復習ボタン 
        let quizId = quiz.id;
        //let review = sentence.quiz.review;
        let reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quizId}">${Review.createReviewBtnHtml(quizId, review, loginToken)}</div>`;
        // 例文の編集ボタン
        let sentenceUrl = `https://www.diqt.net/ja/sentences/${sentence.id}`
        let linkToImproveSentence = liknToImproveHtml(sentenceUrl, 'この例文を編集する');
        // 例文のHTML
        let sentenceHtml = label + original + translation + reviewBtn + linkToImproveSentence;
        return sentenceHtml;
    }




    // 翻訳ボタンを生成する
    static createTranslationForm(loginToken) {
        let translationForm;
        if (loginToken) {
            translationForm = `<div id="diqt-dict-translation-form">
        <div id="diqt-dict-google-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">Googleで翻訳する</div></div>
        <div id="diqt-dict-deepl-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">DeepLで翻訳する</div></div>
        </div>`
        } else {
            translationForm = `<div id="diqt-dict-translation-form">
        <div id="diqt-dict-google-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">Googleで翻訳する</div></div>
        <div id="diqt-dict-deepl-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">DeepLで翻訳する</div></div>
        <p><a id="diqt-dict-login-for-translation" style="color: #27ae60;">ログイン</a>することで、機械翻訳が利用できるようになります。</p>
        </div>`
        }
        return translationForm
    }

    // 「改善ボタン」と「詳細ボタン」のhtmlを生成する（項目と例文に使用）
    static liknToImproveHtml(url, label) {
        let html = `<div style="display: flex;">
                    <a href="${url + '/edit'}" target="_blank" rel="noopener" class="diqt-dict-link-to-improve" style="margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-edit"></i>${label}</a>
                    <a href="${url}" target="_blank" rel="noopener" class="diqt-dict-link-to-improve" style="margin-left: auto; margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-external-link" style="margin-right: 4px;"></i>詳細</a>
                </div>`;
        return html;
    }

    // 辞書に検索キーワードが登録されていなかった場合に表示する「項目追加ボタン」や「Web検索ボタン」を生成する。
    static notFoundFormHtml(keyword, dictionary) {
        let notFound = `<div class="diqt-dict-meaning" style="margin: 24px 0;">${keyword}は辞書に登録されていません。</div>`;
        let createNewWord = `<a href="https://www.diqt.net/ja/words/new?dictionary_id=${dictionary.id}&text=${keyword}" target="_blank" rel="noopener" style="text-decoration: none;">
                <div class="diqt-dict-review-btn" style="font-weight: bold;">辞書に登録する</div></a>`;
        let searchWeb = `<a href="https://www.google.com/search?q=${keyword}+意味&oq=${keyword}+意味"" target="_blank" rel="noopener" style="text-decoration: none;">
            <div class="diqt-dict-review-btn" style="font-weight: bold;">Webで検索する</div></a>`;
        let html = notFound + createNewWord + searchWeb;
        return html;
    }

    // 辞書の追加とWeb検索ボタン
    static newWordHtml(keyword, dictionary) {
        let createNewWord = `<a href="https://www.diqt.net/ja/words/new?dictionary_id=${dictionary.id}&text=${keyword}" target="_blank" rel="noopener" style="text-decoration: none;">
                <div class="diqt-dict-review-btn" style="font-weight: bold;">辞書に登録する</div></a>`;
        let searchWeb = `<a href="https://www.google.com/search?q=${keyword}+意味&oq=${keyword}+意味"" target="_blank" rel="noopener" style="text-decoration: none;">
            <div class="diqt-dict-review-btn" style="font-weight: bold;">Webで検索する</div></a>`;
        let html = createNewWord + searchWeb;
        return html;
    }

    // 翻訳フォームにイベントを付与
    static addEventToTranslationForm(loginToken, keyword) {
        const googleTranslationForm = document.querySelector('#diqt-dict-google-translation');
        const deeplTranslationForm = document.querySelector('#diqt-dict-deepl-translation');
        if (loginToken) {
            // Google翻訳
            googleTranslationForm.addEventListener('click', function () {
                googleTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
                let port = chrome.runtime.connect({ name: "googleTranslation" });
                port.postMessage({ action: "googleTranslation", keyword: keyword });
                port.onMessage.addListener(function (msg) {
                    let data = msg['data'];
                    if (data['status'] == "200") {
                        let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>Google翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                        googleTranslationForm.innerHTML = translation;
                    } else {
                        let message = `<p style="margin: 24px 0;"><a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                        googleTranslationForm.innerHTML = message;
                    }
                    return true;
                });
            });
            // DeepL翻訳
            deeplTranslationForm.addEventListener('click', function () {
                deeplTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
                let deeplPort = chrome.runtime.connect({ name: "deeplTranslation" });
                deeplPort.postMessage({ action: "deeplTranslation", keyword: keyword });
                deeplPort.onMessage.addListener(function (msg) {
                    let data = msg['data'];
                    if (data['status'] == "200") {
                        let translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>DeepL翻訳：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                        deeplTranslationForm.innerHTML = translation;
                    } else {
                        let message = `<p style="margin: 24px 0;"><a href="https://www.diqt.net/ja/select_plan" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                        deeplTranslationForm.innerHTML = message;
                    }
                    return true;
                });
            });

        } else {
            // options.htmlへのリンクを設定する。
            googleTranslationForm.addEventListener('click', function () {
                // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
            deeplTranslationForm.addEventListener('click', function () {
                let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
            const loginBtn = document.querySelector('#diqt-dict-login-for-translation');
            loginBtn.addEventListener('click', function () {
                let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
        }
    }

}