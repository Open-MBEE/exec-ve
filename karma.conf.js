module.exports = function(config){
    config.set({
        basePath : '.',

        files : [
          'build/bower_components/lodash/dist/lodash.js',
          'build/bower_components/angular/angular.js',
          'build/mms.js',
          'build/bower_components/angular-mocks/angular-mocks.js',
          'test/unit/**/*.js'
        ],

        exclude : [
        ],

        autoWatch : true,

        singleRun: true,

        reporters: ['junit'],

        frameworks: ['jasmine'],

        browsers : ['PhantomJS'],

        plugins : [
                'karma-junit-reporter',
                'karma-chrome-launcher',
                'karma-firefox-launcher',
                'karma-jasmine',
                'karma-phantomjs-launcher'
                ],

        junitReporter : {
          outputFile: 'test_out/unit.xml',
          suite: 'unit'
        }
    }
)}

