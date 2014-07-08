module.exports = function(config){
    config.set({
    basePath : '../',

    files : [
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
      'build/js/ve/directives.js',
      'build/lib/angular/angular-loader.js',
      'build/lib/angular/*.min.js',
      'build/lib/angular/angular-scenario.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Firefox'],

    plugins : [
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

})}
