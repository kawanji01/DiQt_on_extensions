
//////// 復習に関する処理 START ////////

export class Review {
    // 復習設定ボタンを生成する
    static createReviewBtnHtml(quizId, review, loginToken) {
        if (loginToken) {
            if (review) {
                // 設定編集ボタン
                return `<div class="diqt-dict-review-btn diqt-already-set" id="diqt-dict-review-edit-btn-${quizId}" style="font-weight: bold;"><i class="far fa-alarm-clock" style="margin-right: 4px;"></i>${Review.reviewInterval(review.interval_setting)}に復習する</div>
            <div class="diqt-dict-review-form" id="diqt-dict-review-form-${quizId}"></div>`
            } else {
                // 新規設定ボタン
                return `<div class="diqt-dict-review-btn" id="diqt-dict-review-create-btn-${quizId}" style="font-weight: bold;"><i class="far fa-alarm-clock" style="margin-right: 4px;"></i>覚える</div>`
            }
        } else {
            // 非ログイン時の復習設定ボタン
            return `<div class="diqt-dict-review-btn" id="not-logged-in-review-btn-${quizId}" style="font-weight: bold;"><i class="far fa-alarm-clock" style="margin-right: 4px;"></i>覚える</div></a>`
        }
    }

    // 復習ボタンにイベントを設定
    static setEventToReviewBtn(quizId, review, loginToken) {
        if (loginToken) {
            if (review) {
                // 復習の編集イベントを設定
                Review.editReviewSetting(quizId, review);
            } else {
                // 復習の新規作成イベントを設定
                Review.createReviewSetting(quizId);
            }
        } else {
            // ログイン画面への遷移を設定
            Review.setSignInToReviewBtn(quizId)
        }
    }

    // 非ログイン時に、復習ボタンにログイン画面への遷移を設定する
    static setSignInToReviewBtn(quizId) {
        let notLoggedInReviewBtn = document.querySelector(`#not-logged-in-review-btn-${quizId}`);
        if (notLoggedInReviewBtn) {
            notLoggedInReviewBtn.addEventListener('click', function () {
                // backgroundへactionのメッセージを送ることで、オプション画面を開いてもらう。
                let rtnPromise = chrome.runtime.sendMessage({ "action": "openOptionsPage" });
                rtnPromise.then((response) => { }).catch((error) => { });
                return true;
            });
        }
    }



    // 復習設定の新規作成イベントをセット
    /* function setCreateToReviewBtn(word) {
        let wordQuizId = word['quiz']['id']
        let reviewBtn = document.querySelector("#diqt-dict-review-" + wordQuizId);
        let reviewForm = reviewBtn.nextSibling;
        reviewBtn.addEventListener('click', function () {
            reviewForm.innerHTML = `<div class="center"><div class="lds-ripple-diqt-dict"><div></div><div></div></div></div>`;
            renderReviewForm(wordQuizId);
        });
    } */


    // 復習設定フォームをレンダリングする。
    static renderReviewForm(quizId, review) {
        let reviewForm = document.querySelector("#diqt-dict-review-form-" + quizId);
        reviewForm.innerHTML = Review.reviewFormHtml(review);
        Review.addEventToForm(review);
    }


    // 復習設定フォームのHTMLを返す関数。
    static reviewFormHtml(review) {
        let quizId = review.quiz_id;
        let html = `
        <div class="boqqs-dict-reminder-status">
        <p>復習予定：${review.scheduled_date}</p>
        <p>復習設定：${Review.reviewInterval(review.interval_setting)}に復習する</p>  
        <div class="diqt-dict-destroy-review-btn" id="diqt-dict-destroy-review-btn-${quizId}"><i class="far fa-trash"></i> 復習設定を削除する</div>
        </div>      
<div class="diqt-dict-select-form cp_sl01">
<select id="diqt-dict-select-form-${quizId}" style="height: 40px;" required>
	${Review.createOptions(review)}
</select>
</div>
<button class="diqt-dict-submit-review-btn" id="diqt-dict-update-review-btn-${quizId}">設定する</button>
<div class="diqt-dict-recommend-premium" id="diqt-dict-recommend-premium-${quizId}"></div>`

        return html;
    }


