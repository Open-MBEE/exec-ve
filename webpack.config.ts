import * as fs from 'fs'
import * as path from 'path'

import hq from 'alias-hq'
import CopyPlugin from 'copy-webpack-plugin'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import { PackageJson } from 'type-fest'
import webpack, { AutomaticPrefetchPlugin, Compiler, Configuration } from 'webpack'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { VeExperimentConfig, VeExperimentDescriptor } from '@ve-components/services'

import environment from './src/lib/environment'

import { VeConfig } from '@ve-types/config'

const sourceDir = './ve-custom'
const extensionsDir = './src/ve-extensions'

interface ArgV {
    mode: 'none' | 'development' | 'production'
    [key: string]: unknown
}

class WatchRunPlugin implements AutomaticPrefetchPlugin {
    apply(compiler: Compiler): void {
        compiler.hooks.watchRun.tap('WatchRun', (comp) => {
            if (comp.modifiedFiles) {
                const changedFiles = Array.from(comp.modifiedFiles, (file) => `\n  ${file}`).join('')
                console.log('')
                console.log('===============================')
                console.log('FILES CHANGED:', changedFiles)
                console.log('===============================')
            }
            if (comp.removedFiles) {
                const changedFiles = Array.from(comp.removedFiles, (file) => `\n  ${file}`).join('')
                console.log('')
                console.log('===============================')
                console.log('FILES REMOVED:', changedFiles)
                console.log('===============================')
            }
        })
    }
}

class SetupPlugin implements AutomaticPrefetchPlugin {
    private readonly mode: string
    private ran: boolean
    constructor(mode) {
        this.mode = mode === 'development' ? '-dev' : ''
        this.ran = false
    }
    apply(compiler: Compiler): void {
        compiler.hooks.beforeCompile.tap('Setup', (comp) => {
            const configObj: VeConfig =
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                require(`./config/${process.env.VE_ENV}.json`) as VeConfig

            if (this.ran) {
                return
            }
            this.ran = true
            if (configObj.experimental) {
                const validExt = ['specTools', 'transclusions', 'presentations', 'insertions', 'trees']
                fs.writeFile(
                    `${extensionsDir}/index.ts`,
                    '//** Automatically Generated by Webpack do not edit **//',
                    (err) => {
                        if (err) {
                            throw err
                        }
                    }
                )
                for (const ext of configObj.experimental) {
                    // if (!configObj.ran) {
                    let extPath = `./${ext.id}`
                    if (ext.path) {
                        extPath = path.resolve(sourceDir, ext.path)
                    }

                    fs.appendFile(`${extensionsDir}/index.ts`, `\nimport '${extPath}'`, (err) => {
                        if (err) {
                            throw err
                        }
                    })
                    if (!configObj.expConfig) {
                        configObj.expConfig = {}
                        for (const type of validExt) {
                            configObj.expConfig[type] = []
                        }
                    }
                    let extConfPath = `${extensionsDir}/${ext.id}/config.json`
                    if (ext.config) {
                        extConfPath = ext.config
                    }

                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const extConf = require(extConfPath) as VeExperimentConfig
                    for (const extType of validExt) {
                        if (
                            extConf[extType] &&
                            Array.isArray(extConf[extType]) &&
                            (extConf[extType] as VeExperimentDescriptor[]).length > 0
                        ) {
                            for (const ec of extConf[extType] as VeExperimentDescriptor[]) {
                                ;(configObj.expConfig[extType] as VeExperimentDescriptor[]).push(ec)
                            }
                        }
                    }
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const packageJson = require('./package.json') as PackageJson
            configObj.version = `${packageJson.version}${this.mode}`
            fs.mkdirSync('./dist/config', { recursive: true })
            fs.writeFile(__dirname + '/dist/config/config.json', JSON.stringify(configObj), (err) => {
                if (err) {
                    throw err
                }
            })
        })
    }
}

const config = (env: any, argv: ArgV): Configuration => ({
    mode: argv.mode ? argv.mode : 'production',
    experiments: {
        topLevelAwait: true,
    },
    devtool: 'source-map',
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
        minimize: argv.mode === 'production',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].bundle.js',
        assetModuleFilename: '[name][ext]',
        publicPath: '',
    },
    watch: true,
    resolve: {
        modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
        alias: hq.get('webpack') as
            | {
                  /**
                   * New request.
                   */
                  alias: string | false | string[]
                  /**
                   * Request to be redirected.
                   */
                  name: string
                  /**
                   * Redirect only exact matching request.
                   */
                  onlyModule?: boolean
              }[]
            | { [index: string]: string | false | string[] },
    },
    watchOptions: {
        aggregateTimeout: 300,
        poll: 300,
        ignored: ['**/node_modules/', '**/ckeditor-dev', '**/src/ve-experimental/index.ts'],
    },
    plugins: [
        new WatchRunPlugin(),
        new SetupPlugin(argv.mode),
        new webpack.EnvironmentPlugin({
            VE_ENV: 'local',
        }),
        new HtmlWebpackPlugin({
            title: 'View Editor',
            template: path.resolve(environment.paths.source, 'index.ejs'),
            templateParameters: {
                ckPath: 'ckeditor',
                mjPath: 'mathjax',
            },
        }),
        new FaviconsWebpackPlugin({
            logo: path.resolve(__dirname, 'src/assets/icons/favicon-32.png'),
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
                    from: path.resolve(__dirname, 'config', `config.js`),
                    to: path.resolve(environment.paths.output, 'config', 'config.js'),
                },
                {
                    from: path.resolve(environment.paths.source, 'lib', 'ckeditor'),
                    to: path.resolve(environment.paths.output, 'ckeditor'),
                },
                {
                    from: path.resolve(environment.paths.modules, 'mathjax', 'es5'),
                    to: path.resolve(environment.paths.output, 'mathjax'),
                },
                {
                    from: path.resolve(environment.paths.source, 'lib', 'ckeditor-plugins'),
                    to: path.resolve(environment.paths.output, 'ckeditor', 'plugins'),
                },
                {
                    from: path.resolve('./node_modules', 'jquery', 'dist', 'jquery.js'),
                    to: path.resolve(environment.paths.output, 'js', 'jquery.js'),
                },
                {
                    from: path.resolve(environment.paths.source, 'errors'),
                    to: path.resolve(environment.paths.output, 'errors'),
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
                    // Creates `style` nodes from JS strings
                    'style-loader',
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
})

export default config
