import { Word } from './word.js';
import { Review } from './review.js';
import { Translator } from './translator.js';

const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
const userLangNumber = locale == 'ja' ? 44 : 21;
const diqtUrl = `${process.env.ROOT_URL}/${locale}`;
// 右横書きの言語番号
const rtlLanguages = [4, 35, 72, 101];


export class Sentence {
    // 例文のHTMLを作成する
    static createHtml(word) {
        const sentence = word.sentence;
        if (sentence == null) {
            return '';
        }
        // 例文の内容
        const contentHtml = Sentence.createContentHtml(sentence);
        // 例文の復習ボタン
        const reviewBtn = Review.createSentenceReviewButtons(sentence);
        // 例文の編集ボタン
        const sentenceUrl = `${diqtUrl}/sentences/${sentence.id}`
        const linkToEditSentence = Word.liknToEditHtml(sentenceUrl, chrome.i18n.getMessage("editSentence"));
        // 例文のHTML
        const sentenceHtml = '<div class="diqt-dict-sentence-wrapper">' + contentHtml + reviewBtn + linkToEditSentence + '</div>';
        return sentenceHtml;
    }

    //  例文の翻訳イベントを設定する。
    static setEventsToSentenceTranslation(sentence) {
        if (Sentence.sentenceTranslationButtonDisplayed(sentence) == false) {
            return false;
        }
        const buttons = document.getElementById(`sentence-translation-buttons-sentence-${sentence.id}`);
        Translator.addTranslationButtons(buttons, sentence.original, sentence.lang_number_of_original, userLangNumber);
    }

    static createContentHtml(sentence) {
        const isRtl = rtlLanguages.includes(sentence.lang_number_of_original);
        const rtlClass = isRtl ? 'diqt-dict-sentence-rtl' : '';

        // 原文
        const original = `<div class="diqt-dict-sentence-text ${rtlClass}">${Word.markNotation(sentence.original)}</div>
                          <div id="sentence-translation-buttons-sentence-${sentence.id}"></div>`;
        // 原文の翻訳ボタン
        // const translationButtons = Sentence.createSentenceTranslationButtons(sentence);
        // 翻訳
        const translation = Sentence.createTranslationHtml(sentence);
        // 発音ボタン
        const audioButton = Sentence.createAudioButton(sentence);

        return `<div class="diqt-dict-sentence-content-wrapper">
        <div class="diqt-dict-sentence-content">
        ${original}
        ${translation}
        </div>
        ${audioButton}
        </div>`;
    }

    // 例文の発音ボタンを生成する
    static createAudioButton(sentence) {
        if (sentence.original_audio_url == null || sentence.original_audio_url == '') {
            return '';
        }
        return `<button class="diqt-dict-speech-btn" value="${sentence.original_audio_url}"><i class="fas fa-volume-up"></i></button>`;
    }


    // 例文の翻訳を表示する
    static createTranslationHtml(sentence) {
        if (sentence.lang_number_of_original == sentence.lang_number_of_translation) {
            return '';
        }
        let html = `<div class="diqt-dict-sentence-text">${sentence.translation}</div>`;
        if (sentence.ja_translation && sentence.ja_translation.trim() !== '') {
            html += `<div class="diqt-dict-sentence-text">${sentence.ja_translation}</div>`;
        }
        return html;
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