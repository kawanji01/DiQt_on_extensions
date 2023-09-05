import { Review } from './review.js';
import { Sentence } from './sentence.js';

const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
const userLangNumber = locale == 'ja' ? 44 : 21;
const diqtUrl = `${process.env.ROOT_URL}/${locale}`;
const premiumPlanUrl = `${diqtUrl}/plans/premium`;

export class Word {

    // WordのHTMLを作成する
    static createWordHtml(word) {
        //const tags = createTagsHtml(word.tags);
        const wordURL = `${diqtUrl}/words/${word.id}`;
        /* 見出し語 */
        const entry = `<div class="diqt-dict-entry">
                                <span>${word.entry}</span><button class="diqt-dict-speech-btn"><i class="fas fa-volume-up"></i></button>
                             </div>`;
        // 発音記号
        const pronunciation = Word.createPronunciation(word);
        // 品詞
        const pos = Word.createPos(word);
        /* 意味 */
        const meaning = `<div class="diqt-dict-meaning">${Word.markNotation(word.meaning)}</div>`;
        /* 意味の翻訳ボタン */
        const meaningTranslation = Word.createMeaningTranslation(word);
        /* 復習ボタン */
        const reviewButtons = Review.createWordReviewButtons(word);
        /* 例文 */
        const sentenceHtml = Sentence.createHtml(word);
        /* 項目の編集ボタン */
        const linkToEditWord = Word.liknToEditHtml(wordURL, chrome.i18n.getMessage("editWord"));
        /* 項目編集ボタンの上の余白 */
        // const spaceBeforeImproveWordBtn = '<div style="width: 100%; height: 16px;"></div>'
        /* 項目と次の項目の間の余白 */
        const bottomSpace = '<div style="width: 100%; height: 24px;"></div>'
        /* 項目のレンダリング */
        const wordHtml = entry + pronunciation + pos + meaning + meaningTranslation + reviewButtons + sentenceHtml + linkToEditWord + bottomSpace;
        return wordHtml;
    }

    // 発音記号 / 読み
    static createPronunciation(word) {
        if (word.lang_number_of_entry == 44) {
            // 日本語なら読みを表示する
            return `<div class="diqt-dict-pronunciation">${word.reading}</div>`;
        } else {
            return `<div class="diqt-dict-pronunciation">${word.ipa}</div>`;
        }
    }

    // 品詞のhtmlを作成する
    static createPos(word) {
        if (word.pos_tag != null) {
            return `<div class="diqt-item-label">${word.pos_tag.name}</div>`;
        }
        if (word.pos != null && word.pos != "") {
            return `<div class="diqt-item-label">${word.pos}</div>`;
        }
        return '';
    }

    // 意味の翻訳ボタンを作成する
    static createMeaningTranslation(word) {
        if (word.lang_number_of_meaning == userLangNumber) {
            return '';
        }
        return `<div class="small-translation-buttons" id="small-meaning-translation-buttons-word-${word.id}">
                        <span class="diqt-google-translation-btn-wrapper">
                            <a class="diqt-google-translation-btn">${chrome.i18n.getMessage("googleTranslation")}</a>
                        </span>
                        <span> / </span>
                        <span class="diqt-deepl-translation-btn-wrapper">
                            <a class="diqt-deepl-translation-btn">${chrome.i18n.getMessage("deepLTranslation")}</a>
                        </span>
                        <div class="diqt-google-translation-form"></div>
                        <div class="diqt-deepl-translation-form"></div>
                    </div>`;
    }



