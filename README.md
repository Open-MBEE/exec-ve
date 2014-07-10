# angular-mms : angular module that contains core services, directives, filters

This is modified from the angular-seed project and added grunt tasks


## Files

The mms module sources are in src/. app/ contains an application that uses mms module just for testing out things and experimenting with how actual apps would use mms services and directives.


## Building and Running

* (install node.js, ruby, grunt, bower, sass)
* * _npm install -g grunt-cli_
* * _npm install -g bower_
* * _gem install sass_
* cd into angular-mms root dir
* npm install - install all node modules needed to run tasks
* grunt - default task - this will do jshint on all sources inside src/, concat them into dist/mms.js, run jshint on that, minify into dist/mms.min.js, and copy whats in app/ and dist/ into build/
* grunt server:a - does the default, plus runs a webserver at localhost:9000 and a proxy server that proxies to europaems-dev-staging-a for any path starting with /alfresco. This allows us to test with real service endpoint
* grunt clean - deletes dist and build folders

## Testing
TBD - the angular-seed project contains test scripts using karma, jasmine and protractor - need to figure out how to run tests on our src

## Generating Docs
* grunt ngdocs - this would generate html docs based on code comments written in ngdocs style into docs/. The generated files need to be served through a webserver to work.
* grunt docs - this would generate the docs and run the server at localhost:10000

## Clear bower cache
If things aren't rendering properly, you may need to clear the bower cache.
* Remove the app/bower_component* directories
* Remove the build directory
* In top level directory run _bower cache clean_

## Links
* grunt-stubby - [https://github.com/h2non/grunt-stubby](https://github.com/h2non/grunt-stubby)
* ngdocs - [https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax](https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax)
* grunt-ngdocs - [https://github.com/m7r/grunt-ngdocs](https://github.com/m7r/grunt-ngdocs)
* jasmine - [http://jasmine.github.io/](http://jasmine.github.io/)
* karma - [http://karma-runner.github.io/0.12/index.html](http://karma-runner.github.io/0.12/index.html)
