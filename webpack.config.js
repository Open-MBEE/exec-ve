const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')

const environment = require('./environment')

module.exports = (env) => {
    return {
        devtool: 'eval',
        entry: {
            veApp: {
                import: path.resolve(environment.paths.source, 'main.ts'),
            },
            // veDirectives: {
            //     import: './src/mms-directives/mms-directives.main.ts',
            //     dependOn: 'shared',
            // },
            // shared: [
            //     'angular',
            //     //'@uirouter/angularjs'
            // ],
        },

        optimization: {
            minimize: false,
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'js/[name].bundle.js',
            assetModuleFilename: '[name][ext]',
            publicPath: '/',
        },
        watch: true,
        resolve: {
            modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
            // Add '.ts' and '.tsx' as a resolvable extension.
            extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
            alias: {
                buffer: 'buffer',
            },
        },
        watchOptions: {
            aggregateTimeout: 300,
            poll: 300,
            ignored: /node_modules/,
        },
        plugins: [
            new webpack.EnvironmentPlugin({
                VE_ENV: 'local',
            }),
            new HtmlWebpackPlugin({
                title: 'View Editor',
                template: path.resolve(environment.paths.source, 'index.ejs'),
            }),
            new FaviconsWebpackPlugin({
                logo: path.resolve(
                    __dirname,
                    'src/assets/icons/favicon-32.png'
                ),
                prefix: '',
                publicPath: '../favicons',
                outputPath: path.resolve(__dirname, 'dist/favicons'),
                inject: true,
            }),
            new MiniCssExtractPlugin({
                filename: 'css/[name].min.css',
            }),
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(
                            environment.paths.source,
                            'config',
                            `config.${process.env.VE_ENV}.js`
                        ),
                        to: path.resolve(
                            environment.paths.output,
                            'config',
                            'config.js'
                        ),
                    },
                    {
                        from: path.resolve(
                            environment.paths.source,
                            'partials'
                        ),
                        to: path.resolve(environment.paths.output, 'partials'),
                    },
                ],
            }),
        ],
        module: {
            rules: [
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'img/[name][ext]',
                    },
                },
                {
                    test: /.(ttf|otf|eot|woff(2)?)(\?[a-z0-9]+)?$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name][ext]',
                    },
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        // Translates CSS into CommonJS
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: true,
                            },
                        },

                        'resolve-url-loader',
                        // Compiles Sass to CSS
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
                // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
                { test: /\.tsx?$/, loader: 'ts-loader' },
            ],
        },
    }
}
