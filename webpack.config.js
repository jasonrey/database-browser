const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: './resources/js/index.js',
    output: {
        filename: 'js/bundle.js',
        path: path.resolve(__dirname, 'app')
    },
    devtool: 'cheap-eval-source-map',
    module: {
        rules: [{
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
                loaders: {
                    sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
                    js: 'babel-loader?plugins[]=transform-object-rest-spread'
                }
            }
        }, {
            test: /\.pug$/,
            loader: 'pug-loader'
        }, {
            test: /\.css$/,
            use: ExtractTextPlugin.extract(['css-loader'])
        }, {
            test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
            loader: 'file-loader',
            options: {
                outputPath: 'fonts/',
                publicPath: '../'
            }
        }, {
            test: /\.(png|jpg)$/,
            loader: 'file-loader'
        }, {
            test: /\.(sass|scss)$/,
            use: ExtractTextPlugin.extract([{
                loader: 'css-loader',
                options: {
                    sourceMap: true
                }
            }, {
                loader: 'sass-loader',
                options: {
                    sourceMap: true
                }
            }])
        }]
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
        }
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            title: 'DBBR',
            filename: 'index.html',
            template: 'resources/pug/index.pug'
        }),
        new ExtractTextPlugin('css/bundle.css')
    ],

    devServer: {
        hot: true,
        contentBase: path.resolve(__dirname, 'app'),
        publicPath: '/'
    },

    target: 'electron'
}
