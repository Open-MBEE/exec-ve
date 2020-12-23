module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks automatically and only necessary ones.
    // Those that doesn't match the pattern have to be provided here.
    require('jit-grunt')(grunt);

    function mountFolder(connect, dir) {
        return connect.static(require('path').resolve(dir));
    }

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        defs: {
            options: {
                defsOptions: {
                    disallowDuplicated: true,
                    disallowUnknownReferences: false,
                    disallowVars: true,
                },
            },
            src: {
                expand: true,
                extDot: 'last',
                ext: '.defs.js',
                src: [
                    'src/<%= pkg.name %>.js',
                ],
            },
            test: {
                expand: true,
                extDot: 'last',
                ext: '.defs.js',
                src: [
                    'test/unit/spec/<%= pkg.name %>.spec.js',
                    '!test/unit/spec/<%= pkg.name %>.spec.defs.js',
                ],
            },
        },
        ngAnnotate: {
            demo: {
                files: {
                    '.tmp/<%= pkg.name %>.js': ['src/<%= pkg.name %>.defs.js'],
                },
            },
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %>, <%= grunt.template.today("dd-mm-yyyy") %> */\n',
            },
            build: {
                src: '.tmp/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js',
            },
        },
        copy: {
            demo: {
                src: 'dist/<%= pkg.name %>.min.js',
                dest: 'demo/',
            },
            dev: {
                src: '.tmp/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.js',
            },
        },
        clean: {
            defs: '**/*.defs.js',
            tmp: '.tmp',
        },
        connect: {
            options: {
                port: 9000,
                livereload: 35729,
                hostname: '0.0.0.0',
                open: true,
            },
            demo: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, 'demo'),
                        ];
                    },
                },
            },
        },
        watch: {
            livereload: {
                files: [
                    'src/<%= pkg.name %>.js',
                    'demo/*.js',
                    'demo/*.css',
                    'demo/*.html',
                    '!demo/bower_components/**/*',
                ],
                options: {
                    livereload: true,
                },
                tasks: ['build'],
            },
        },
        jshint: {
            options: {
                jshintrc: true,
            },
            all: {
                src: [
                    'Gruntfile.js',
                    'src/<%= pkg.name %>.js',
                ],
            },
        },
        jscs: {
            all: {
                src: [
                    'Gruntfile.js',
                    'src/<%= pkg.name %>.js',
                    'test/unit/spec/<%= pkg.name %>.spec.js',
                ],
                options: {
                    config: '.jscs.json',
                },
            },
        },
        'merge-conflict': {
            files: '<%= jshint.all.src %>',
        },
        karma: {
            options: {
                configFile: 'test/unit/config/karma.conf.js',
            },
            unit: {},
            live: {
                port: 8081,
                singleRun: false,
                background: true,
            },
        },
        'gh-pages': {
            options: {
                base: 'demo',
            },
            src: ['**'],
        },
    });


    grunt.registerTask('lint', [
        'jshint',
        'jscs',
        'merge-conflict',
    ]);

    grunt.registerTask('build', [
        'clean',
        'lint',
        'defs',
        'ngAnnotate',
        'copy:dev',
        'uglify',
        'copy:demo',
        'clean:tmp',
    ]);

    grunt.registerTask('demo', [
        'build',
        'connect:demo',
        'watch',
    ]);

    grunt.registerTask('serve', [
        'build',
        'watch',
    ]);

    grunt.registerTask('test', [
        'clean',
        'lint',
        'defs',
        'karma:unit',
    ]);

    grunt.registerTask('default', [
        'serve',
    ]);
};
