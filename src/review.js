//////// 復習に関する処理 START ////////

import { Icon } from './icon.js';

export class Review {

    // Wordの復習設定ボタンを生成する
    static createWordReviewButtons(word) {
        // 「意味を覚える」ボタン
        const quiz = word.quiz;
        if (quiz == null) {
            return '';
        }
        const quizId = quiz.id;
        const review = quiz.review;
        const reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quizId}">${Review.createReviewBtnHtml(quiz, review)}</div>`;
        // 「単語を覚える」ボタン
        const reversedQuiz = word.reversed_quiz;
        if (reversedQuiz == null) {
            return reviewBtn;
        }
        const reversedQuizId = reversedQuiz.id;
        const reversedReview = reversedQuiz.review;
        const reversedReviewBtn = `<div id="diqt-dict-review-btn-wrapper-${reversedQuizId}">${Review.createReviewBtnHtml(reversedQuiz, reversedReview)}</div>`;
        const helpLink = `<div style="text-align: left; margin-bottom: 16px;"><a href="https://abundant-galliform-71d.notion.site/1e0234a0842b80c4adc4ccc065620438" target="_blank" rel="noopener" class="diqt-dict-review-help-link">${Icon.questionCircle()}${chrome.i18n.getMessage('reviewHelpLink')}</a></div>`;
        return reviewBtn + reversedReviewBtn + helpLink;
    }

    // Sentenceの復習設定ボタンを生成する
    static createSentenceReviewButtons(sentence) {
        const quiz = sentence.quiz;
        if (quiz == null) {
            console.log('quiz is null');
            return '';
        }

        const review = quiz.review;
        const reviewBtn = `<div id="diqt-dict-review-btn-wrapper-${quiz.id}">${Review.createReviewBtnHtml(quiz, review)}</div>`;
        const reversedQuiz = sentence.reversed_quiz;
        if (reversedQuiz == null) {
            console.log('reversedQuiz is null');
            return reviewBtn;
        }
        const reversedReview = reversedQuiz.review;
        const reversedReviewBtn = `<div id="diqt-dict-review-btn-wrapper-${reversedQuiz.id}">${Review.createReviewBtnHtml(reversedQuiz, reversedReview)}</div>`;
        const helpLink = `<div style="text-align: left; margin-bottom: 8px;"><a href="https://abundant-galliform-71d.notion.site/1e2234a0842b8057a70ec995b5306ec7" target="_blank" rel="noopener" class="diqt-dict-review-help-link">${Icon.questionCircle()}このボタンは何？</a></div>`;

        return reviewBtn + reversedReviewBtn + helpLink;
    }

    // 復習設定ボタンを生成する
    static createReviewBtnHtml(quiz, review) {
        const quizId = quiz.id;
        const label = Review.reviewLabel(quiz);

        if (review) {
            // 設定編集ボタン
            return `<button class="diqt-dict-review-btn diqt-already-set" id="diqt-dict-review-edit-btn-${quizId}" style="font-weight: bold;">${Icon.alarmClock()}${chrome.i18n.getMessage('reviewFor', Review.reviewInterval(review.interval_setting))}</button>
            <div class="diqt-dict-review-form" id="diqt-dict-review-form-${quizId}"></div>`
        } else {
            // 新規設定ボタン
            return `<button class="diqt-dict-review-btn" id="diqt-dict-review-create-btn-${quizId}" style="font-weight: bold;">${Icon.alarmClock()}${label}</button>`
        }
    }

    static reviewLabel(quiz) {
        if (quiz.word_id != null) {
            const wordReviewLabel = chrome.i18n.getMessage('wordReviewLabel');
            return wordReviewLabel;
        } else if (quiz.reversed_word_id != null) {
            const reversedWordReviewLabel = chrome.i18n.getMessage('reversedWordReviewLabel');
            return reversedWordReviewLabel;
        } else if (quiz.sentence_id != null) {
            if (quiz.lang_number_of_question == quiz.lang_number_of_answer) {
                return chrome.i18n.getMessage('listeningSentenceReviewLabel');
            }
            return chrome.i18n.getMessage('sentenceReviewLabel');
        } else if (quiz.reversed_sentence_id != null) {
            const reversedSentenceReviewLabel = chrome.i18n.getMessage('reversedSentenceReviewLabel');
            return reversedSentenceReviewLabel;
        } else {
            return chrome.i18n.getMessage('remember');
        }
    }

    static setEventsToReviewButtons(word) {
        const quiz = word.quiz;
        if (quiz != null) {
            const review = quiz.review;
            Review.setEventToReviewBtn(quiz, review);
        }
        const reversedQuiz = word.reversed_quiz;
        if (reversedQuiz != null) {
            const reversedReview = reversedQuiz.review;
            Review.setEventToReviewBtn(reversedQuiz, reversedReview);
        }
        const sentence = word.sentence;
        if (sentence == null) {
            return;
        }
        const sentenceQuiz = sentence.quiz;
        if (sentenceQuiz != null) {
            const sentenceReview = sentenceQuiz.review;
            Review.setEventToReviewBtn(sentenceQuiz, sentenceReview);
        }
        const reversedSentenceQuiz = sentence.reversed_quiz;
        if (reversedSentenceQuiz != null) {
            const reversedSentenceReview = reversedSentenceQuiz.review;
            Review.setEventToReviewBtn(reversedSentenceQuiz, reversedSentenceReview);
        }
    }

    // 復習ボタンにイベントを設定
    static setEventToReviewBtn(quiz, review) {

        if (review) {
            // 復習の編集イベントを設定
            Review.editReviewSetting(quiz, review);
        } else {
            // 復習の新規作成イベントを設定
            Review.createReviewSetting(quiz);
        }

    }

    // 非ログイン時に、復習ボタンにログイン画面への遷移を設定する
    static setSignInToReviewBtn(quiz) {
        const quizId = quiz.id;
        const notLoggedInReviewBtn = document.querySelector(`#not-logged-in-review-btn-${quizId}`);
        if (notLoggedInReviewBtn) {
            notLoggedInReviewBtn.addEventListener('click', function () {
                // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                const rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
                return true;
            });
        }
    }


    // 復習設定フォームをレンダリングする。
    static renderReviewForm(quiz, review) {
        const quizId = quiz.id;
        const reviewForm = document.querySelector("#diqt-dict-review-form-" + quizId);
        reviewForm.innerHTML = Review.reviewFormHtml(review);
        Review.addEventToForm(quiz, review);
    }


    // 復習設定フォームのHTMLを返す関数。
    static reviewFormHtml(review) {
        const quizId = review.quiz_id;
        const html = `
        <div class="boqqs-dict-reminder-status">
        <p>${chrome.i18n.getMessage('reviewScheduledDate')}：${review.scheduled_date}</p>
        <p>${chrome.i18n.getMessage('reviewInterval')}：${chrome.i18n.getMessage('reviewFor', Review.reviewInterval(review.interval_setting))}</p>  
        <button class="diqt-dict-destroy-review-btn" id="diqt-dict-destroy-review-btn-${quizId}">${Icon.trash()}${chrome.i18n.getMessage('destroyReview')}</button>
        </div>      
<div class="diqt-dict-select-form cp_sl01">
<select id="diqt-dict-select-form-${quizId}" required>
	${Review.createOptions(review)}
</select>
</div>
<button class="diqt-dict-submit-review-btn" id="diqt-dict-update-review-btn-${quizId}">${chrome.i18n.getMessage('setReview')}</button>
<div class="diqt-dict-recommend-premium" id="diqt-dict-recommend-premium-${quizId}"></div>`
        return html;
    }


    // settingの番号を復習間隔に変換する関数
    static reviewInterval(setting) {
        setting = Number(setting);
        let interval = '';
        switch (setting) {
            case 0:
                interval = chrome.i18n.getMessage('tomorrow');
                break;
            case 1:
                interval = chrome.i18n.getMessage('after3Days');
                break;
            case 2:
                interval = chrome.i18n.getMessage('afterAWeek');
                break;
            case 3:
                interval = chrome.i18n.getMessage('after2Week');
                break;
            case 4:
                interval = chrome.i18n.getMessage('after3Week');
                break;
            case 5:
                interval = chrome.i18n.getMessage('afterAMonth');
                break;
            case 6:
                interval = chrome.i18n.getMessage('after2Month');
                break;
            case 7:
                interval = chrome.i18n.getMessage('after3Month');
                break;
            case 8:
                interval = chrome.i18n.getMessage('after6Month');
                break;
            case 9:
                interval = chrome.i18n.getMessage('afterAYear');
                break
        }
        return interval;
    }

    // 復習間隔を選択するためのoptionを作成する関数
    static createOptions(review) {
        let selectedNumber = 0;
        if (review.interval_setting) {
            selectedNumber = Number(review.interval_setting);
        }
        let html = ``
        for (let i = 0; i < 10; i++) {
            let icon = '';
            if (i != 0 && review.premium == 'false') {
                icon = '🔒 '
            }
            if (i == selectedNumber) {
                html = html + `<option value="${i}" selected>${icon}${chrome.i18n.getMessage('reviewFor', Review.reviewInterval(i))}</option>`
            } else {
                html = html + `<option value="${i}">${icon}${chrome.i18n.getMessage('reviewFor', Review.reviewInterval(i))}</option>`
            }
        }
        return html
    }

    // 復習設定フォームにイベントを設定する。
    static addEventToForm(quiz, review) {
        // 復習設定を更新するための設定
        Review.updateReviewSetting(quiz, review);
        // 復習設定を削除するための設定
        Review.destroyReviewSetting(quiz, review);
        //if (review.premium == false) {
        // 有料機能にロックをかける。また無料会員がプレミアム会員向けのoptionを選択したときにプレミアムプランを紹介する。
        //    Review.recommendPremium(quizId);
        //}
    }

    // 復習設定を新規作成する
    static createReviewSetting(quiz) {
        const quizId = quiz.id;
        const createBtn = document.querySelector(`#diqt-dict-review-create-btn-${quizId}`);
        if (createBtn) {

            createBtn.addEventListener('click', function () {
                // ボタンを無効化
                createBtn.disabled = true;
                createBtn.textContent = chrome.i18n.getMessage('nowSetting');
                // const settingNumber = document.querySelector("#diqt-dict-select-form-" + quizId).value;
                const port = chrome.runtime.connect({ name: "createReview" });
                port.postMessage({ action: "createReview", quizId: quizId });
                port.onMessage.addListener(function (msg) {
                    // ボタンを有効化
                    createBtn.disabled = false;
                    const response = msg.data
                    if (response.status == '401') {
                        createBtn.textContent = response.message;
                        return
                    }
                    const review = response.review;
                    const editBtn = Review.createReviewBtnHtml(quiz, review, 'loggedIn');
                    const reviewBtnWrapper = document.querySelector(`#diqt-dict-review-btn-wrapper-${quizId}`);
                    reviewBtnWrapper.innerHTML = editBtn;
                    Review.editReviewSetting(quiz, review);
                    return true;
                });
            });
        }
    }

    // 復習設定を編集する
    static editReviewSetting(quiz, review) {
        const quizId = quiz.id;
        const editBtn = document.querySelector(`#diqt-dict-review-edit-btn-${quizId}`);
        if (editBtn) {
            editBtn.addEventListener('click', function () {
                Review.renderReviewForm(quiz, review);
            });
        }
    }

    // 復習設定を更新する
    static updateReviewSetting(quiz, review) {
        const quizId = quiz.id;
        const submitBtn = document.querySelector("#diqt-dict-update-review-btn-" + quizId);
        submitBtn.addEventListener('click', function () {
            // ボタンを無効化
            submitBtn.disabled = true;
            submitBtn.textContent = chrome.i18n.getMessage('nowSetting');
            const settingNumber = document.querySelector("#diqt-dict-select-form-" + quizId).value;
            const port = chrome.runtime.connect({ name: "updateReview" });
            port.postMessage({ action: "updateReview", reviewId: review.id, settingNumber: settingNumber });
            port.onMessage.addListener(function (msg) {
                // ボタンを有効化
                submitBtn.disabled = false;
                const response = msg.data
                if (response.status == '401') {
                    submitBtn.textContent = response.message;
                    return
                }
                const review = response.review;
                const editBtn = Review.createReviewBtnHtml(quiz, review, 'loggedIn');
                const reviewBtnWrapper = document.querySelector(`#diqt-dict-review-btn-wrapper-${quizId}`);
                reviewBtnWrapper.innerHTML = editBtn;
                Review.editReviewSetting(quiz, review);
                return true;
            });
        });
    }

    // 復習設定を削除する
    static destroyReviewSetting(quiz, review) {
        const quizId = quiz.id;
        const deleteBtn = document.querySelector(`#diqt-dict-destroy-review-btn-${quizId}`);
        deleteBtn.addEventListener('click', function () {
            // ボタンを無効化
            deleteBtn.disabled = true;
            deleteBtn.textContent = chrome.i18n.getMessage('nowSetting');
            const port = chrome.runtime.connect({ name: "destroyReview" });
            port.postMessage({ action: "destroyReview", reviewId: review.id });
            port.onMessage.addListener(function (msg) {
                // ボタンを有効化
                deleteBtn.disabled = false;
                const response = msg.data;
                if (response.status == '401') {
                    deleteBtn.textContent = '401 error';
                    return
                }
                const createBtn = Review.createReviewBtnHtml(quiz, null, 'loggedIn');
                const reviewBtnWrapper = document.querySelector(`#diqt-dict-review-btn-wrapper-${quizId}`);
                reviewBtnWrapper.innerHTML = createBtn;
                Review.createReviewSetting(quiz);
                return true;
            });
        });
    }

    // プレミアム会員向けのoptionが選択されたときに、プレミアムプラン説明ページへのリンクを表示する。
    /* static recommendPremium(quiz) {
        const quizId = quiz.id;
        const textWrapper = document.querySelector(`#diqt-dict-recommend-premium-${quizId}`);
        const submitBtn = textWrapper.previousElementSibling;
        const select = document.querySelector(`#diqt-dict-select-form-${quizId}`);
        const settingNumber = Number(select.value);
        const recommendationHtml = `<p>プレミアム会員になることで、復習を自由に設定できるようになります！</p>
    <a href="${diqtRootUrl}/ja/plans/premium" target="_blank" rel="noopener">
    <button class="diqt-dict-submit-review-btn" style="width: 100%;"><i class="far fa-crown"></i> プレミアムプランを見る</button>
    </a>`

        if (settingNumber != 0) {
            submitBtn.classList.add("hidden");
            textWrapper.innerHTML = recommendationHtml;
        }

        select.addEventListener('change', function () {
            settingNumber = Number(this.value);
            if (settingNumber == 0) {
                submitBtn.classList.remove("hidden");
                textWrapper.innerHTML = '';
            } else {
                submitBtn.classList.add("hidden");
                textWrapper.innerHTML = recommendationHtml;
            }
        });
    } */

}



//////// 復習に関する処理 END ////////
