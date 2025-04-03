const promptKeys = ['explain_meaning', 'explain_usage', 'explain_example', 'explain_synonym', 'explain_antonym', 'explain_conjugation', 'explain_etymology', 'explain_grammar', 'proofread_sentence'];

export class AISearcher {

    static addAISearchForm(keyword, dictionary) {
        const wrapper = document.querySelector('#diqt-dict-ai-search-wrapper');
        chrome.storage.local.get(['selectedPromptKey'], function (result) {
            // selectedPromptKey がない場合は、explain_meaning を選択する。
            let selectedPromptKey = result.selectedPromptKey;
            if (promptKeys.includes(selectedPromptKey) == false) {
                selectedPromptKey = promptKeys[0];
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
            // ボタンを無効化
            submitButton.disabled = true;
            const promptKey = document.querySelector('#diqt-dict-prompt-select-form').value;
            chrome.storage.local.set({ selectedPromptKey: promptKey }, function () {
                console.log('Value is set to ' + promptKey);
            });
            submitButton.textContent = chrome.i18n.getMessage('asking');
            const resultsForm = document.querySelector('#diqt-dict-ai-search-results');
            resultsForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
            const port = chrome.runtime.connect({ name: "aiSearch" });
            port.postMessage({ action: "aiSearch", keyword: keyword, sourceLangNumber: dictionary.lang_number_of_entry, targetLangNumber: dictionary.lang_number_of_meaning, promptKey: promptKey, version: 3 });
            port.onMessage.addListener(function (msg) {
                // ボタンを有効化
                submitButton.disabled = false;
                submitButton.textContent = chrome.i18n.getMessage('askAI');
                const data = msg['data'];
                const ai_searcher = data.ai_searcher;
                const results = ai_searcher.results;
                const formattedResults = results.replace(/\n/g, '<br>');
                const camelCaseKey = AISearcher.camelCase(promptKey);
                resultsForm.innerHTML = `<div id="diqt-dict-prompt-key">${chrome.i18n.getMessage(camelCaseKey)}:</div>
                                         <div id="diqt-dict-ai-search-results">${formattedResults}</div>`;
            });
        });
    }


    static createOptionsHtml(selectedPromptKey) {
        const options = promptKeys.map(key => AISearcher.optionHtml(key, selectedPromptKey)).join('');
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

    static camelCase(promptKey) {
        const camelCaseKey = promptKey.replace(/(_\w)/g, function (m) {
            return m[1].toUpperCase();
        });
        return camelCaseKey;
    }
}