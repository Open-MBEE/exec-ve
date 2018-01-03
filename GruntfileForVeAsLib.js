/**
 * This is the configuration file for converting MMS' directives and templates into distributable files.
 * **/
module.exports = function(grunt) {
    require('jit-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /** This task is for turning all html files into angularjs modules which are included as dependencies
         * for a particular module specified in the module function below
         * **/
        html2js: {
            options: {
                module: function(modulePath, taskName) {
                    return 'mms.directives.tpls';
                },
                rename: function (modulePath) {
                    var moduleName = modulePath.replace('directives/templates/', '');
                    return 'mms/templates/' + moduleName;
                    // if (modulePath.indexOf('directives/templates') > -1) {
                    //     var moduleName = modulePath.replace('directives/templates/', '');
                    //     return 'mms/templates/' + moduleName;
                    // }
                    // return modulePath.replace('app/', '').replace('../', '');
                }
            },
            // This task name need to match with taskName param above.
            directives: {
                src: ['src/directives/templates/*.html'],
                dest: 'dist/temp/js/mms.directives.tpls.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
                mangle: true,
                sourceMap: {
                    includeSources: true
                }
            },

            mmsdirs: {
                options: {
                    wrap: 'mmsdirs'
                },
                files: {
                    'dist/mms.directives.min.js': [
                        'src/mms.directives.js',
                        'src/directives/**/*.js'
                    ],

                    'dist/mms.directives.tpls.min.js': [
                        'dist/temp/js/mms.directives.tpls.js'
                    ]
                }
            }
        }
    });

    grunt.registerTask('default', ['html2js', 'uglify']);
};