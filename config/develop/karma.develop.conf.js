// Karma configuration
// Generated on Wed Jan 13 2016 14:34:59 GMT-0800 (PST)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../../',
        urlRoot:'/',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine-jquery', 'jasmine', 'fixture'],

        // list of files / patterns to load in the browser
        // Take note of the order of how each JS file is placed.
        files: [
            "build/bower_components/jquery/dist/jquery.js",
            "build/bower_components/angular/angular.js",
            'build/bower_components/angular-mocks/angular-mocks.js',
            "build/bower_components/angular-animate/angular-animate.js",
            "build/bower_components/angular-borderlayout/src/borderLayout.js",
            "build/bower_components/angular-ui-router/release/angular-ui-router.js",
            "build/bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js",
            "build/bower_components/angular-ui-tree/dist/angular-ui-tree.js",
            "build/bower_components/angular-growl-v2/build/angular-growl.js",
            "build/bower_components/angular-hotkeys/build/hotkeys.min.js",
            "build/bower_components/lodash/lodash.js",
            "build/bower_components/stompjs/lib/stomp.min.js",
            "build/bower_components/d3/d3.js",
            "build/bower_components/c3/c3.js",
            //"build/bower_components/timely/timely.js",
            // "build/bower_components/tinymce/tinymce.js",

            "build/lib/jquery.isonscreen.js",
            "build/lib/table2CSV.js",
            "build/lib/ckeditor/ckeditor.js",
            //"build/lib/ckeditor/plugins/mathjax/dialogs/mathjax.js",
            "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML",

            'build/mms.js',
            'build/mms.directives.tpls.js',
            'build/mms.directives.js',
            
            'build/js/mms/app.tpls.js',
            'build/js/mms/app.js',
            'build/js/mms/controllers.js',
            'test/develop/unit/**/*.js',
            'test/mock-data/*.js',
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

        proxies:{
            '/alfresco':'http://ems-test.jpl.nasa.gov'
        },
        'changeOrigin':true,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        jsonFixturesPreprocessor: {
            variableName: '__json__'
        },

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],
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
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    });
};
