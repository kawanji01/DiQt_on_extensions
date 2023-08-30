import { Review } from './review.js';

const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
const diqtUrl = `${process.env.ROOT_URL}/${locale}`;
const premiumPlanUrl = `${diqtUrl}/plans/premium`;

export class Word {

    // WordのHTMLを作成する
    static createWordHtml(word, loginToken) {
        //const tags = createTagsHtml(word.tags);
        const wordURL = `${diqtUrl}/words/${word.id}`;
        /* タイトル */
        const entry = `<div class="diqt-dict-entry">
                                <span>${word.entry}</span><button class="diqt-dict-speech-btn"><i class="fas fa-volume-up"></i></button>
                             </div>`;
        /* 意味 */
        const meaning = `<div class="diqt-dict-meaning">${Word.markNotation(word.meaning)}</div>`;
        /* 意味の翻訳ボタン */
        const meaningTranslation = Word.createMeaningTranslation(word);
        /* 復習ボタン */
        const reviewButtons = Review.createWordReviewButtons(word, loginToken);
        /* 例文 */
        const sentenceHtml = Word.createSentenceHtml(word, loginToken);
        /* 項目の編集ボタン */
        const linkToEditWord = Word.liknToImproveHtml(wordURL, chrome.i18n.getMessage("editWord"));
        /* 項目編集ボタンの上の余白 */
        // const spaceBeforeImproveWordBtn = '<div style="width: 100%; height: 16px;"></div>'
        /* 項目と次の項目の間の余白 */
        const bottomSpace = '<div style="width: 100%; height: 24px;"></div>'
        /* 項目のレンダリング */
        const wordHtml = entry + meaning + meaningTranslation + reviewButtons + sentenceHtml + linkToEditWord + bottomSpace;
        return wordHtml;
    }

    // 意味の翻訳ボタンを作成する
    static createMeaningTranslation(word) {
        if (word.lang_number_of_entry == word.lang_number_of_meaning) {
            return `<div id="small-translation-buttons-word-${word.id}" style="padding-left: 4px;">
                    <span class="diqt-google-translation-btn-wrapper">
                        <a href="#" class="diqt-google-translation-btn" style="color: #27ae60;"><u>${chrome.i18n.getMessage("googleTranslation")}</u></a>
                    </span>
                    <span >/</span>
                    <span class="diqt-deepl-translation-btn-wrapper">
                        <a href="#" class="diqt-deepl-translation-btn" style="color: #27ae60;"><u>${chrome.i18n.getMessage("deepLTranslation")}</u></a>
                    </span>
                    <p class="diqt-google-translation-form"></p>
                    <p class="diqt-deepl-translation-form"></p>
                </div>`;
        }
        return '';
    }

