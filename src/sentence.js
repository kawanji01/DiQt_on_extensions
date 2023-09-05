import { Word } from './word.js';
import { Review } from './review.js';

const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
const userLangNumber = locale == 'ja' ? 44 : 21;
const diqtUrl = `${process.env.ROOT_URL}/${locale}`;
const premiumPlanUrl = `${diqtUrl}/plans/premium`;


export class Sentence {
    // 例文のHTMLを作成する
    static createHtml(word) {
        const sentence = word.sentence;
        if (sentence == null) {
            return '';
        }
        // 原文
        const original = `<div class="diqt-dict-sentence-text">${Word.markNotation(sentence.original)}</div>`;
        // 原文の翻訳ボタン
        const translationButtons = Sentence.createSentenceTranslationButtons(sentence);
        // 翻訳
        let translation = Sentence.translationHtml(sentence);
        // 例文の復習ボタン
        const reviewBtn = Review.createSentenceReviewButtons(sentence);
        // 例文の編集ボタン
        const sentenceUrl = `${diqtUrl}/sentences/${sentence.id}`
        const linkToEditSentence = Word.liknToEditHtml(sentenceUrl, chrome.i18n.getMessage("editSentence"));
        // 例文のHTML
        const sentenceHtml = '<div class="diqt-dict-sentence-wrapper">' + original + translation + translationButtons + reviewBtn + linkToEditSentence + '</div>';
        return sentenceHtml;
    }

    // 例文の翻訳ボタンを生成する
    static createSentenceTranslationButtons(sentence) {
        if (Sentence.sentenceTranslationButtonDisplayed(sentence) == false) {
            return '';
        }
        return `<div class="small-translation-buttons" id="small-sentence-translation-buttons-word-${sentence.id}">
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

    //  例文の翻訳イベントを設定する。
    static setEventsToSentenceTranslation(sentence) {
        if (Sentence.sentenceTranslationButtonDisplayed(sentence) == false) {
            return false;
        }
        const buttons = document.getElementById(`small-sentence-translation-buttons-word-${sentence.id}`);
        // google翻訳
        const googleButton = buttons.querySelector('.diqt-google-translation-btn');
        const googleWrapper = buttons.querySelector('.diqt-google-translation-btn-wrapper');
        const googleTranslationForm = buttons.querySelector('.diqt-google-translation-form');
        googleButton.addEventListener('click', function () {
            googleWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
            const port = chrome.runtime.connect({ name: "googleTranslation" });
            port.postMessage({ action: "googleTranslation", keyword: sentence.original, sourceLangNumber: sentence.lang_number_of_original, targetLangNumber: userLangNumber });
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
            port.postMessage({ action: "deeplTranslation", keyword: sentence.original, sourceLangNumber: sentence.lang_number_of_original, targetLangNumber: userLangNumber });
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

    // 例文の翻訳を表示する
    static translationHtml(sentence) {
        if (sentence.lang_number_of_original == sentence.lang_number_of_translation) {
            return '';
        }
        return `<div class="diqt-dict-sentence-text">${sentence.translation}</div>`;
    }

    // 例文の翻訳ボタンを表示するかどうか
    static sentenceTranslationButtonDisplayed(sentence) {
        if (sentence == null) {
            return false;
        }
        if (sentence.lang_number_of_original == userLangNumber) {
            return false;
        }
        // バイリンガル辞書であり、かつ、翻訳文の言語がユーザーの言語と同じであった場合は、翻訳ボタンを表示しない。
        if (sentence.lang_number_of_original != sentence.lang_number_of_translation && sentence.lang_number_of_translation == userLangNumber) {
            return false;
        }
        return true;

    }
}