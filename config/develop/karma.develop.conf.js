// Karma configuration
// Generated on Wed Jan 13 2016 14:34:59 GMT-0800 (PST)
module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../../',
        urlRoot:'/base',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine-jquery', 'jasmine', 'fixture'],

        // list of files / patterns to load in the browser
        // Take note of the order of how each JS file is placed.
        files: [
            'node_modules/babel-polyfill/dist/polyfill.js',
             // external libs
            'dist/js/vendor.min.js',

            // external dev dependency libs
            'dist/bower_components/angular-mocks/angular-mocks.js',

             // internally maintained libs
            'dist/js/vendor-internal.min.js',
            "dist/lib/ckeditor/plugins/autosave/plugin.js",
            "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML",

             // our codes
            'dist/js/ve-mms.min.js',

             // test codes
            'test/develop/unit/**/*.js',
            'test/mock-data/**/*.js',
            // Fixtures -- This is how you can load JSON Data as mock data
            {pattern: 'test/mock-data/**/*.json', watched: true, served: true, included: false},
            {pattern: 'test/mock-data/**/*.html', watched: true, served: true, included: false},
            {pattern: 'src/directives/templates/**/*.html', watched: true, served: true, included: false}

        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            // '**/*.html'   : ['html2js'],
            // '**/*.json'   : ['json_fixtures']
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        //reporters: ['progress'],
        reporters: ['nyan','junit'],
        nyanReporter: {
        //   // suppress the error report at the end of the test run
        //   suppressErrorReport: true,
          //
        //   // suppress the red background on errors in the error
        //   // report at the end of the test run
        //   suppressErrorHighlighting: true,

          // increase the number of rainbow lines displayed
          // enforced min = 4, enforced max = terminal height - 1
        //   numberOfRainbowLines: 25, // default is 4
        },
        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // proxies:{
        //     '/alfresco':'http://your-url.com'
        // },
        // 'changeOrigin':true,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        jsonFixturesPreprocessor: {
            variableName: '__json__'
        },

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],
        plugins : [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-nyan-reporter',
            'karma-phantomjs-launcher',
            'karma-fixture',
            'karma-jasmine-jquery',
            'karma-html2js-preprocessor',
            'karma-json-fixtures-preprocessor',
            'karma-junit-reporter'
        ],

        junitReporter: {
            outputDir: 'test-results',
            outputFile: 'karma-test-output.xml',
            useBrowserName: false
        },

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    });
};
