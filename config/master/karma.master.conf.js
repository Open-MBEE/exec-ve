// Karma configuration
// Generated on Wed Jan 13 2016 14:34:59 GMT-0800 (PST)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '../../',
        urlRoot:'/',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        // Take note of the order of how each JS file is placed.
        files: [
            'build/bower_components/jquery/dist/jquery.js',
            'build/bower_components/angular/angular.js',
            'build/bower_components/angular-mocks/angular-mocks.js',
            'build/bower_components/angular-borderlayout/src/borderLayout.js',
            'build/bower_components/angular-animate/angular-animate.js',
            'build/bower_components/angular-growl-v2/build/angular-growl.js',
            'build/bower_components/angular-ui-bootstrap-bower/ui-bootstrap.js',
            'build/bower_components/angular-ui-router/release/angular-ui-router.js',
            'build/bower_components/angular-ui-sortable/sortable.js',
            'build/bower_components/angular-borderlayout/src/borderLayout.js',
            'build/bower_components/angular-hotkeys/build/hotkeys.js',
            'build/bower_components/stompjs/lib/stomp.js',
            //'build/bower_components/timely/timely.js',
            'build/bower_components/lodash/lodash.js',
            'build/bower_components/c3/c3.js',
            'build/bower_components/d3/d3.js',
            'build/mms.js',
            'build/mms.directives.js',
            'build/mms.directives.tpls.js',
            'app/js/**/*.js',
            'app/lib/**/*.js',
            'app/partials/**/*.html',
            'test/develop/unit/**/*.js'
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

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

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],
        plugins : ['karma-chrome-launcher', 'karma-jasmine'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    });
};
