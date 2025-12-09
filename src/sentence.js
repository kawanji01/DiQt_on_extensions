import { Word } from './word.js';
import { Review } from './review.js';
import { Translator } from './translator.js';
import { USER_LANG_NUMBER, DIQT_URL, RTL_LANGUAGES, LANG_CODE_MAP } from './constants.js';


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
        const sentenceUrl = `${DIQT_URL}/sentences/${sentence.id}`
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
        Translator.addTranslationButtons(buttons, sentence.original, sentence.lang_number_of_original, USER_LANG_NUMBER);
    }

    static createContentHtml(sentence) {
        const isRtl = RTL_LANGUAGES.includes(sentence.lang_number_of_original);
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
        const originalLangCode = Sentence.getLangCodeFromNumber(sentence.lang_number_of_original);
        let html = `<div class="diqt-dict-sentence-text">${sentence.translation}</div>`;
        // 後方互換性のため両方のプロパティ名に対応
        const jaTranslationValue = sentence.translation_ja || sentence.ja_translation; // 新しいプロパティ名を優先、なければ旧プロパティ名を使用
        if (Sentence.getTranslationLangCode(sentence) !== 'ja'
            && originalLangCode !== 'ja'
            && jaTranslationValue && jaTranslationValue.trim() !== '') {
            html += `<div class="diqt-dict-sentence-text">${jaTranslationValue}</div>`;
        }
        const enTranslationValue = sentence.translation_en || sentence.en_translation;
        if (Sentence.getTranslationLangCode(sentence) !== 'en' && enTranslationValue && enTranslationValue.trim() !== '') {
            html += `<div class="diqt-dict-sentence-text">${enTranslationValue}</div>`;
        }
        return html;
    }

    // 言語番号から言語コードを取得する
    static getLangCodeFromNumber(langNumber) {
        // LANG_CODE_MAPを逆引きして言語コードを取得
        for (const [langCode, number] of Object.entries(LANG_CODE_MAP)) {
            if (number === langNumber) {
                return langCode;
            }
        }
        return 'undefined'; // 見つからない場合は'undefined'を返す
    }

    // sentenceの翻訳の言語コードを取得する
    static getTranslationLangCode(sentence) {
        if (!sentence || typeof sentence.lang_number_of_translation === 'undefined') {
            return 'undefined';
        }
        return Sentence.getLangCodeFromNumber(sentence.lang_number_of_translation);
    }

    // 例文の翻訳ボタンを表示するかどうか
    static sentenceTranslationButtonDisplayed(sentence) {
        if (sentence == null) {
            return false;
        }
        if (sentence.lang_number_of_original == USER_LANG_NUMBER) {
            return false;
        }
        // バイリンガル辞書であり、かつ、翻訳文の言語がユーザーの言語と同じであった場合は、翻訳ボタンを表示しない。
        if (sentence.lang_number_of_original != sentence.lang_number_of_translation && sentence.lang_number_of_translation == USER_LANG_NUMBER) {
            return false;
        }
        return true;

    }
}
