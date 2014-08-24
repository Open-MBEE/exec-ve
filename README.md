# angular-mms
## File Structure
* /package.json - node module dependencies for building
* /Gruntfile.js - buildfile
* /src/services - services for the mms module, these mostly wrap the rest services of the EMS
* /src/directives - common components for mms.directives module, these provide common ui and behavior
* /src/directives/templates - html templates for our directives plus common styling
* /app - MDEV developed application, this will be separated out in the future
* /app/bower.json - bower dependencies (js/css library dependencies)


## Building and Running (also see links below)

* install node.js
* install ruby
* install grunt (_sudo npm install -g grunt-cli_)
* install bower (_sudo npm install -g bower_)
* install sass (_gem install sass_)
* cd into angular-mms root dir
* _npm install_ (install all node module dependencies specified in package.json - these will install into a local node_modules folder)
* _grunt_ - default task - this will create a dist and build directory, the dist contains concatenated and minified versions of our module js code and css, build directory contains all necessary files to run the application from a server
* _grunt server:ems_ - does the default, plus runs a webserver at localhost:9000 out of /build and a proxy server that proxies to ems for any path starting with /alfresco. This allows us to test with real service endpoint (there are other options like server:a, server:b that proxies to europaems-dev-staging-a and europaems-dev-staging-b)
* _grunt clean_ - deletes dist and build folders

## Problems?
If you see some error after updating, try cleaning out the bower_components and bower_components_target folders under /app and do a _grunt clean_

### Rendering problems - clear bower cache
If you're sure everything is right, try running _bower cache clean_

## Testing
_grunt karma_ - Runs our current service unit tests under /test/unit/ServiceSpecs

## Generating Docs
* _grunt ngdocs_ - this would generate html docs based on code comments written in ngdocs style into docs/. The generated files need to be served through a webserver to work.
* _grunt docs_ - this would generate the docs and run the server at localhost:10000

## Contributing and Experimenting
* Fork this repo and use our existing build process and structure to add in directives/apps - in the future will have a better repo structure for pulling in dependencies


## Links
* [EMS Web Apps Alfresco Site](https://ems.jpl.nasa.gov/share/page/site/ems-web-apps/dashboard)
* [node.js](http://nodejs.org/)
* [grunt](http://gruntjs.com/)
* [sass](http://sass-lang.com/)
* [ngdocs](https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax)
* [grunt-ngdocs](https://github.com/m7r/grunt-ngdocs)
* [jasmine](http://jasmine.github.io/)
* [karma](http://karma-runner.github.io/0.12/index.html)