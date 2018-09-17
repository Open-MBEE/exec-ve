/**
 * This is the configuration file for converting MMS' directives and templates into distributable files.
 * **/
module.exports = function(grunt) {
    require('jit-grunt')(grunt);

    var combineCustomJS = {
        options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
                wrap: 'mms',
                mangle: true,
                sourceMap: {
                includeSources: true
            }
        },
        files: {
            'dist/mms.js': ['src/mms.js', 'src/services/*.js'],
            'dist/mms.directives.js': ['src/mms.directives.js', 'src/directives/**/*.js']
        }
  };

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /** This task is for turning all html files into angularjs modules which are included as dependencies
         * for a particular module specified in the module function below
         * **/
        html2js: {
            options: {
                // All the templates converted to angularjs modules will belong to the module with the name returned
                // by the following function
                module: function(modulePath, taskName) {
                    return 'mms.directives.tpls';
                },
                // Change the module name to the string returned by the following function
                rename: function (modulePath) {
                    var moduleName = modulePath.replace('directives/templates/', '');
                    return 'mms/templates/' + moduleName;
                }
            },
            directives: {
                src: ['src/directives/templates/*.html'],
                dest: 'dist/temp/js/mms.directives.tpls.js'
            }
        },

        // concat only (no minification )
        concat: {
            combineCustomJS: combineCustomJS
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
                mangle: true,
                sourceMap: {
                    includeSources: true
                }
            },

            mms: {
                options: {
                    wrap: 'mms'
                },
                files: {
                    'dist/mms.js': ['src/mms.js', 'src/services/*.js']
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
        },
        clean: ['dist/temp']
    });

    grunt.registerTask('default', ['html2js', 'concat', 'clean']);
};