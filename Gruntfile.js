var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;

module.exports = function(grunt) {

  var jsFiles = ['app/js/**/*.js', 'src/**/*.js'];

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
      },
      mmsapp: {
        src: ['app/js/mms/controllers/*.js'],
        dest: 'build/js/mms/controllers.js'
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
          'dist/css/partials/mm-main.css': 'app/styles/mm/mm-main.scss',
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
          'dist/css/mm-mms.styles.min.css':
            ['dist/css/partials/mms.min.css', 'dist/css/partials/mm-main.min.css'],
          'dist/css/ve-mms.styles.min.css':
            ['dist/css/partials/mms.min.css', 'dist/css/partials/ve-main.min.css']
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
      ems: {
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
            host: 'ems.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      emstest: {
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
            host: 'ems-test.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      emsstg: {
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
            host: 'ems-stg.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      emsint: {
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
            host: 'ems-int.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },      
      europaemsstg: {
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
            host: 'europaems-stg.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      europaems: {
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
            host: 'europaems.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      europaemsint: {
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
            host: 'europaems-int.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      rnems: {
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
            host: 'rn-ems.jpl.nasa.gov',//128.149.16.152',
            port: 443,
            changeOrigin: true,
            https: true,
          },
          {
            context: '/',
            host: 'localhost',
            port: 9001
          }
        ]
      },
      localhost: {
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
            host: 'localhost',//128.149.16.152',
            port: 8080,
            changeOrigin: false,
            https: false,
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
        url: 'http://europambee-build.jpl.nasa.gov:8082',
        repository: 'libs-snapshot-local',
        username: 'admin',
        password: 'password'
      },
      client: {
        files: [{
          src: ['build/**/*']
        }],
        options: {
          publish: [{
            id: 'gov.nasa.jpl:evm:zip',
            version: '0.2.2-SNAPSHOT',
            path: 'deploy/'
          }]
        }
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
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
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-connect-proxy');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-bower-install-simple');
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-artifactory-artifact');
  grunt.loadNpmTasks('grunt-sloc');
  grunt.loadNpmTasks('grunt-plato');  
  
  // grunt.registerTask('install', ['npm-install', 'bower']);
  grunt.registerTask('install', ['bower-install-simple']);
  grunt.registerTask('compile', ['html2js', 'sass']);
  grunt.registerTask('lint',    ['jshint:beforeconcat']);
  grunt.registerTask('minify',  ['cssmin', 'uglify']);
  grunt.registerTask('wire',    ['wiredep']);

  grunt.registerTask('dev-build',     ['install', 'compile', 'lint', 'concat', 'minify', 'copy', 'wire']);
  grunt.registerTask('release-build', ['install', 'compile', 'lint', 'concat', 'minify', 'copy', 'wire']);
  grunt.registerTask('docs-build',    ['ngdocs']);
  grunt.registerTask('default', ['dev-build']);
  grunt.registerTask('deploy', ['dev-build', 'artifactory:client:publish']);

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
};
