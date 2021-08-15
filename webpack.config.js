// 参考： https://blog.chick-p.work/chrome-extensions-typescript/
// https: //tadtadya.com/webpack4-error-of-version-up-of-copywebpackplugin/

// [定数] webpack の出力オプションを指定する。参照： https://ics.media/entry/17376/
// 'production' か 'development' を指定
const MODE = "development";
// ソースマップの利用有無(productionのときはソースマップを利用しない)
const enabledSourceMap = MODE === "development";

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    //mode: process.env.NODE_ENV || "development",
    mode: MODE,
    // トランスパイル対象のファイルを entry で指定する。
    // jsframeのようなライブラリをトランスパイルすると、他のファイルから変数や関数を参照できなくなるので対象から外す。/ 参照： https://teratail.com/questions/190709
    entry: {
        main: [path.join(__dirname, "src/content_scripts.js")],
        background: path.join(__dirname, "src/background.js"),
    },
    // トランスパイル後の JavaScript ファイルを dist/js の下に出力する。
    output: {
        path: path.join(__dirname, "dist/js"),
        filename: "[name].js",
    },
    module: {
        rules: [{
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            }, // Sassファイルの読み込みとコンパイル
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
                            // ソースマップの利用有無
                            sourceMap: enabledSourceMap,

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
                            sourceMap: enabledSourceMap,
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    // CopyPlugin を使って、「public」ディレクトリに置いたアイコンファイルや manifest.json をコピーする。
    plugins: [
        new CopyPlugin({
            patterns: [{
                from: ".",
                to: "../",
                context: "public"
            }],
        }),
        // CSSファイルを外だしにするプラグイン
        new MiniCssExtractPlugin({
            // ファイル名を設定する
            filename: "./style.css",
        }),
    ]
};