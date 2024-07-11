// 参考： https://blog.chick-p.work/chrome-extensions-typescript/
// https: //tadtadya.com/webpack4-error-of-version-up-of-copywebpackplugin/


const path = require("path");
// 環境変数を読み込む
require('dotenv').config({ path: path.resolve(__dirname, '.env') });


// [定数] webpack の出力オプションを指定する。参照： https://ics.media/entry/17376/
// 'production' か 'development' を指定
const isDev = process.env.ENV === "development"

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");

// 環境変数を.envで管理する。参考： https://forsmile.jp/javascript/1054/
//const Dotenv = require('dotenv-webpack');



module.exports = {
    mode: isDev ? "development" : "production",
    //mode: 'production',
    // トランスパイル対象のファイルを entry で指定する。
    // jsframeのようなライブラリをトランスパイルすると、他のファイルから変数や関数を参照できなくなるので対象から外す。/ 参照： https://teratail.com/questions/190709
    entry: {
        main: [path.join(__dirname, "src/content_scripts.js"), path.join(__dirname, "src/style.scss")],
        background: path.join(__dirname, "src/background.js"),
        offscreen: path.join(__dirname, "src/offscreen.js"),
        options: path.join(__dirname, "public/options.js"),
    },
    // トランスパイル後の JavaScript ファイルを dist/以下に出力する。（manifest 3ではbackground.jsはmanifest.jsonと同じ階層に置かなくてはならない。）
    output: {
        path: path.join(__dirname, "dist/"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.scss/, // 対象となるファイルの拡張子
                use: [
                    // CSSファイルを書き出すオプションを有効にする
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    // CSSをバンドルするための機能
                    {
                        loader: "css-loader",
                        options: {
                            // オプションでCSS内のurl()メソッドの取り込みを禁止する
                            url: false,
                            // ソースマップ（デバッグを容易にする設定）の利用有無。productionのときはソースマップを有効にしない。
                            sourceMap: isDev,

                            // 0 => no loaders (default);
                            // 1 => postcss-loader;
                            // 2 => postcss-loader, sass-loader
                            importLoaders: 2,
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            // ソースマップの利用有無
                            sourceMap: isDev,
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".js"]
    },

    plugins: [
        // 環境変数を.envで管理する。
        //new Dotenv({
        //    path: path.resolve(__dirname, '.env'),
        //}),
        new webpack.DefinePlugin({
            'process.env.ROOT_URL': isDev ? JSON.stringify(process.env.DEV_ROOT_URL) : JSON.stringify(process.env.PROD_ROOT_URL),
            'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
            'process.env.SECRET_KEY': JSON.stringify(process.env.SECRET_KEY),
        }),
        // CopyPlugin を使って、「public」ディレクトリに置いたアイコンファイルや manifest.json をコピーする。
        new CopyPlugin({
            patterns: [{
                from: ".",
                to: "./",
                context: "public"
            }, {
                from: "./fonts",
                to: "./fonts"
            }, {
                from: "./_locales",
                to: "./_locales"
            }],
        }),
        // CSSファイルを外だしにするプラグイン
        new MiniCssExtractPlugin({
            // ファイル名を設定する
            filename: "./style.css",
        }),


    ]
};