module.exports = function(config){
    config.set({
    basePath : '.',

    files : [
      'build/bower_components/lodash/dist/lodash.js',
      'build/bower_components/angular/angular.js',
      'build/bower_components/angular-borderlayout/src/borderLayout.js',
      'build/bower_components/angular-growl-v2/build/angular-growl.js',
      'build/bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js',
      'build/bower_components/angular-ui-router/release/angular-ui-router.js',
      'build/bower_components/angular-ui-sortable/sortable.js',
      'build/bower_components/angular-ui-tree/dist/angular-ui-tree.js',
      'build/mms.js',
      'build/mms.directives.js',
      'build/mms.directives.tpls.js',
      'test/lib/angular/angular-mocks.js',
      'build/js/docweb/controllers.js',
      'build/js/docweb/*.js',
      'src/services/*.js',
      'test/unit/**/*.js'
    ],

    exclude : [
      'test/unit/ServiceSpecs/*.js',
      'build/js/ve/directives.js',
      'build/lib/angular/angular-loader.js',
      'build/lib/angular/*.min.js',
      'build/lib/angular/angular-scenario.js'
    ],

    autoWatch : true,

    singleRun: false,

    reporters: ['dots'],

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

})}

/*
module.exports = function(config) {
    config.set({
        frameworks: ['jasmine'],
        browsers: ['PhantomJS'],
        files: [
            'build/bower_components/lodash/dist/lodash.js',
            'build/bower_components/angular/angular.js',
            'build/bower_components/angular-mocks/angular-mocks.js',
            'build/mms.js',
            'test/unit/servicesSpec.js'
        ],
        plugins: [
            'karma-jasmine',
            'karma-firefox-launcher',
            'karma-phantomjs-launcher'
        ]
    })
}
*/
