import { Review } from './review.js';
import { Sentence } from './sentence.js';
import { Translator } from './translator.js';

const userLanguage = chrome.i18n.getUILanguage().split("-")[0];
const locale = ['ja', 'en'].includes(userLanguage) ? userLanguage : 'ja';
const userLangNumber = locale == 'ja' ? 44 : 21;
const diqtUrl = `${process.env.ROOT_URL}/${locale}`;

export class Word {



    // WordのHTMLを作成する
    static createWordHtml(word) {
        //const tags = createTagsHtml(word.tags);
        const wordURL = `${diqtUrl}/words/${word.id}`;
        /* 見出し語 */
        const entry = `<div class="diqt-dict-entry">
                            <span>${word.entry}</span><button class="diqt-dict-speech-btn" value="${word.entry_audio_url}"><i class="fas fa-volume-up"></i></button>
                        </div>`;
        // 発音記号
        const pronunciation = Word.createPronunciation(word);
        // 品詞
        const pos = Word.createPos(word);
        /* 意味 */
        const meaning = `<div class="diqt-dict-meaning">${Word.markNotation(word.meaning)}</div>
                        <div id="meaning-translation-buttons-word-${word.id}"></div>`;
        /* 復習ボタン */
        const reviewButtons = Review.createWordReviewButtons(word);
        /* 例文 */
        const sentenceHtml = Sentence.createHtml(word);
        /* 関連語 */
        const relatedForms = Word.createRelatedFormsHtml(word);
        /* 項目の編集ボタン */
        const linkToEditWord = Word.liknToEditHtml(wordURL, chrome.i18n.getMessage("editWord"));
        /* 項目編集ボタンの上の余白 */
        // const spaceBeforeImproveWordBtn = '<div style="width: 100%; height: 16px;"></div>'
        /* 項目と次の項目の間の余白 */
        const bottomSpace = '<div style="width: 100%; height: 24px;"></div>'
        /* 項目のレンダリング */
        const wordHtml = entry + pronunciation + pos + meaning + reviewButtons + sentenceHtml + relatedForms + linkToEditWord + bottomSpace;
        return wordHtml;
    }

    // 発音記号 / 読み
    static createPronunciation(word) {
        if (word.lang_number_of_entry == 44) {
            // 日本語なら読みを表示する
            return `<div class="diqt-dict-pronunciation">${word.reading}</div>`;
        } else {
            if (word.ipa != null) {
                return `<div class="diqt-dict-pronunciation">${word.ipa}</div>`;
            } else {
                return '';
            }
        }
    }

    // 品詞のhtmlを作成する
    static createPos(word) {
        let html = '';
        // 品詞を追加
        if (word.pos_tag != null) {
            html += `<div class="diqt-item-label">${word.pos_tag.name}</div>`;
        } else if (word.pos != null && word.pos != "") {
            html += `<div class="diqt-item-label">${word.pos}</div>`;
        }
        // タグを追加
        if (word.senses_tags && word.senses_tags.length > 0) {
            word.senses_tags.forEach(tag => {
                html += `<div class="diqt-item-label" style="background-color: #6e6e6e; color: white;">${tag}</div>`;
            });
        }
        return html;
    }


    //  意味の翻訳イベントを設定する。
    static setEventsToMeaningTranslation(word) {
        const buttons = document.getElementById(`meaning-translation-buttons-word-${word.id}`);
        Translator.addTranslationButtons(buttons, word.meaning, word.lang_number_of_meaning, userLangNumber);
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


    // 関連語のhtmlを作成する
    static createRelatedFormsHtml(word) {
        if (!word.forms_list) return '';

        try {
            const forms = word.forms_list;
            console.log(forms);
            if (!forms || forms.length === 0) return '';

            let formsHtml = forms.map(form => {
                const tags = form.tags.map(tag =>
                    `<div class="diqt-item-label" style="background-color: #6e6e6e; color: white; font-size: 10px;">${tag}</div>`
                ).join('');
                return `<div style="display: flex; align-items: center; margin: 4px 0;">
                    <span style="margin-right: 8px; color: #6e6e6e; font-size: 14px;">${form.form}</span>
                    ${tags}
                </div>`;
            }).join('');

            return `
                <div style="margin: 16px 0;">
                    <div class="diqt-item-label" style="display: inline-block; margin-bottom: 8px;">${chrome.i18n.getMessage('relatedForms')}</div>
                    ${formsHtml}
                </div>
            `;
        } catch (e) {
            console.error('Failed to parse forms_list:', e);
            return '';
        }
    }


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
                if (target.value != "") {
                    // URLで指定された音声ファイルを再生する
                    console.log('Sending message to background.js:', target.value);
                    // chrome.runtime.sendMessageを使用してメッセージを送信
                    chrome.runtime.sendMessage({ action: "playAudio", url: target.value }, response => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                        } else {
                            console.log('Audio play response:', response);
                        }
                    });
                } else {
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
                }

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