    //  意味の翻訳イベントを設定する。
    static setEventsToMeaningTranslation(word) {
        if (word.lang_number_of_meaning == userLangNumber) {
            return true;
        }
        const buttons = document.getElementById(`small-meaning-translation-buttons-word-${word.id}`);
        // google翻訳
        const googleButton = buttons.querySelector('.diqt-google-translation-btn');
        const googleWrapper = buttons.querySelector('.diqt-google-translation-btn-wrapper');
        const googleTranslationForm = buttons.querySelector('.diqt-google-translation-form');
        googleButton.addEventListener('click', function () {
            googleWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
            const port = chrome.runtime.connect({ name: "googleTranslation" });
            port.postMessage({ action: "googleTranslation", keyword: word.meaning, sourceLangNumber: word.lang_number_of_meaning, targetLangNumber: userLangNumber });
            port.onMessage.addListener(function (msg) {
                const data = msg['data'];
                googleWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translated")}</span>`;
                if (data['status'] == "200") {
                    const translation = `<p class="diqt-translation-service">${chrome.i18n.getMessage("googleTranslation")}：</p>
                    <p class="diqt-translation-results">${data['translation']}</p>`;
                    googleTranslationForm.innerHTML = translation;
                } else {
                    googleTranslationForm.innerHTML = `<a href="${premiumPlanUrl}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                }
                return true;
            });

        });
        // Deepl翻訳
        const deeplButton = buttons.querySelector('.diqt-deepl-translation-btn');
        const deeplWrapper = buttons.querySelector('.diqt-deepl-translation-btn-wrapper');
        const deeplTranslationForm = buttons.querySelector('.diqt-deepl-translation-form');
        deeplButton.addEventListener('click', function () {
            deeplWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
            const port = chrome.runtime.connect({ name: "deeplTranslation" });
            port.postMessage({ action: "deeplTranslation", keyword: word.meaning, sourceLangNumber: word.lang_number_of_meaning, targetLangNumber: userLangNumber });
            port.onMessage.addListener(function (msg) {
                const data = msg['data'];
                deeplWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translated")}</span>`;
                if (data['status'] == "200") {
                    const translation = `<p class="diqt-translation-service">${chrome.i18n.getMessage("deepLTranslation")}：</p>
                    <p class="diqt-translation-results">${data['translation']}</p>`;
                    deeplTranslationForm.innerHTML = translation;
                } else {
                    deeplTranslationForm.innerHTML = `<a href="${premiumPlanUrl}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a>`;
                }
                return true;
            });
        });
    }


    /*  static createReviewButtons(word) {
         // 「意味を覚える」ボタン
         const quiz = word.quiz;
         if (quiz == null) {
             return '';
         }
         const quizId = quiz.id;
         const review = quiz.review;
         const wordReviewLabel = chrome.i18n.getMessage('word_review_label');
         const reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quizId}">${Review.createReviewBtnHtml(quiz, review, wordReviewLabel)}</div>`;
         // 「単語を覚える」ボタン
         const reversedQuiz = quiz.reversed_quiz;
         if (reversedQuiz == null) {
             return reviewBtn;
         }
         const reversedQuizId = reversedQuiz.id;
         const reversedReview = reversedQuiz.review;
         const reversedWordReviewLabel = chrome.i18n.getMessage('reversed_word_review_label');
         const reversedReviewBtn = `<div id="diqt-dict-review-btn-wrapper-${reversedQuizId}">${Review.createReviewBtnHtml(reversedQuiz, reversedReview, reversedWordReviewLabel)}</div>`;
         return reviewBtn + reversedReviewBtn;
     } */




    // 「改善ボタン」と「詳細ボタン」のhtmlを生成する（項目と例文に使用）
    static liknToEditHtml(url, label) {
        const html = `<div style="display: flex;">
                    <a href="${url + '/edit'}" target="_blank" rel="noopener" class="diqt-dict-link-to-edit" style="margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-edit"></i> ${label}</a>
                    <a href="${url}" target="_blank" rel="noopener" class="diqt-dict-link-to-edit" style="margin-left: auto; margin-top: 0; margin-bottom: 8px; padding-top: 0; padding-bottom: 0;"><i class="fal fa-external-link" style="margin-right: 4px;"></i>${chrome.i18n.getMessage("details")}</a>
                </div>`;
        return html;
    }


    // wordに関わるイベントを設定する
    static setEventsToWord(word) {
        // 意味の翻訳ボタンのイベントを設定する。
        Word.setEventsToMeaningTranslation(word);
        // 復習ボタンにイベントを設定する。
        Review.setEventsToReviewButtons(word);
        // 例文の翻訳ボタンにイベントを設定する。
        const sentence = word.sentence;
        Sentence.setEventsToSentenceTranslation(sentence);
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

    // 翻訳ボタンを生成する
    static createTranslationForm() {
        return `<div id="diqt-dict-translation-form">
                    <div id="diqt-dict-google-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">${chrome.i18n.getMessage("googleTranslation")}</div></div>
                    <div id="diqt-dict-deepl-translation"><div class="diqt-dict-review-btn" style="font-weight: bold;">${chrome.i18n.getMessage("deepLTranslation")}</div></div>
                </div>`;
    }

    // 翻訳フォームにイベントを付与
    static addEventToTranslationForm(keyword) {
        const googleTranslationForm = document.querySelector('#diqt-dict-google-translation');
        const deeplTranslationForm = document.querySelector('#diqt-dict-deepl-translation');

        // Google翻訳
        googleTranslationForm.addEventListener('click', function () {
            googleTranslationForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
            const port = chrome.runtime.connect({ name: "googleTranslation" });
            port.postMessage({ action: "dictionaryGoogleTranslation", keyword: keyword });
            port.onMessage.addListener(function (msg) {
                const data = msg['data'];
                if (data['status'] == "200") {
                    const translation = `<p class="diqt-translation-service"><b>${chrome.i18n.getMessage("googleTranslation")}：</b></p>
                    <p class="diqt-translation-results">${data['translation']}</p>`;
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
            deeplPort.postMessage({ action: "dictionaryDeeplTranslation", keyword: keyword });
            deeplPort.onMessage.addListener(function (msg) {
                const data = msg['data'];
                if (data['status'] == "200") {
                    const translation = `<p class="diqt-translation-service"><b>${chrome.i18n.getMessage("deepLTranslation")}：</b></p>
                    <p class="diqt-translation-results">${data['translation']}</p>`;
                    deeplTranslationForm.innerHTML = translation;
                } else {
                    const message = `<p style="margin: 24px 0;"><a href="${premiumPlanUrl}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60;">${data['message']}</a></p>`;
                    deeplTranslationForm.innerHTML = message;
                }
                return true;
            });
        });

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