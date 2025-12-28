import { PREMIUM_PLAN_URL, PROMPT_KEYS } from './constants.js';

export class AISearcher {

    static addAISearchForm(keyword, dictionary) {
        const wrapper = document.querySelector('#diqt-dict-ai-search-wrapper');
        chrome.storage.local.get(['selectedPromptKey'], function (result) {
            // selectedPromptKey がない場合は、explain_meaning を選択する。
            let selectedPromptKey = result.selectedPromptKey;
            if (PROMPT_KEYS.includes(selectedPromptKey) == false) {
                selectedPromptKey = PROMPT_KEYS[0];
                chrome.storage.local.set({ selectedPromptKey: selectedPromptKey });
            }
            const form = AISearcher.createOptionsHtml(selectedPromptKey);
            wrapper.innerHTML = form;
            AISearcher.setEventsToAISearchForm(keyword, dictionary);
        });
    }


    static setEventsToAISearchForm(keyword, dictionary) {
        const submitButton = document.querySelector('#diqt-dict-ai-search-submit-button');
        submitButton.addEventListener('click', function () {
            // ボタンを無効化s
            submitButton.disabled = true;
            const promptKey = document.querySelector('#diqt-dict-prompt-select-form').value;
            chrome.storage.local.set({ selectedPromptKey: promptKey }, function () {
                console.log('Value is set to ' + promptKey);
            });
            submitButton.textContent = chrome.i18n.getMessage('asking');
            const resultsForm = document.querySelector('#diqt-dict-ai-search-results');
            resultsForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
            const port = chrome.runtime.connect({ name: "aiSearch" });
            port.postMessage({
                action: "aiSearch",
                keyword: keyword,
                sourceLangNumber: dictionary.lang_number_of_entry,
                targetLangNumber: dictionary.lang_number_of_meaning,
                promptKey: promptKey,
                version: 4,
                streaming: 1
            });

            let resultsText = '';
            let resultsBody = null;
            let finished = false;

            const finishRequest = function () {
                if (finished) {
                    return;
                }
                finished = true;
                submitButton.disabled = false;
                submitButton.textContent = chrome.i18n.getMessage('askAI');
                port.disconnect();
            };

            const ensureResultsBody = function () {
                if (resultsBody) {
                    return resultsBody;
                }
                resultsBody = AISearcher.renderResultsContainer(resultsForm, promptKey);
                return resultsBody;
            };

            const renderStreamedResults = function () {
                const formattedResults = AISearcher.formatResults(resultsText);
                ensureResultsBody().innerHTML = formattedResults;
            };

            port.onMessage.addListener(function (msg) {
                const data = msg['data'];
                if (data && Object.prototype.hasOwnProperty.call(data, 'delta')) {
                    resultsText += String(data.delta);
                    renderStreamedResults();
                    return true;
                }
                if (data && data.done) {
                    finishRequest();
                    return true;
                }
                if (data && (data['status'] == "200" || data['status'] == 200)) {
                    const ai_searcher = data.ai_searcher;
                    const results = ai_searcher && ai_searcher.results ? ai_searcher.results : '';
                    resultsText = String(results);
                    renderStreamedResults();
                    finishRequest();
                    return true;
                }
                const errorMessage = data && data['message'] ? data['message'] : chrome.i18n.getMessage('statusError');
                resultsForm.innerHTML = `<a href="${PREMIUM_PLAN_URL}" target="_blank" rel="noopener" style="font-size: 14px; color: #27ae60; font-weight: bold;">${errorMessage}</a>`;
                finishRequest();
                return true;
            });
        });
    }


    static createOptionsHtml(selectedPromptKey) {
        const options = PROMPT_KEYS.map(key => AISearcher.optionHtml(key, selectedPromptKey)).join('');
        // 
        return `<div class="diqt-dict-select-form cp_sl01">
                    <select id="diqt-dict-prompt-select-form" required>
                        ${options}
                    </select>
                </div>
                <button class="diqt-dict-submit-review-btn" id="diqt-dict-ai-search-submit-button">${chrome.i18n.getMessage('askAI')}</button>
                <div id="diqt-dict-ai-search-results"></div>`;
    }


    static optionHtml(promptKey, selectedPromptKey) {
        const camelCaseKey = AISearcher.camelCase(promptKey);
        return `<option value="${promptKey}" ${selectedPromptKey == promptKey ? 'selected' : ''}>${chrome.i18n.getMessage(camelCaseKey)}</option>`;
    }

    static renderResultsContainer(resultsForm, promptKey) {
        const camelCaseKey = AISearcher.camelCase(promptKey);
        resultsForm.innerHTML = `<div id="diqt-dict-prompt-key">${chrome.i18n.getMessage(camelCaseKey)}:</div>
                                 <div class="diqt-dict-ai-search-results-text"></div>`;
        return resultsForm.querySelector('.diqt-dict-ai-search-results-text');
    }

    static formatResults(results) {
        return results.replace(/\n/g, '<br>');
    }

    static camelCase(promptKey) {
        const camelCaseKey = promptKey.replace(/(_\w)/g, function (m) {
            return m[1].toUpperCase();
        });
        return camelCaseKey;
    }
}
