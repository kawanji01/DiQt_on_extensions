export class Pos {
    
    // universal_nameから品詞タグの翻訳を取得するヘルパーメソッド
    static getPosTagTranslation(universalName) {
        const messageKey = `posTag_${universalName}`;
        try {
            const translation = chrome.i18n.getMessage(messageKey);
            return translation || null;
        } catch (e) {
            return null;
        }
    }

    // 品詞のhtmlを作成する
    static createPosHtml(word) {
        let html = '';
        // 品詞を追加
        if (word.pos_tag != null) {
            // universal_nameから翻訳を取得、見つからなければ元のnameを使用
            let displayName = word.pos_tag.name;
            if (word.pos_tag.universal_name && word.pos_tag.universal_name !== '') {
                const translation = Pos.getPosTagTranslation(word.pos_tag.universal_name);
                if (translation) {
                    displayName = translation;
                }
            }
            html += `<div class="diqt-item-label">${displayName}</div>`;
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
}