    // settingの番号を復習間隔に変換する関数
    static reviewInterval(setting) {
        setting = Number(setting);
        let interval = '';
        switch (setting) {
            case 0:
                interval = `明日`;
                break;
            case 1:
                interval = '3日後';
                break;
            case 2:
                interval = '１週間後';
                break;
            case 3:
                interval = '２週間後';
                break;
            case 4:
                interval = '３週間後';
                break;
            case 5:
                interval = '１ヶ月後';
                break;
            case 6:
                interval = '２ヶ月後';
                break;
            case 7:
                interval = '３ヶ月後';
                break;
            case 8:
                interval = '６ヶ月後';
                break;
            case 9:
                interval = '1年後';
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
                html = html + `<option value="${i}" selected>${icon}${Review.reviewInterval(i)}に復習する</option>`
            } else {
                html = html + `<option value="${i}">${icon}${Review.reviewInterval(i)}に復習する</option>`
            }
        }
        return html
    }

    // 復習設定フォームにイベントを設定する。
    static addEventToForm(review) {
        let quizId = review.quiz_id;
        // 復習設定を更新するための設定
        Review.updateReviewSetting(quizId, review);
        // 復習設定を削除するための設定
        Review.destroyReviewSetting(quizId, review);
        //if (review.premium == false) {
        // 有料機能にロックをかける。また無料会員がプレミアム会員向けのoptionを選択したときにプレミアムプランを紹介する。
        //    Review.recommendPremium(quizId);
        //}
    }

    // 復習設定を新規作成する
    static createReviewSetting(quizId) {
        let createBtn = document.querySelector(`#diqt-dict-review-create-btn-${quizId}`);
        if (createBtn) {

            createBtn.addEventListener('click', function () {
                createBtn.textContent = '設定中...'
                // let settingNumber = document.querySelector("#diqt-dict-select-form-" + quizId).value;
                let port = chrome.runtime.connect({ name: "createReview" });
                port.postMessage({ action: "createReview", quizId: quizId });
                port.onMessage.addListener(function (msg) {
                    let response = msg.data
                    if (response.status == '401') {
                        createBtn.textContent = response.message;
                        return
                    }
                    let review = response.review;
                    let editBtn = Review.createReviewBtnHtml(quizId, review, 'loggedIn');
                    let reviewBtnWrapper = document.querySelector(`#diqt-dict-review-btn-wrapper-${quizId}`);
                    reviewBtnWrapper.innerHTML = editBtn;
                    Review.editReviewSetting(quizId, review);
                    return true;
                });
            });
        }
    }

    // 復習設定を編集する
    static editReviewSetting(quizId, review) {
        let editBtn = document.querySelector(`#diqt-dict-review-edit-btn-${quizId}`);
        if (editBtn) {
            editBtn.addEventListener('click', function () {
                Review.renderReviewForm(quizId, review);
            });
        }
    }

    // 復習設定を更新する
    static updateReviewSetting(quizId, review) {
        let submitBtn = document.querySelector("#diqt-dict-update-review-btn-" + quizId);
        submitBtn.addEventListener('click', function () {
            submitBtn.textContent = '設定中...'
            let settingNumber = document.querySelector("#diqt-dict-select-form-" + quizId).value;
            let port = chrome.runtime.connect({ name: "updateReview" });
            port.postMessage({ action: "updateReview", reviewId: review.id, settingNumber: settingNumber });
            port.onMessage.addListener(function (msg) {
                let response = msg.data
                if (response.status == '401') {
                    submitBtn.textContent = response.message;
                    return
                }
                let review = response.review;
                let editBtn = Review.createReviewBtnHtml(quizId, review, 'loggedIn');
                let reviewBtnWrapper = document.querySelector(`#diqt-dict-review-btn-wrapper-${quizId}`);
                reviewBtnWrapper.innerHTML = editBtn;
                Review.editReviewSetting(quizId, review);
                return true;
            });
        });
    }

    // 復習設定を削除する
    static destroyReviewSetting(quizId, review) {
        let deleteBtn = document.querySelector(`#diqt-dict-destroy-review-btn-${quizId}`);
        deleteBtn.addEventListener('click', function () {
            deleteBtn.textContent = '設定中...';
            let port = chrome.runtime.connect({ name: "destroyReview" });
            port.postMessage({ action: "destroyReview", reviewId: review.id });
            port.onMessage.addListener(function (msg) {
                let response = msg.data;
                if (response.status == '401') {
                    deleteBtn.textContent = '401 error';
                    return
                }
                let createBtn = Review.createReviewBtnHtml(quizId, null, 'loggedIn');
                let reviewBtnWrapper = document.querySelector(`#diqt-dict-review-btn-wrapper-${quizId}`);
                reviewBtnWrapper.innerHTML = createBtn;
                Review.createReviewSetting(quizId);
                return true;
            });
        });
    }

    // プレミアム会員向けのoptionが選択されたときに、プレミアムプラン説明ページへのリンクを表示する。
    static recommendPremium(quizId) {
        const textWrapper = document.querySelector(`#diqt-dict-recommend-premium-${quizId}`);
        const submitBtn = textWrapper.previousElementSibling;
        const select = document.querySelector(`#diqt-dict-select-form-${quizId}`);
        let settingNumber = Number(select.value);
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
    }

}



//////// 復習に関する処理 END ////////