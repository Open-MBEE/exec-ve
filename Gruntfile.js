var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

module.exports = function(grunt) {

  var jsFiles = ['app/js/**/*.js', 'src/**/*.js'];

  var artifactoryUrl = grunt.option('ARTIFACTORY_URL');
  var artifactoryUser = grunt.option('ARTIFACTORY_USER');
  var artifactoryPassword = grunt.option('ARTIFACTORY_PASSWORD');
  var servers = grunt.file.readJSON('angular-mms-grunt-servers.json');
  var connectObject = {
    'static': {
      options: {
        hostname: 'localhost',
        port: 9001,
        base: './build'
      }
    },
    docs: {
        options: {
          hostname: 'localhost',
          port: 10000,
          base: './build/docs',
        }
    }};
  for (var key in servers) {
    var serverPort = 443;
    var serverHttps = true;
    if (key == "localhost") {
       serverPort = 8080;
       serverHttps = false;
    }
    connectObject[key] = {
        options: {
          hostname: '*',
          port: 9000,
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

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    'bower-install-simple': {
      options: {
        color: true,
        cwd: './app',
        directory: 'bower_components'
      },
      prod: {
        options: {
          production: true
        }
      }
    },

    cacheBust: {
      assets: {
        files: {
          src: ['build/mms.html', 'build/mmsFullDoc.html']
        }
      }
    },

    wiredep: {

      target: {
        src: [
          'build/*.html'
        ],
        options: {
          cwd: 'build',
          directory:'',
          dependencies: true,
          devDependencies: false,
          exclude: [],
          fileTypes: {},
          ignorePath: '',
          overrides: {}
        }
      }
    },

    html2js: {
      options: {
        module: function(modulePath, taskName) {
          if (taskName === 'directives')
            return 'mms.directives.tpls';
          return 'app.tpls';
        },
        //module: 'mms.directives.tpls',
        rename: function(modulePath) {
          if (modulePath.indexOf('directives/templates') > -1) {
            var moduleName = modulePath.replace('directives/templates/', '');
            return 'mms/templates/' + moduleName;
          }
          return modulePath.replace('app/', '').replace('../', '');
        }
      },
      directives: {
        src: ['src/directives/templates/*.html'],
        dest: 'dist/mms.directives.tpls.js'
      },
      main: {
        src: ['app/partials/mms/*.html'],
        dest: 'build/js/mms/app.tpls.js'
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
        src: ['src/mms.directives.js', 'src/directives/**/*.js'],
        dest: 'dist/mms.directives.js'
      },
      mmsapp: {
        src: ['app/js/mms/controllers/*.js'],
        dest: 'build/js/mms/controllers.js'
      },
      mmsappdir: {
          src: ['app/js/mms/directives/*.js'],
          dest: 'build/js/mms/directives.js'
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
        files: {
          'dist/mms.directives.min.js': ['dist/mms.directives.js'],
          'dist/mms.directives.tpls.min.js': ['dist/mms.directives.tpls.js']
        }
      }
    },

    sass: {
      dist : {
        files: {
          'dist/css/partials/mms.css': 'src/directives/templates/styles/mms-main.scss',
          //'dist/css/partials/mm-main.css': 'app/styles/mm/mm-main.scss',
          'dist/css/partials/ve-main.css': 'app/styles/ve/ve-main.scss'
        }
      }
    },

    cssmin: {
      minify: {
        expand: true,
        cwd: 'dist/css/partials',
        src: ['*.css', '!*.min.css'],
        dest: 'dist/css/partials',
        ext: '.min.css'
      },
      combine: {
        files: {
          //'dist/css/mm-mms.styles.min.css':
            //['dist/css/partials/mms.min.css', 'dist/css/partials/mm-main.min.css'],
          'dist/css/ve-mms.styles.min.css':
            ['dist/css/partials/mms.min.css', 'dist/css/partials/ve-main.min.css']
        }
      }
    },

    jshint : {
      beforeconcat: jsFiles,
      afterconcat: ['dist/mms.js', 'dist/mms.directives.js'],
      options: {
        reporterOutput: '',
        evil: true, //allow eval for timely integration
        globalstrict: true,
        globals: {
          angular: true,
          window: true,
          console: true,
          Stomp:true,
          Timely: true,
          jQuery: true,
          $: true,
          //__timely: true,
          Blob: true,
          navigator: true
        }
      }
    },

    ngdocs: {
      options: {
        dest: 'build/docs',
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
        tasks: ['docs-build']
      },
    },

    clean: ["app/bower_components", "build", "dist", "docs"],

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

    artifactory: {
      options: {
        url: artifactoryUrl,
        repository: 'libs-release-local',
        username: artifactoryUser,
        password: artifactoryPassword
      },
      client: {
        files: [{
          src: ['build/**/*']
        }],
        options: {
          publish: [{
            id: 'gov.nasa.jpl:evm:zip',
            version: '3.0.0-rc2',
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
        noColor: false, // If true, protractor will not use colors in its output.
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
          'app': [ '*.html', 'partials/**', 'styles/**'],
          'src/directives': [ '**.js', '**.html'],
          'src/directives/templates/styles': [ 'base/**', 'components/**', 'layout/**'],
          'src/services': [ '**']
        },
      },
      'mms-app': {
        files: {
          'app/js': [ '**.js'],
          'app': [ '*.html', 'partials/**', 'styles/**'],
        },
      },
      'mms-directives': {
        files: {
          'src/directives': [ '**.js', '**.html'],
          'src/directives/templates/styles': [ 'base/**', 'components/**', 'layout/**']
        },
      },
      'mms-services': {
        files: {
          'src/services': [ '**']
        },
      },
    },

   plato: {
      options: {
        // Task-specific options go here.
      },
      your_target: {
        // Target-specific file lists and/or options go here.
        files: {
          'reports/plato': [ 'app/js/**/*.js', 'src/directives/**/*.js', 'src/directives/**/*.js','src/services/**/*.js' ],
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-connect-proxy');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-bower-install-simple');
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-protractor-runner');
  grunt.loadNpmTasks('grunt-artifactory-artifact');
  grunt.loadNpmTasks('grunt-sloc');
  grunt.loadNpmTasks('grunt-plato');
  grunt.loadNpmTasks('grunt-cache-bust');

  // grunt.registerTask('install', ['npm-install', 'bower']);
  grunt.registerTask('install', ['bower-install-simple']);
  grunt.registerTask('compile', ['html2js', 'sass']);
  grunt.registerTask('lint',    ['jshint:beforeconcat']);
  grunt.registerTask('minify',  ['cssmin', 'uglify']);
  grunt.registerTask('wire',    ['wiredep']);

  grunt.registerTask('dev-build',     ['install', 'compile', 'lint', 'concat', 'minify', 'copy', 'wire', 'cacheBust']);
  grunt.registerTask('release-build', ['install', 'compile', 'lint', 'concat', 'minify', 'copy', 'wire', 'cacheBust']);
  grunt.registerTask('docs-build',    ['ngdocs']);
  grunt.registerTask('default', ['dev-build']);
  grunt.registerTask('deploy', ['dev-build', 'ngdocs', 'artifactory:client:publish']);
  grunt.registerTask('test', ['karma:unit']);
  grunt.registerTask('continuous', ['karma:continuous']);
  grunt.registerTask('e2e-test', ['protractor']);

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
        grunt.log.writeln("Launching server with proxy");
        //grunt.task.run('connect:restServer', 'configureProxies:mockServer', 'connect:mockServer');
        grunt.task.run('configureProxies:' + arg1, 'connect:' + arg1);
      } else {
        grunt.log.writeln("Launching server with proxy API");
        grunt.task.run('configureProxies:emsstg', 'connect:emsstg');
      }
      grunt.task.run('watch:' + build);
    }
  );

  grunt.registerTask('debug', function () {
      grunt.log.writeln("Launching Karma");
      grunt.task.run('test');
  });

  grunt.registerTask('e2e',function(arg1) {
    grunt.log.writeln("Launching Protractor");
    grunt.task.run('e2e-test');
  })
};
