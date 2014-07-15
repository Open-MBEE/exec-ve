var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

module.exports = function(grunt) {

  var jsFiles = ['app/js/**/*.js', 'src/**/*.js'];

  // Project configuration.
  grunt.initConfig({
    
    pkg: grunt.file.readJSON('package.json'),

    bower: {
      install: {
        options: {
          targetDir: 'bower_components_target',
          overrideBowerDirectory: false,
          cwd: 'app',
          layout: 'byComponent',
          install: true,
          verbose: false,
          cleanTargetDir: false,
          cleanBowerDir: false,
          bowerOptions: {},
          copy: true,
          forcedCopyDir: 'app'
        }
      }
    },
    
    bowerInstall: {

      target: {
        src: [
          'build/*.html'
        ],

        // Optional:
        // ---------
        cwd: 'build',
        directory:'',
        dependencies: true,
        devDependencies: false,
        exclude: [],
        fileTypes: {},
        ignorePath: '',
        overrides: {}
      }
    },

    html2js: {
      options: {
        module: 'mms.directives.tpls',
        rename: function(modulePath) {
          var moduleName = modulePath.replace('directives/templates/', '');
          return 'mms/templates/' + moduleName;
        }
      },
      main: {
        src: ['src/directives/templates/*.html'],
        dest: 'dist/mms.directives.tpls.js'
      }
    },

    concat: {
      options: {
        //separator: ';',
        banner: "'use strict';\n",
        process: function(src, filepath) {
          return '// Source: ' + filepath + '\n' +
            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        }
      },
      mms: {
        src: ['src/mms.js', 'src/services/*.js'],
        dest: 'dist/mms.js'
      },
      mmsdirs: {
        src: ['src/mms.directives.js', 'src/directives/*.js'],
        dest: 'dist/mms.directives.js'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
        mangle: true,
        wrap: 'mms'
      },
      mms: {
        options: {
          wrap: 'mms'
        },
        files: {'dist/mms.min.js': ['dist/mms.js']}
      },
      mmsdirs: {
        options: {
          wrap: 'mmsdirs'
        },
        files: {'dist/mms.directives.min.js': ['dist/mms.directives.js']}
      }
    },

    sass: {
      dist : {
        files: {
          'dist/css/mmsMain.css': 'src/directives/templates/styles/mmsMain.scss'
        }
      },
      dist2 : {
        files: [{
          expand: true,
          cwd: 'app/styles',
          src: ['*.scss', '*.css'],
          dest: 'dist/css/',
          ext: '.css'
        }]
      }
    },

    cssmin: {
      minify: {
        expand: true,
        cwd: 'dist/css',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/css/',
        ext: '.min.css'
      },
      combine: {
        files: {
          'dist/mms.min.css': ['dist/css/*.css']
        }
      }
    },

    jshint : {
      beforeconcat: jsFiles,
      afterconcat: ['dist/mms.js', 'dist/mms.directives.js'],
      options: {
        globalstrict: true,
        globals: {
          angular: true,
          window: true,
          console: true
        }
      }
    },

    ngdocs: {
      options: {
        dest: 'docs',
        html5Mode: false,
        title: 'MMS',
        startPage: '/api'
      },
      api: {
        src: ['src/**/*.js'],
        title: 'MMS API'
      }
    },

    stubby: {
      stubsServer: {
        // note the array collection instead of an object
        options: {
          stubs: 9002,
          //callback: function (server, options) {
          //server.get(1, function (err, endpoint) {
          //     console.log(endpoint);
          //  });
          //},
        },
        files: [{
          src: [ 'mocks/*.{json,yaml,js}' ]
        }]
      }
    },

    connect: {
      'static': {
        options: {
          hostname: 'localhost',
          port: 9001,
          base: './build',
        }
      },
      docs: {
        options: {
          hostname: 'localhost',
          port: 10000,
          base: './docs',
        }
      },
      //restServer: {
      //  options: {
      //      hostname: 'localhost',
      //      port: 9002,
      //      base: './rest',
      //    },
      //},
      mockServer: {
        options: {
          hostname: 'localhost',
          port: 9000,
          middleware: function(connect) {
            return [proxySnippet];
          }
        },
        proxies: [
          {
            context: '/alfresco/service/javawebscripts',  // '/api'
            host: 'localhost',
            port: 9002,
            changeOrigin: true,
            //https: true,
            rewrite: {
              '^/alfresco/service/javawebscripts': ''
            }
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      a: {
        options: {
          hostname: '*',
          port: 9000,
          middleware: function(connect) {
            return [proxySnippet];
          }
        },
        proxies: [
          {
            // /alfresco/service/javawebscripts
            // https://sheldon.jpl.nasa.gov/alfresco/wcs/javawebscripts/element/_17_0_2_3_407019f_1386871336920_707205_26285
            context: '/alfresco',  // '/api'
            host: 'europaems-dev-staging-a.jpl.nasa.gov',//128.149.16.155',
            port: 443,
            changeOrigin: true,
            https: true,
            //rewrite: {
            //  '^/api': '/alfresco/service/javawebscripts'
            //}
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      b: {
        options: {
          hostname: '*',
          port: 9000,
          middleware: function(connect) {
            return [proxySnippet];
          }
        },
        proxies: [
          {
            // /alfresco/service/javawebscripts
            // https://sheldon.jpl.nasa.gov/alfresco/wcs/javawebscripts/element/_17_0_2_3_407019f_1386871336920_707205_26285
            context: '/alfresco',  // '/api'
            host: 'europaems-dev-staging-b.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
            //rewrite: {
            //  '^/api': '/alfresco/service/javawebscripts'
            //}
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      }, 
      js: {
        options: {
          hostname: '*',
          port: 9000,
          middleware: function(connect) {
            return [proxySnippet];
          }
        },
        proxies: [
          {
            // /alfresco/service/javawebscripts
            // https://sheldon.jpl.nasa.gov/alfresco/wcs/javawebscripts/element/_17_0_2_3_407019f_1386871336920_707205_26285
            context: '/alfresco',  // '/api'
            host: 'ems.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
            //rewrite: {
            //  '^/api': '/alfresco/service/javawebscripts'
            //}
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]

      }
    },

    watch: {
      dev: {
        files: ['app/**/*', '!app/bower_components/**', 'src/**/*'],
        tasks: ['dev-build']
      },
      release: {
        files: ['app/**/*', '!app/bower_components/**', 'src/**/*'],
        tasks: ['release-build']
      },
      docs: {
        files: ['app/**/*', '!app/bower_components/**', 'src/**/*'],
        tasks: ['docs-build']
      },
    },

    qunit: {
      all: ['build/qtest/*.html']
    },

    clean: ["build", "dist", "docs"],

    copy: {
      main: {
        files:[
          //{src: ['pages/**/*.html'], dest: 'build/', expand: true, flatten:true},
          {expand: true, src: '**', cwd: 'dist', dest: 'build/'},
          //{src: ['vendor/**'], dest: 'build/'},
          //{src: ['qtest/**'], dest: 'build/'},
          {expand: true, src: '**', cwd: 'app', dest: 'build/'},
        ]
      }
    },
    // Post to staging on sheldon
    // https://sheldon/alfresco/scripts/vieweditor2/index.html
    rsync: {
      deploy: {
        files: 'build/',
        options: {
          host      : "sheldon",
          //port      : "1023",
          //user      : "menzies",
          //preservePermissions : false,
          additionalOptions : "--chmod=a=rwx,g=rw,o=rx",
          remoteBase: "/opt/local/alfresco-4.2.c/tomcat/webapps/alfresco/scripts/vieweditor2" //"~/vieweditor2"
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-rsync-2');
  grunt.loadNpmTasks('grunt-connect-proxy');
  grunt.loadNpmTasks('grunt-stubby');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-bower-install');
  grunt.loadNpmTasks('grunt-bower-installer');
  grunt.loadNpmTasks('grunt-npm-install');

  // grunt.registerTask('install', ['npm-install', 'bower']);
  grunt.registerTask('install', ['bower']);
  grunt.registerTask('compile', ['html2js', 'sass']);
  grunt.registerTask('lint',    ['jshint:beforeconcat']);
  grunt.registerTask('minify',  ['cssmin', 'uglify']);
  grunt.registerTask('wire',    ['bowerInstall']);

  grunt.registerTask('dev-build',     ['install', 'compile', 'lint', 'concat', 'minify', 'copy', 'wire']);
  grunt.registerTask('release-build', ['install', 'compile', 'lint', 'concat', 'minify', 'copy', 'wire']);
  grunt.registerTask('docs-build',    ['ngdocs']);
  grunt.registerTask('default', ['dev-build']);

  grunt.registerTask('dev', function(arg1) {
      grunt.task.run('dev-build', 'connect:static');
      if (arguments.length !== 0)
        grunt.task.run('launch:dev:' + arg1);
      else
        grunt.task.run('launch:dev');
    }
  );

  grunt.registerTask('release', function(arg1) {
      grunt.task.run('release-build', 'connect:static');
      if (arguments.length !== 0)
        grunt.task.run('launch:release:' + arg1);
      else
        grunt.task.run('launch:release');
    }
  );

  grunt.registerTask('server', function(arg1) {
      if (arguments.length !== 0)
        grunt.task.run('dev:' + arg1);
      else
        grunt.task.run('dev');
    }
  );

  grunt.registerTask('docs', function() {
      grunt.task.run('ngdocs');
      grunt.task.run('connect:docs');
      grunt.task.run('watch:docs');
    }
  );

  grunt.registerTask('launch', function(build, arg1) {
      if (arg1) {
        grunt.log.writeln("Launching server with mock REST API");
        //grunt.task.run('connect:restServer', 'configureProxies:mockServer', 'connect:mockServer');
        grunt.task.run('stubby', 'configureProxies:' + arg1, 'connect:' + arg1);
      } else {
        grunt.log.writeln("Launching server with proxy API");
        grunt.task.run('configureProxies:b', 'connect:b');
      }
      grunt.task.run('watch:' + build);
    }
  );
};
