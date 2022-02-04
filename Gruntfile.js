module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('jit-grunt')(grunt, {
    // static mapping for tasks that don't match their modules' name
    useminPrepare: 'grunt-usemin',
    configureProxies: 'grunt-connect-proxy-updated'
  });
  // Project configuration.
  var env = grunt.option('env') || 'example';

  var jsFiles = ['app/js/**/*.js', 'src/directives/**/*.js', 'src/services/*.js'];

  var connectObject = {
    docs: {
      options: {
        hostname: '*',
        port: 10000,
        base: './dist/docs'
      }
    }
  };

  //if (grunt.file.exists('angular-mms-grunt-servers.json')) {
  //var server = grunt.file.readJSON('angular-mms-grunt-servers.json');
  //ar serverPort = server.mms_port;
  //var serverHttps = true;
  var serveStatic = require('serve-static');
  var modRewrite = require('connect-modrewrite');
  connectObject["docker"] = {
    options: {
      hostname: '0.0.0.0',
      port: 9000,
      protocol: 'http',
      //open: true,
      //key: grunt.file.read('/run/secrets/server.key').toString(),
      //cert: grunt.file.read('/run/secrets/server.crt').toString(),
      debug: true,
      base: {
        path: './dist',
        options: {
          index: 'mms.html',
          // Add this so that the browser doesn't re-validate static resources
          // Also, we have cache-busting, so we don't have to worry about stale resources
          maxAge: 31536000000
        }
      },
      middleware: function(connect, options) {
        var middlewares;
        middlewares = [];
        if (!Array.isArray(options.base)) {
          options.base = [options.base];
        }
        middlewares.push(
            require('grunt-connect-proxy-updated/lib/utils').proxyRequest,
            // add gzip compression to local server to reduce static resources' size and improve load speed
            require('compression')()
            //require('connect-modrewrite')(['!\\.html|\\.js|\\.css|\\.svg|\\.jp(e?)g|\\.png|\\.gif$ /mms.html']),

            // need to add livereload as a middleware at this specific order to avoid issues with other middlewares
        );
        middlewares.push( modRewrite( ['^[^\\.]*$ /mms.html [L]'] ) );
        options.base.forEach(function(base) {
          // Serve static files.
          var path = base.path || base;
          var staticOptions = base.options || defaultStaticOptions;
          middlewares.push(serveStatic(path, staticOptions));
        });
        return middlewares;
      }
    }
  };
  //}

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
      'dist/js/ve-mms.min.js': [

        // mms module
        'src/mms.js',
        'src/services/*.js',
        'src/filters/*.js',

        // mms.directives module (need mms, mms.directives.tpls.js module )
        'dist/jsTemp/mms.directives.tpls.js',
        'src/mms.directives.js',
        'src/directives/**/*.js',

        // app module ( need app.tpls.js, mms, mms.directives module )
        'dist/jsTemp/app.tpls.js',
        'app/js/mms/app.js',
        'app/js/mms/controllers/*.js',
        'app/js/mms/directives/*.js',

        // config files
        'app/config/config.' + env + '.js'
      ]
    }
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concurrent: {
      devStep1: ['install', 'lint', 'clean:before'],
      devStep2: [['copy:all', 'processExternalDepsDevMode'], 'processAppStyleSheets', 'processAppJSInDev'],
      devStep3: ['copy:dev'],
      devStep4: ['clean:devAfter', 'cacheBust'],

      releaseStep1: ['install', 'lint', 'clean:before'],
      releaseStep2: [['copy:all', 'processExternalDeps'], 'processAppStyleSheets', 'processAppJSInProd' ],
      releaseStep3: ['clean:releaseAfter', 'cacheBust']
    },

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

    'bower-install-simple': {
      options: {
        color: true,
        cwd: './app', // where to look for bower.json
        directory: 'bower_components' // where to store these libs,
      },
      all: {}
    },

    copy: {
      all: {
        files: [

          // Entry html files
          {expand: true, cwd: 'app', src: ['mms.html', 'index.html'], dest: 'dist/'},

          // External deps
          {expand: true, cwd: 'app', src: ['bower.json', 'bower_components/**'], dest: 'dist/'},

          // Internal deps
          {expand: true, cwd: 'app/lib', src: '**', dest: 'dist/lib'},
          {expand: true, cwd: 'src/lib/', src: ['**', '!bootstrap-sass-3.3.7/**'], dest: 'dist/lib'},

          // Assets
          {expand: true, cwd: 'app/bower_components/font-awesome-bower/fonts', src: '**', dest: 'dist/fonts'},
          {expand: true, cwd: 'app/assets', src: ['*', '!styles'], dest: 'dist/assets'},
          {expand: true, cwd: 'src/assets', src: ['images/**'], dest: 'dist/assets'}
        ]
      },
      dev: {
        files: [
          {expand: true, cwd: 'dist/concat/js', src: ['vendor.min.js'], dest: 'dist/js'},
          {expand: true, cwd: 'dist/concat/js', src: ['vendor-internal.min.js'], dest: 'dist/js'}
        ]
      }
    },

    /** Looks at dist/bower.json & all bower_components's bower.json to determine the order at which to include external libs **/
    wiredep: {
      all: {
        options: {
          cwd: 'dist',
          directory: '',
          dependencies: true,
          devDependencies: false, // so that our final vendor bundle doesn't include devDep libs
          exclude: [],
          fileTypes: {},
          ignorePath: '',
          overrides: {}
        },
        src: ['dist/*.html']
      }
    },

    /** Work on top of wiredep to know which external libs to bundle.
     *  Delegate the concatenation and minification steps to other plugins **/
    useminPrepare: {
      options: {
        staging: 'dist'
      },
      html: 'dist/mms.html'
    },

    /** Inject the final bundle into the corresponding html files **/
    usemin: {
      html: ['dist/mms.html']
    },

    /** Transpile Sass to Css **/
    sass: {
      all: {
        files: {
          'dist/cssTemp/mms.css': 'src/assets/styles/mms-main.scss',
          'dist/cssTemp/ve-main.css': 'app/assets/styles/ve/ve-main.scss'
        }
      }
    },

    /** Concat + Minify CSS **/
    cssmin: {
      all: {
        files: {
          'dist/css/ve-mms.min.css': ['dist/cssTemp/mms.css', 'dist/cssTemp/ve-main.css']
        }
      }
    },

    /** This task is for turning all html files into angularjs modules which are included as dependencies
     * for a particular module specified in the module function below
     * **/
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
      // This task name need to match with taskName param above.
      directives: {
        src: ['src/directives/templates/*.html'],
        dest: 'dist/jsTemp/mms.directives.tpls.js'
      },
      app: {
        src: ['app/partials/mms/*.html'],
        dest: 'dist/jsTemp/app.tpls.js'
      }
    },

    // concat only (no minification )
    concat: {
      combineCustomJS: combineCustomJS
    },

    /** Concat + Minify JS files **/
    uglify: {
      generated: {
        options: {
          mangle: true
          // Uncomment below codes to get source map files for vendor codes if desired ( no need to enable this for during
          // development since vendor files are not minified for dev-build )
          // sourceMap: {
          //     includeSources: true
          // }
        }
      }
    },
    terser: {
      combineCustomJS: {
        options: {
          wrap: 'mms',
          mangle: true,
          sourceMap: true
        },
        files: {
          'dist/js/ve-mms.min.js': [

          // mms module
          'src/mms.js',
          'src/services/*.js',
          'src/filters/*.js',

          // mms.directives module (need mms, mms.directives.tpls.js module )
          'dist/jsTemp/mms.directives.tpls.js',
          'src/mms.directives.js',
          'src/directives/**/*.js',

          // app module ( need app.tpls.js, mms, mms.directives module )
          'dist/jsTemp/app.tpls.js',
          'app/js/mms/app.js',
          'app/js/mms/controllers/*.js',
          'app/js/mms/directives/*.js',

          // config files
          'app/config/config.' + env + '.js'
        ]
      }
    },

      // this target is for files handled by usemin task.
    },

    /** Add hashing to static resources' names so that the browser doesn't use the stale cached resources **/
    cacheBust: {
      all: {
        options: {
          assets: ['dist/css/*', 'dist/js/*'],
          deleteOriginals: false // set to false so that it doesn't affect sourcemapping
        },
        src: ['dist/*.html']
      }
    },

    jshint: {
      beforeconcat: jsFiles,
      options: {
        reporterOutput: '',
        evil: true, //allow eval for plot integration
        globalstrict: true,
        validthis: true,
        esversion: 6,
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
          eval: true,
          Set: true,
          FormData: true
        }
      }
    },

    ngdocs: {
      options: {
        dest: 'dist/docs',
        html5Mode: false,
        title: 'View Editor',
        startPage: '/api'
      },
      api: {
        src: ['src/**/*.js', 'app/js/**/*.js'],
        title: 'MMS/VE API'
      }
    },

    connect: connectObject,

    watch: {
      dev: {
        files: ['app/env.js', 'app/**/*', '!app/bower_components/**', 'src/**/*'],
        tasks: ['dev-build']
      },
      release: {
        files: ['app/env.js', 'app/**/*', '!app/bower_components/**', 'src/**/*'],
        tasks: ['release-build']
      },
      docs: {
        files: ['app/env.js', 'app/**/*', '!app/bower_components/**', 'src/**/*'],
        tasks: ['ngdocs']
      },
      options: {
        livereload: true
      }
    },

    karma: {
      unit:{
        configFile:'config/develop/karma.develop.conf.js'
      },
      continuous:{
        configFile:'config/develop/karma.develop.conf.js',
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
    }
  });

  grunt.registerTask('install', 'bower-install-simple');
  grunt.registerTask('lint', ['jshint']);
  grunt.registerTask('processAppStyleSheets', ['sass', 'cssmin']);
  grunt.registerTask('processAppJSInDev', ['html2js', 'concat:combineCustomJS']);
  grunt.registerTask('processAppJSInProd', ['html2js', 'terser:combineCustomJS']);
  grunt.registerTask('processExternalDeps', ['wiredep', 'useminPrepare', 'concat:generated', 'cssmin:generated', 'uglify:generated', 'usemin']);

  // for dev mode, we don't need to minify vendor files because it slows down the build process
  // but we still concat and minify our app codes so that our prod and dev builds are as similar as possible. That way,
  // we can catch issues that may arise during the concatenation and minification steps asap.
  grunt.registerTask('processExternalDepsDevMode', ['wiredep', 'useminPrepare', 'concat:generated', 'cssmin:generated', 'usemin']);


  grunt.registerTask('default', ['dev-build']);
  grunt.registerTask('dev-build', ['build:dev']);
  grunt.registerTask('release-build', ['build:release']);
  grunt.registerTask('build', function(buildType) {
    if ( buildType === 'release' ) {
      grunt.task.run(['concurrent:releaseStep1', 'concurrent:releaseStep2', 'concurrent:releaseStep3']);
    } else {
      grunt.task.run(['concurrent:devStep1', 'concurrent:devStep2', 'concurrent:devStep3', 'concurrent:devStep4']);
    }
  });
  grunt.registerTask('deploy', ['release-build', 'ngdocs']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('continuous', ['karma:continuous']);
  grunt.registerTask('e2e-test', ['protractor']);

  grunt.registerTask('release', function(arg1) {
    grunt.task.run('release-build');
    if (arguments.length !== 0)
      grunt.task.run('launch:release:' + arg1);
    else
      grunt.task.run('launch:release');
  });

  grunt.registerTask('server', function(arg1) {
    grunt.task.run('dev-build');
    if (arguments.length !== 0)
      grunt.task.run('launch:dev:' + arg1);
    else
      grunt.task.run('launch:dev');
  });

  grunt.registerTask('docs', function() {
    grunt.task.run('ngdocs');
    grunt.task.run('connect:docs');
    grunt.task.run('watch:docs');
  });

  grunt.registerTask('launch', function(build, arg1) {
    if (arg1) {
      grunt.log.writeln("Launching server with proxy");
      grunt.task.run('configureProxies:' + arg1, 'connect:' + arg1);
    } else {
      grunt.log.writeln("Launching server with proxy API");
      grunt.task.run('configureProxies:opencaeuat', 'connect:opencaeuat');
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
  });
};
