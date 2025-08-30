// ユーザー言語設定
export const USER_LANGUAGE = chrome.i18n.getUILanguage().split("-")[0];
export const LOCALE = ['ja', 'en'].includes(USER_LANGUAGE) ? USER_LANGUAGE : 'ja';
export const USER_LANG_NUMBER = LOCALE === 'ja' ? 44 : 21;

// URL設定
export const DIQT_URL = `${process.env.ROOT_URL}/${LOCALE}`;
export const PREMIUM_PLAN_URL = `${DIQT_URL}/plans/premium`;

// API設定（background.jsでのみ使用）
export const API_KEY = process.env.API_KEY;
export const SECRET_KEY = process.env.SECRET_KEY;
export const BASIC_AUTH = "Basic " + btoa(unescape(encodeURIComponent(API_KEY + ":" + SECRET_KEY)));

// 言語設定
export const RTL_LANGUAGES = [4, 35, 72, 101];

// 検索設定
export const ENTRY_LIMIT = 50;

// AIプロンプトキー
export const PROMPT_KEYS = [
    'explain_meaning',
    'explain_usage',
    'explain_example',
    'explain_synonym',
    'explain_antonym',
    'explain_conjugation',
    'explain_etymology',
    'explain_grammar',
    'proofread_sentence'
];