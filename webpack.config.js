const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = {
    entry: './dev.js',
    mode: "development",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        library: 'MyPackages', // 导出的全局变量名
        libraryTarget: 'umd', // 通用模块格式
        umdNamedDefine: true, // 为 UMD 模块命名
        globalObject: 'this', // 兼容 Node 和浏览器环境
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.js$/,
                loader: 'babel-loader'
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ]
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]'
                }
            }
        ]
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        }
    },
    plugins: [

    ],
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist'),
        },
        compress: true,
        hot: true,
        port: 9000
    }
}
module.exports = (args) => {
    // 生产环境
    if (args.WEBPACK_BUILD) {
        config.mode = "production";
        config.entry = './index.js';
    }
    // 开发环境
    else {
        config.plugins.push(new HtmlWebpackPlugin({
            template: './public/index.html',
        }))
    }
    return config;
};