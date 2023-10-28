const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
const diqtUrl = `${process.env.ROOT_URL}/${locale}`;
const premiumPlanUrl = `${diqtUrl}/plans/premium`;

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
    static setEventsToTranslation(wrapper, keyword, sourceLangNumber, targetLangNumber) {
        if (sourceLangNumber == targetLangNumber) {
            return true;
        }
        // google翻訳
        const googleButton = wrapper.querySelector('.diqt-google-translation-btn');
        const googleWrapper = wrapper.querySelector('.diqt-google-translation-btn-wrapper');
        const googleTranslationForm = wrapper.querySelector('.diqt-google-translation-form');
        googleButton.addEventListener('click', function () {
            googleWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
            const port = chrome.runtime.connect({ name: "googleTranslation" });
            port.postMessage({ action: "googleTranslation", keyword: keyword, sourceLangNumber: sourceLangNumber, targetLangNumber: targetLangNumber });
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
        const deeplButton = wrapper.querySelector('.diqt-deepl-translation-btn');
        const deeplWrapper = wrapper.querySelector('.diqt-deepl-translation-btn-wrapper');
        const deeplTranslationForm = wrapper.querySelector('.diqt-deepl-translation-form');
        deeplButton.addEventListener('click', function () {
            deeplWrapper.innerHTML = `<span>${chrome.i18n.getMessage("translating")}</span>`;
            const port = chrome.runtime.connect({ name: "deeplTranslation" });
            port.postMessage({ action: "deeplTranslation", keyword: keyword, sourceLangNumber: sourceLangNumber, targetLangNumber: targetLangNumber });
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


}