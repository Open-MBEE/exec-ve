var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

module.exports = function(grunt) {

  var jsFiles = ['app/js/**/*.js', 'src/directives/**/*.js', 'src/services/*.js'];

  var artifactoryUrl = grunt.option('ARTIFACTORY_URL');
  var artifactoryUser = grunt.option('ARTIFACTORY_USER');
  var artifactoryPassword = grunt.option('ARTIFACTORY_PASSWORD');
  var connectObject = {
    'static': {
      options: {
        hostname: 'localhost',
        port: 9001,
        base: './dist'
      }
    },
    docs: {
      options: {
        hostname: 'localhost',
        port: 10000,
        base: './dist/docs'
      }
    }
  };

  if (grunt.file.exists('angular-mms-grunt-servers.json')) {
    var servers = grunt.file.readJSON('angular-mms-grunt-servers.json');

    // Set proxie info for server list
    for (var key in servers) {
      var serverPort = 443;
      var serverHttps = true;
      if (key === "localhost") {
        serverPort = 8080;
        serverHttps = false;
      }
      connectObject[key] = {
          options: {
            hostname: '*',
            port: 9000,
            open: true,
            base: '/mms.html',
            livereload: true,
            middleware: function(connect) {
              return [proxySnippet];
            }
          },
          proxies: [
            {
              context: '/alfresco',  // '/api'
              host: servers[key],
              changeOrigin: true,
              https: serverHttps,
              port: serverPort
            },
            {
              context: '/',
              host: 'localhost',
              port: 9001
            }
          ]
      };
    }
  }

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    clean: {
      before: {
        src: ['dist']
      },
      releaseAfter: {
        src: ['dist/bower_components', 'dist/concat', 'dist/cssTemp', 'dist/jsTemp']
      },
      devAfter: {
        src: ['dist/concat', 'dist/cssTemp', 'dist/jsTemp']
      }
    },

    /** Install bower dependencies **/
    'bower-install-simple': {
      options: {
        color: true,
        cwd: './app', // where to look for bower.json
        directory: 'bower_components' // where to save,
      },
      release: {
        options: {
          production: true
        }
      },
      dev: {
        options: {
          production: false
        }
      }
    },

    /** Move files around **/
    copy: {
      all: {
        files: [

          // Entry html files
          {expand: true, cwd: 'app', src: ['mms.html', 'index.html'], dest: 'dist/'},

          // External deps
          {expand: true, cwd: 'app', src: ['bower.json', 'bower_components/**'], dest: 'dist/'},

          // Internal deps
          {expand: true, cwd: 'app/lib', src: '**', dest: 'dist/lib'},
          {expand: true, cwd: 'src/lib/', src: '**', dest: 'dist/lib'},

          // Assets
          {expand: true, cwd: 'app/bower_components/font-awesome-bower/fonts', src: '**', dest: 'dist/fonts'},
          {expand: true, cwd: 'app/assets', src: ['*', '!styles'], dest: 'dist/assets'},
          {expand: true, cwd: 'src/assets', src: ['images/**'], dest: 'dist/assets'}
        ]
      },
      dev: {
        // move file from to the right folder
        files: [
          {expand: true, cwd: 'dist/concat/js', src: ['vendor.min.js'], dest: 'dist/js'}
        ]
      }
    },

    /** wiredep will look at dist/bower.json & all bower_components 's bower.json to determine what to add first **/
    wiredep: {
      all: {
        options: {
          cwd: 'dist',
          directory: '',
          dependencies: true,
          devDependencies: false,
          exclude: [],
          fileTypes: {},
          ignorePath: '',
          overrides: {}
        },
        src: ['dist/*.html']
      }
    },

    /** concat and minify external libs css and js. I guess we can also add custom js and css to it, but maybe not coz we want to separate them
     * for caching purpose ( dont want to bust vendor cache all the times ) **/
    useminPrepare: {
      options: {
        staging: 'dist'
      },
      html: 'dist/mms.html'
    },
    usemin: {
      html: ['dist/mms.html']
    },

    sass: {
      all: {
        files: {
          'dist/cssTemp/mms.css': 'src/assets/styles/mms-main.scss',
          'dist/cssTemp/ve-main.css': 'app/assets/styles/ve/ve-main.scss'
        }
      }
    },

    cssmin: {
      // Combine + Minify
      all: {
        files: {
          'dist/css/ve-mms.min.css': ['dist/cssTemp/mms.css', 'dist/cssTemp/ve-main.css']
        }
      }
    },

    /** Transpile html into angularJs modules **/
    html2js: {
      options: {
        module: function(modulePath, taskName) {
          if (taskName === 'directives')
            return 'mms.directives.tpls';
          return 'app.tpls';
        },
        rename: function (modulePath) {
          if (modulePath.indexOf('directives/templates') > -1) {
            var moduleName = modulePath.replace('directives/templates/', '');
            return 'mms/templates/' + moduleName;
          }
          return modulePath.replace('app/', '').replace('../', '');
        }
      },
      // This need name to match with taskName above.
      // Turn all html into angular moodule, then add it as deps to mms.directives.tpls module specify above
      directives: {
        src: ['src/directives/templates/*.html'],
        dest: 'dist/jsTemp/mms.directives.tpls.js'
      },
      app: {
        src: ['app/partials/mms/*.html'],
        dest: 'dist/jsTemp/app.tpls.js'
      }
    },

    /** Concat and Minify files **/
    uglify: {
      combineCustomJS: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
          wrap: 'mms',
          // TODO:HONG need to set mangle to false. Otherwise, issue with angular injector
          // TODO:HONG if update to newer version, need to change the syntax below
          mangle: false,
          sourceMap: true,
          sourceMapIncludeSources: true
        },
        files: {
          'dist/js/ve-mms.min.js': [
            // mms module
            'src/mms.js',
            'src/services/*.js',

            // mms.directives module (need mms, mms.directives.tpls.js module )
            'dist/jsTemp/mms.directives.tpls.js',
            'src/mms.directives.js',
            'src/directives/**/*.js',

            // app module ( need app.tpls.js, mms, mms.directives module )
            'dist/jsTemp/app.tpls.js',
            'app/js/mms/app.js',
            'app/js/mms/controllers/*.js',
            'app/js/mms/directives/*.js'
          ]
        }
      },

      generated: {
        options: {
          mangle: true
        }
      }
    },

    cacheBust: {
      all: {
        files: {
          src: ['dist/*.html']
        }
      }
    },

    jshint: {
      beforeconcat: jsFiles,
      afterconcat: ['dist/js/ve-mms-min.js'],
      options: {
        reporterOutput: '',
        // evil: true, //allow eval for timely integration
        globalstrict: true,
        globals: {
          angular: true,
          window: true,
          console: true,
          Stomp: true,
          Timely: true,
          jQuery: true,
          $: true,
          //__timely: true,
          Blob: true,
          navigator: true,
          eval: false,
          Set: true
        }
      }
    },

    ngdocs: {
      options: {
        dest: 'dist/docs',
        html5Mode: false,
        title: 'MMS',
        startPage: '/api'
      },
      api: {
        src: ['src/**/*.js'],
        title: 'MMS API'
      }
    },

    connect: connectObject,

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
        tasks: ['ngdocs']
      },
      options: {
        livereload: true
      }
    },

    artifactory: {
      options: {
        url: artifactoryUrl,
        repository: 'libs-snapshot-local',
        username: artifactoryUser,
        password: artifactoryPassword
      },
      client: {
        files: [{
          src: ['dist/**/*']
        }],
        options: {
          publish: [{
            id: 'gov.nasa.jpl:evm:zip',
            version: '3.2.1-SNAPSHOT',
            path: 'deploy/'
          }]
        }
      }
    },
    
    karma: {
        unit:{
            configFile:'config/develop/karma.develop.conf.js',
            // frameworks: ['jasmine']
        },
        continuous:{
          configFile:'config/develop/karma.develop.conf.js',
          singleRun: true,
          browsers: ['PhantomJS'],
          logLevel: 'ERROR'
        }
    },

    protractor: {
      options: {
        keepAlive: true, // If false, the grunt process stops when the test fails.
        noColor: false // If true, protractor will not use colors in its output.
      },
      develop: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
        options: {
          configFile: "config/develop/protractor.develop.conf.js" // Target-specific config file
        }
      },
      suite:{
        all:{},
        options: {
          configFile: "config/master/protractor.master.conf.js" // Target-specific config file
        }
      }
    },

    sloc: {
      options: {
        // Task-specific options go here.
      },
      'all-files': {
        files: {
          // Target-specific file lists and/or options go here.
          'app/js': [ '**.js'],
          'app': [ '*.html', 'partials/**', 'assets/styles/**'],
          'src/directives': [ '**.js', '**.html'],
          'src/assets/styles': [ 'base/**', 'components/**', 'layout/**'],
          'src/services': [ '**']
        }
      },
      'mms-app': {
        files: {
          'app/js': [ '**.js'],
          'app': [ '*.html', 'partials/**', 'assets/styles/**']
        }
      },
      'mms-directives': {
        files: {
          'src/directives': [ '**.js', '**.html'],
          'src/assets/styles': [ 'base/**', 'components/**', 'layout/**']
        }
      },
      'mms-services': {
        files: {
          'src/services': ['**']
        }
      }
    }
  });

  // inject all deps that start with grunt-*
  require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.registerTask('lint', ['jshint:beforeconcat']);
  grunt.registerTask('processAppStyleSheets', ['sass', 'cssmin']);
  grunt.registerTask('processAppJS', ['html2js', 'uglify:combineCustomJS']);
  grunt.registerTask('processExternalDeps', ['useminPrepare', 'concat:generated', 'cssmin:generated', 'uglify:generated', 'usemin']);
  grunt.registerTask('processExternalDepsDevMode', ['useminPrepare', 'concat:generated', 'cssmin:generated', 'usemin']);

  grunt.registerTask('release-build', ['lint', 'clean:before', 'processAppStyleSheets', 'processAppJS',
    'bower-install-simple:release', 'copy:all', 'wiredep', 'processExternalDeps', 'clean:releaseAfter', "cacheBust"
  ]);

  grunt.registerTask('dev-build', ['lint', 'clean:before', 'processAppStyleSheets', 'processAppJS',
    'bower-install-simple:dev', 'copy:all', 'wiredep', 'processExternalDepsDevMode', 'copy:dev', 'clean:devAfter', "cacheBust"
  ]);

  grunt.registerTask('default', ['dev-build']);
  grunt.registerTask('deploy', ['release-build', 'ngdocs', 'artifactory:client:publish']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('continuous', ['karma:continuous']);
  grunt.registerTask('e2e-test', ['protractor']);

  grunt.registerTask('dev', function(arg1) {
      grunt.task.run('dev-build', 'connect:static');
      if (arguments.length !== 0)
        grunt.task.run('launch:dev:' + arg1);
      else
        grunt.task.run('launch:dev');
  });

  grunt.registerTask('release', function(arg1) {
      grunt.task.run('release-build', 'connect:static');
      if (arguments.length !== 0)
        grunt.task.run('launch:release:' + arg1);
      else
        grunt.task.run('launch:release');
  });

  grunt.registerTask('server', function(arg1) {
      if (arguments.length !== 0)
        grunt.task.run('dev:' + arg1);
      else
        grunt.task.run('dev');
  });

  grunt.registerTask('docs', function() {
      grunt.task.run('ngdocs');
      grunt.task.run('connect:docs');
      grunt.task.run('watch:docs');
  });

  grunt.registerTask('launch', function(build, arg1) {
      if (arg1) {
        grunt.log.writeln("Launching server with proxy");
        //grunt.task.run('connect:restServer', 'configureProxies:mockServer', 'connect:mockServer');
        grunt.task.run('configureProxies:' + arg1, 'connect:' + arg1);
      } else {
        grunt.log.writeln("Launching server with proxy API");
        grunt.task.run('configureProxies:emsstg', 'connect:emsstg');
      }
      grunt.task.run('watch:' + build);
  });

  grunt.registerTask('debug', function () {
      grunt.log.writeln("Launching Karma");
      grunt.task.run('test');
  });

  grunt.registerTask('e2e',function(arg1) {
    grunt.log.writeln("Launching Protractor");
    grunt.task.run('e2e-test');
  })
};