    static createReviewButtons(word, loginToken) {
        // 「意味を覚える」ボタン
        const quiz = word.quiz;
        if (quiz == null) {
            return '';
        }
        const quizId = quiz.id;
        const review = quiz.review;
        const wordReviewLabel = chrome.i18n.getMessage('word_review_label');
        const reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quizId}">${Review.createReviewBtnHtml(quiz, review, wordReviewLabel, loginToken)}</div>`;
        // 「単語を覚える」ボタン
        const reversedQuiz = quiz.reversed_quiz;
        if (reversedQuiz == null) {
            return reviewBtn;
        }
        const reversedQuizId = reversedQuiz.id;
        const reversedReview = reversedQuiz.review;
        const reversedWordReviewLabel = chrome.i18n.getMessage('reversed_word_review_label');
        const reversedReviewBtn = `<div id="diqt-dict-review-btn-wrapper-${reversedQuizId}">${Review.createReviewBtnHtml(reversedQuiz, reversedReview, reversedWordReviewLabel, loginToken)}</div>`;
        return reviewBtn + reversedReviewBtn;
    }

    //  意味の翻訳イベントを設定する。
    static setMeaningTranslation(word, loginToken) {
        if (word.lang_number_of_entry == word.lang_number_of_meaning) {
            const buttons = document.getElementById(`small-translation-buttons-word-${word.id}`);
            // google翻訳
            const googleButton = buttons.querySelector('.diqt-google-translation-btn');
            const googleWrapper = buttons.querySelector('.diqt-google-translation-btn-wrapper');
            const googleTranslationForm = buttons.querySelector('.diqt-google-translation-form');
            googleButton.addEventListener('click', function () {
                if (loginToken) {
                    googleWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
                    const port = chrome.runtime.connect({ name: "googleTranslation" });
                    port.postMessage({ action: "googleTranslation", keyword: word.meaning });
                    port.onMessage.addListener(function (msg) {
                        const data = msg['data'];
                        googleWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translated")}</span>`;
                        if (data['status'] == "200") {
                            const translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>${chrome.i18n.getMessage("googleTranslation")}：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                            googleTranslationForm.innerHTML = translation;
                        } else {
                            googleTranslationForm.innerHTML = `<a href="${premiumPlanUrl}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                        }
                        return true;
                    });
                } else {
                    // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                    const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                    rtnPromise.then((response) => { }).catch((error) => { });
                    return true;
                }
            });
            // Deepl翻訳
            const deeplButton = buttons.querySelector('.diqt-deepl-translation-btn');
            const deeplWrapper = buttons.querySelector('.diqt-deepl-translation-btn-wrapper');
            const deeplTranslationForm = buttons.querySelector('.diqt-deepl-translation-form');
            deeplButton.addEventListener('click', function () {
                if (loginToken) {
                    deeplWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
                    const port = chrome.runtime.connect({ name: "deeplTranslation" });
                    port.postMessage({ action: "deeplTranslation", keyword: word.meaning });
                    port.onMessage.addListener(function (msg) {
                        const data = msg['data'];
                        deeplWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translated")}</span>`;
                        if (data['status'] == "200") {
                            const translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>${chrome.i18n.getMessage("deepLTranslation")}：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                            deeplTranslationForm.innerHTML = translation;
                        } else {
                            deeplTranslationForm.innerHTML = `<a href="${premiumPlanUrl}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                        }
                        return true;
                    });
                } else {
                    // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                    const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                    rtnPromise.then((response) => { }).catch((error) => { });
                    return true;
                }
            });
        }
    }




    // 例文のHTMLを作成する
    static createSentenceHtml(word, loginToken) {
        const sentence = word.sentence;
        if (sentence == null) {
            // 例文がない場合は、例文を追加するリンクための項目の編集リンクを返す
            //return liknToImproveHtml(`https://www.diqt.net/ja/words/${word.id}/edit`, '例文を追加する');
            console.log('sentence is null');
            return '';
        }
        // 例文と翻訳
        const label = `<div style="text-align: left; margin-top: 16px"><div class="diqt-dict-label">${chrome.i18n.getMessage("sentence")}</div></div>`;
        const original = `<div class="diqt-dict-explanation">${Word.markNotation(sentence.original)}</div>`;
        const translation = `<div class="diqt-dict-explanation">${sentence.translation}</div>`;
        // 例文の復習ボタン
        const reviewBtn = Review.createSentenceReviewButtons(sentence, loginToken);
        // 例文の編集ボタン
        const sentenceUrl = `${diqtUrl}/sentences/${sentence.id}`
        const linkToEditSentence = Word.liknToImproveHtml(sentenceUrl, chrome.i18n.getMessage("editSentence"));
        // 例文のHTML
        const sentenceHtml = label + original + translation + reviewBtn + linkToEditSentence;
        return sentenceHtml;
    }




    // 「改善ボタン」と「詳細ボタン」のhtmlを生成する（項目と例文に使用）
    static liknToImproveHtml(url, label) {
        const html = `<div style="display: flex;">
                    <a href="${url + '/edit'}" target="_blank" rel="noopener" class="diqt-dict-link-to-improve" style="margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-edit"></i>${label}</a>
                    <a href="${url}" target="_blank" rel="noopener" class="diqt-dict-link-to-improve" style="margin-left: auto; margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-external-link" style="margin-right: 4px;"></i>${chrome.i18n.getMessage("details")}</a>
                </div>`;
        return html;
    }

    // 辞書に検索キーワードが登録されていなかった場合に表示する「項目追加ボタン」や「Web検索ボタン」を生成する。
    static notFoundFormHtml(keyword, dictionary) {
        const notFound = `<div class="diqt-dict-meaning" style="margin: 24px 0;">${chrome.i18n.getMessage("noWordFound", [keyword])}</div>`;
        const createNewWord = `<a href="${diqtUrl}/words/new?dictionary_id=${dictionary.id}&text=${keyword}" target="_blank" rel="noopener" style="text-decoration: none;">
                <div class="diqt-dict-review-btn" style="font-weight: bold;">${chrome.i18n.getMessage("addWord")}</div></a>`;
        const searchWeb = `<a href="https://www.google.com/search?q=${keyword}+${chrome.i18n.getMessage("meaning")}&oq=${keyword}+${chrome.i18n.getMessage("meaning")}"" target="_blank" rel="noopener" style="text-decoration: none;">
            <div class="diqt-dict-review-btn" style="font-weight: bold;">${chrome.i18n.getMessage("searchByWeb")}</div></a>`;
        const html = notFound + createNewWord + searchWeb;
        return html;
    }

    // 辞書の追加とWeb検索ボタン
    static newWordHtml(keyword, dictionary) {
        const createNewWord = `<a href="${diqtUrl}/words/new?dictionary_id=${dictionary.id}&text=${keyword}" target="_blank" rel="noopener" style="text-decoration: none;">
                <div class="diqt-dict-review-btn" style="font-weight: bold;">${chrome.i18n.getMessage("addWord")}</div></a>`;
        const searchWeb = `<a href="https://www.google.com/search?q=${keyword}+${chrome.i18n.getMessage("meaning")}&oq=${keyword}+${chrome.i18n.getMessage("meaning")}"" target="_blank" rel="noopener" style="text-decoration: none;">
            <div class="diqt-dict-review-btn" style="font-weight: bold;">${chrome.i18n.getMessage("searchByWeb")}</div></a>`;
        const html = createNewWord + searchWeb;
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
                const port = chrome.runtime.connect({ name: "googleTranslation" });
                port.postMessage({ action: "googleTranslation", keyword: keyword });
                port.onMessage.addListener(function (msg) {
                    const data = msg['data'];
                    if (data['status'] == "200") {
                        const translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>${chrome.i18n.getMessage("googleTranslation")}：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                        googleTranslationForm.innerHTML = translation;
                    } else {
                        const message = `<p style="margin: 24px 0;"><a href="${premiumPlanUrl}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                        googleTranslationForm.innerHTML = message;
                    }
                    return true;
                });
            });
            // DeepL翻訳
            deeplTranslationForm.addEventListener('click', function () {
                deeplTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
                const deeplPort = chrome.runtime.connect({ name: "deeplTranslation" });
                deeplPort.postMessage({ action: "deeplTranslation", keyword: keyword });
                deeplPort.onMessage.addListener(function (msg) {
                    const data = msg['data'];
                    if (data['status'] == "200") {
                        const translation = `<p style="font-size: 14px; color: #27ae60; margin-top: 24px;"><b>${chrome.i18n.getMessage("deepLTranslation")}：</b></p>
                    <p style="font-size: 14px; color: #6e6e6e; margin-bottom: 16px;">${data['data']['translation']}</p>`;
                        deeplTranslationForm.innerHTML = translation;
                    } else {
                        const message = `<p style="margin: 24px 0;"><a href="${premiumPlanUrl}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                        deeplTranslationForm.innerHTML = message;
                    }
                    return true;
                });
            });

        } else {
            // options.htmlへのリンクを設定する。
            googleTranslationForm.addEventListener('click', function () {
                // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
            deeplTranslationForm.addEventListener('click', function () {
                const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
            const loginBtn = document.querySelector('#diqt-dict-login-for-translation');
            loginBtn.addEventListener('click', function () {
                const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
            });
        }
    }




    // 記法が使われた解説テキストをマークアップする。
    static markNotation(text) {
        // 改行コードをすべて<br>にする。
        const expTxt = text.replace(/\r?\n/g, '<br>');
        // wiki記法（[[text]]）でテキストを分割する。
        const expTxtArray = expTxt.split(/(\[{2}.*?\]{2})/);
        let processedArray = [];
        expTxtArray.forEach(function (item, index, array) {
            if (item.match(/\[{2}.+\]{2}/) == null) {
                processedArray.push(item);
            } else {
                item = item.replace(/\[{2}/g, "").replace(/\]{2}/g, "");
                item = item.split(/\|/, 2);
                let linkHtml;
                if (item[1] == undefined) {
                    linkHtml = `<a class="diqt-notation-link" data-value="${item[0]}">${item[0]}</a>`
                } else {
                    linkHtml = `<a class="diqt-notation-link" data-value="${item[1]}">${item[0]}</a>`
                }
                processedArray.push(linkHtml);
            }
        })
        return processedArray.join('')
    }

    // wiki記法でリンクになっている単語をクリックすると、自動で辞書を検索するようにする。
    static activateClickSearch(results) {
        const links = results.querySelectorAll('.diqt-notation-link')
        const searchForm = document.querySelector('#diqt-dict-search-form');
        links.forEach(function (target) {
            target.addEventListener('click', function (event) {
                const keyword = event.target.dataset["value"];
                // 検索フォームのvalueとキーワードが異なるなら検索を実行する
                if (searchForm.value != keyword) {
                    searchForm.value = keyword;
                    Word.searchWord(keyword);
                }
                // 画面遷移をキャンセル
                return false;
            });
        })
    }

    // 項目を読み上げさせる。
    static enableTTS(results) {
        const speechBtns = results.querySelectorAll('.diqt-dict-speech-btn')
        // 事前に一度これを実行しておかないと、初回のvoice取得時に空配列が返されてvoiceがundefinedになってしまう。参考：https://www.codegrid.net/articles/2016-web-speech-api-1/
        speechSynthesis.getVoices()
        speechBtns.forEach(function (target) {
            target.addEventListener('click', function (event) {
                // 読み上げを止める。
                speechSynthesis.cancel();
                const speechTxt = target.previousElementSibling.textContent;
                const msg = new SpeechSynthesisUtterance();
                const voice = speechSynthesis.getVoices().find(function (voice) {
                    return voice.name === "Samantha"
                });
                msg.voice = voice;
                msg.lang = 'en-US'; // en-US or ja-JP
                msg.volume = 1.0; // 音量 min 0 ~ max 1
                msg.rate = 1.0; // 速度 min 0 ~ max 10
                msg.pitch = 1.0; // 音程 min 0 ~ max 2
                msg.text = speechTxt; // 喋る内容
                // 発話実行
                speechSynthesis.speak(msg);
                // 画面遷移をキャンセル
                return false;
            });
        })
    }

    // タグのhtmlを作成する
    /* function createTagsHtml(text) {
        if (text == null) {
            return `<div class="diqt-dict-word-tags-wrapper"></div>`
        }
    
        const tagsArray = text.split(',');
        let tagsHtmlArray = [];
        if (tagsArray.includes('ngsl')) {
            const ngsl = `<a href="https://www.diqt.net/ja/chapters/c63ab6e5" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>基礎英単語</a>`
            tagsHtmlArray.push(ngsl);
        }
        if (tagsArray.includes('nawl')) {
            const nawl = `<a href="https://www.diqt.net/ja/chapters/5cedf1da" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>学術頻出語</a>`
            tagsHtmlArray.push(nawl);
        }
        if (tagsArray.includes('tsl')) {
            const tsl = `<a href="https://www.diqt.net/ja/chapters/26c399f0" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>TOEIC頻出語</a>`
            tagsHtmlArray.push(tsl);
        }
        if (tagsArray.includes('bsl')) {
            const bsl = `<a href="https://www.diqt.net/ja/chapters/4d46ce7f" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>ビジネス頻出語</a>`
            tagsHtmlArray.push(bsl);
        }
        if (tagsArray.includes('phrase')) {
            const phrase = `<a href="https://www.diqt.net/ja/chapters/c112b566" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>頻出英熟語</a>`
            tagsHtmlArray.push(phrase);
        }
        if (tagsArray.includes('phave')) {
            const phave = `<a href="https://www.diqt.net/ja/chapters/3623e0d5" target="_blank" rel="noopener" class="diqt-dict-word-tag"><i class="fal fa-tag"></i>頻出句動詞</a>`
            tagsHtmlArray.push(phave);
        }
        return `<div class="diqt-dict-word-tags-wrapper">${tagsHtmlArray.join('')}</div>`
    } */


}