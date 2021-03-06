const webpack = require('webpack');
const path = require('path');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
	module: {
		rules: [
			{
				test: /\.js$/,
				use: ["source-map-loader"],
				enforce: "pre"
			},
			{
				test: /\.jsx$/,
				include: [path.resolve(__dirname, 'src')],
				exclude: /node_modules/,
				loader: 'babel-loader',

				options: {
					plugins: ['syntax-dynamic-import'],

					presets: [
						[
							'@babel/preset-env',
							{
								targets: {
									"chrome": "75",
								},
								modules: false
							}
						],
						"@babel/preset-react",
					]
				},
			},
			{
				test: /\.js$/,
				include: [path.resolve(__dirname, 'src')],
				exclude: /node_modules/,
				loader: 'babel-loader',

				options: {
					plugins: ['syntax-dynamic-import'],

					presets: [
						[
							'@babel/preset-env',
							{
								targets: {
									"chrome": "75",
								},
								modules: false
							}
						]
					]
				},
			},
			{
				test: /\.tsx?$/,
				include: [path.resolve(__dirname, 'src')],
				exclude: /node_modules/,
				loader: 'ts-loader',
				options: {
					experimentalWatchApi: true,
					transpileOnly: true,
				}
			},
			{
				test: /\.(scss|css)$/,

				use: [
					{
						loader: 'style-loader'
					},
					{
						loader: 'css-loader'
					},
					{
						loader: 'sass-loader'
					}
				]
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.jsx']
	},

	devServer: {
		publicPath: "/",
		contentBase: path.resolve("."),
		host: "localhost",
		port: 7005,
		open: true,
		historyApiFallback: true,
		hot: true,
	},
	devtool: 'inline-source-map',

	entry: {
		app: './src/index.js'
	},

	output: {
		publicPath: "/",
		filename: '[name].[hash].js'
	},

	mode: 'development',

	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: {
					priority: -10,
					test: /[\\/]node_modules[\\/]/
				}
			},

			chunks: 'async',
			minChunks: 1,
			minSize: 30000,
			name: true
		}
	},

	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new HtmlWebpackPlugin({
			inject: true,
			template: "src/index.html",
		}),
	]
};
