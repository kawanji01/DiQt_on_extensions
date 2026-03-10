import { PREMIUM_PLAN_URL, LOCALE, LANG_CODE_MAP } from './constants.js';

export class Translator {

    // 翻訳ボタンを追加して、イベントを設定する。
    static addTranslationButtons(wrapper, keyword, sourceLangNumber, targetLangNumber) {
        if (sourceLangNumber == targetLangNumber) {
            wrapper.innerHTML = '';
            return;
        }
        wrapper.innerHTML = Translator.createTranslationHtml(sourceLangNumber, targetLangNumber);
        Translator.setEventsToTranslation(wrapper, keyword, sourceLangNumber, targetLangNumber);
    }


    // 翻訳ボタンを作成する
    static createTranslationHtml(sourceLangNumber, targetLangNumber) {
        if (sourceLangNumber == targetLangNumber) {
            return '';
        }
        return `<div class="small-translation-buttons">
                    <span class="diqt-translation-btn-wrapper">
                        <a class="diqt-translation-btn">${chrome.i18n.getMessage("translationAction")}</a>
                    </span>
                    <div class="diqt-translation-form"></div>
                </div>`;
    }



    //  意味の翻訳イベントを設定する。
    static setEventsToTranslation(wrapper, keyword, sourceLangNumber, targetLangNumber) {
        if (sourceLangNumber == targetLangNumber) {
            return true;
        }
        const translationButton = wrapper.querySelector('.diqt-translation-btn');
        const translationWrapper = wrapper.querySelector('.diqt-translation-btn-wrapper');
        const translationForm = wrapper.querySelector('.diqt-translation-form');
        translationButton.addEventListener('click', function () {
            translationWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
            const port = chrome.runtime.connect({ name: "googleTranslation" });
            port.postMessage({ action: "googleTranslation", keyword: keyword, sourceLangNumber: sourceLangNumber, targetLangNumber: targetLangNumber });
            port.onMessage.addListener(function (msg) {
                const data = msg['data'];
                translationWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translated")}</span>`;
                if (data['status'] == "200") {
                    const translation = `<p class="diqt-translation-service">${Translator.translationResultLabel(sourceLangNumber, targetLangNumber)}</p>
                    <p class="diqt-translation-results">${data['translation']}</p>`;
                    translationForm.innerHTML = translation;
                } else {
                    translationForm.innerHTML = `<a href="${PREMIUM_PLAN_URL}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60; font-weight: bold;">${data['message']}</a>`;
                }
                return true;
            });
        });
    }

    static translationResultLabel(sourceLangNumber, targetLangNumber) {
        const translationResult = chrome.i18n.getMessage("translationResult");
        const sourceLanguage = Translator.languageNameFromNumber(sourceLangNumber);
        const targetLanguage = Translator.languageNameFromNumber(targetLangNumber);
        const translationInfo = `${sourceLanguage} - ${targetLanguage}`;
        if (LOCALE === 'ja') {
            return `${translationResult}（${translationInfo}）`;
        }
        return `${translationResult} (${translationInfo})`;
    }

    static languageNameFromNumber(langNumber) {
        const langCode = Translator.languageCodeFromNumber(langNumber);
        const normalizedLangCode = Translator.normalizeLanguageCode(langCode);
        if (!normalizedLangCode) {
            return `${langNumber}`;
        }

        const displayNames = Translator.languageDisplayNames();
        if (displayNames) {
            const languageName = displayNames.of(normalizedLangCode);
            if (languageName) {
                return languageName;
            }
        }

        return normalizedLangCode;
    }

    static languageCodeFromNumber(langNumber) {
        for (const [langCode, number] of Object.entries(LANG_CODE_MAP)) {
            if (number === langNumber) {
                return langCode;
            }
        }
        return '';
    }

    static normalizeLanguageCode(langCode) {
        if (!langCode || langCode === 'undefined') {
            return '';
        }
        if (langCode === 'iw') {
            return 'he';
        }
        return langCode;
    }

    static languageDisplayNames() {
        if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
            return null;
        }
        return new Intl.DisplayNames([LOCALE], { type: 'language' });
    }


}
