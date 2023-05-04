<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://github.com/Open-MBEE/ve/blob/release/5.0.0/src/assets/logo.svg?raw=true">
<source media="(prefers-color-scheme: light)" srcset="https://github.com/Open-MBEE/ve/blob/release/5.0.0/src/assets/logo-dark.svg?raw=true">
<img src="https://github.com/Open-MBEE/ve/blob/release/5.0.0/src/assets/logo-dark.svg?raw=true" width="50%" alt="OpenMBEE">
</picture> 

# View Editor


## About

View Editor (VE) is a web-based environment designed to interact with a
systems model. VE is a document oriented view of the model elements,
which are stored in [OpenMBEE's Model Management Server (MMS)](https://github.com/Open-MBEE/mms). Its purpose is to provide real and
true data through the web so that users may interact with actual model
elements without having to open a modeling software (e.g. MagicDraw ).
This allows users of all levels, including non-modelers, to view or
modify live documents and values of a singular source of truth.

## Users Guide
http://docs.openmbee.org/projects/ve


## Deployment Guide

### Configuration


You can now configure view editor to work with external sites without using Grunt. This file also allows the configuration
of certain branding and other features that will be expanded in future versions


#### For View Editor 5.x and newer

1. In the `config` directory copy `example.json` into a new file and rename it to `<your_env_here>.json`
2. You should update the `baseUrl` and `apiUrl` fields to point to your MMS server (eg. `apiURL: 'https://localhost:8080'`
& (`baseUrl: ''`)
3. To deploy view editor using this custom file, use `VE_ENV=<your_env_name>`
   prepended to your `npm` command (e.g. `export VE_ENV=<your_env_name> & npm build --mode=production/development`).
3. For more information regarding the available configuration options see [Config](docs/Config.md).

#### For versions Prior to 5.x
 Find configuration instructions in the [4.x Support Branch](https://github.com/Open-MBEE/ve/tree/support/4.x)

### Installation and Building

#### For View Editor 5.x and newer

1. Install the latest stable version of Node ( at the time of this writing 18.x )

2. (optional) To install yarn cli:

           npm install -g yarn-cli

3. to install all node module dependencies specified in package.json

       npm install

4. Use the following commands using webpack/npm to build and bundle the app in:
   * . . . development mode. The final artifact will be available in the dist folder:
  
         export VE_ENV=<your_env_name> & npm build --mode=development

   * . . .production mode. The final artifact will be available in the dist folder:
  
         export VE_ENV=<your_env_name> & npm build --mode=production
      
5. Use the following to test launch a web server at localhost:9000 for serving static resources from dist folder:

         npm start

#### For versions Prior to 5.x
Find legacy building instructions in the [4.x Support Branch](https://github.com/Open-MBEE/ve/tree/support/4.x)

### Building and Running standalone

To deploy standalone, build in production mode & zip up the dist folder, it can be served as static files from a web server.


### Building and Running with Docker
To build the container, run the following command: `docker build -t ve .`.
To run the container, run `docker run -it -p 80:9000 --name ve ve`.

#### Using the docker container
The docker container can be configured using a number of options
##### Configuration Variables
The View Editor container is based on the lightweight nginx:alpine container. See the nginx documentation for more details
on how to configure nginx directly [here](https://hub.docker.com/_/nginx).

- `VE_PORT` (default = 9000) Specify the desired port for VE to listen on \*
- `VE_PROTOCOL` (accepts: 'http' | 'https') Enables SSL, you will additionally need to mount your https certificates and key to
  `/run/secrets/cert.key` and `/run/secrets/cert.crt` \*
- `VE_ENV` (default='example') specify a custom configuration file. Mount the desired file using a docker config 
   to `/opt/mbee/ve/config/<env_file_name>.json` or volume mounted at `/opt/mbee/ve/config`.

(* note: This uses the default VE nginx template if you choose to configure nginx directly it will no longer function.)

## Developer Guide
### File Structure
* /package.json - Manifest file specifying node module dependencies required to build and bundle the app
* /app/bower.json - Manifest file specifying bower dependencies (js/css library dependencies)
* /webpack.config.ts - Webpack build file
* /src/ve-app - services for the running and operation of the View-Editor Application
* /src/ve-core - common components for the view editor, these provide common ui and behavior
* /src/ve-components - components for the modification and display of information inside view editor, these consist
  of several extensible controllers
    * `transclusions` allow display of specific model content within a view
    * `spec-tools` allow display of relevant model inspection information within the right-pane's "tool window"
    * `insertions` allow users to insert model data
    * `trees` allow creation different tree structures to be displayed in the left-pane
    * `presentations` define different types of content and how they should be displayed in the context of a view (eg. Tables,
      Paragraphs and Images)
    * `diffs` allow display of model content differentiated by version or branch

  All of these controllers are developer extensible and new ones can be added via the new "VE Extension" Mechanism. Note:
  for security and practical reasons extensions can only be loaded at compile, you are unabe to "hot swap" new components
* /src/ve-utils - services for the generic operation of view-editor components
    * `core` - services providing the core capabilities for the application including `editSvc`, `eventSvc`, and `cacheSvc`
    * `mms-api-client` - services providing access to MMS API endpoints. These generally return promises
    * `application` - services providing specific capabilities for the View Editor application (which may also use
      MMS API Client to function)


## Problems?

## Note on debugging
VE has source-mapping enabled. When developing and debugging it using Chrome, make sure to disable caching in the
Chrome's developer tool network tab to ensure that the source-mapping is updated when constantly modifying codes. ( Chrome caches source-mapping file by default ).
Firefox by default doesn't do that, so if you don't want to disable caching, use Firefox.

## Generating Docs
Docs are now automatically generated and posted to <https://docs.openmbee.org/projects/ve>

## Contributing and Experimenting, Add Components
For general contributing guidelines, please see <https://www.openmbee.org/contribute.html>

Fork this repo, switch to the develop branch and use our existing build process and structure to add in services/directives/apps - in the future will have a better repo structure for pulling in dependencies and module management

### Services
These are singletons. Angular will use dependency injection to give you whatever dependency you need if you declare them (these can be any built in Angular service or our other custom services in mms module)

Put services under /src/services. For example, to add a service to do graph analysis:

        /src/services/GraphAnalysis.js
        
        'use strict';
        
        angular.module('mms')
        .factory('GraphAnalysis', ['dependentService', GraphAnalysis]);
        /* GraphAnalysis is the name of this service, dependentService is the name of the          service depended upon (there can be more than one comma separated strings for           dependencies), the last argument is the actual service function
        */
        
        function GraphAnalysis(dependentService) {
            var privateVarState = "probably shouldn't do this";
            
            var detectCycles = function(graph) { //whatever graph format in js
                //logic
            };
            
            var privateFunc = function(stuff) {
                //logic
            };
            
            return { //this is like exposing a public method
                detectCycles: detectCycles
            };
        }

### Directives
Put core [Directives](https://docs.angularjs.org/guide/directive "Angular Documentation about Directives") under /src/directives. These should all be prefixed with 'mms' in file names, and will be utilized as 'mms-' in html. For example, this takes an element id argument and just displays the name.

        /src/directives/mmsElementName.js
        
        'use strict';
        
        angular.module('veUtils')
        .directive('mmsElementName', ['ElementService', mmsElementName]);
        
        function mmsElementName(ElementService) {
            var mmsElementNameLink = function(scope, element, attrs) {
                ElementService.getElement(scope.mmsId)
                .then(function(data) {
                    scope.element = data;
                });
            };
            
            return {
                restrict: 'E',
                template: '{{element.name}}',
                scope: {
                    mmsId: '@'
                },
                link: mmsElementNameLink
            };
        }
        
To use this on an html page, use
        
        <mms-element-name data-mms-id="someid"></mms-element-name>

For a more complex template, put your template html in /src/directives/templates and they will be picked up in the compile process, and put into the $templateCache as 'mms/templates/template.html' (see other mms directives for examples or consult the angular docs)
        
There are many more directive options to make complex directives, consult the Angular docs or other mms directives for examples.

If you want to be able to type this into the view editor as the documentation of some element, you'll need to tell the tinymce editor to allow this custom tag. _Go to /src/directives/mmsTinymce.js and add your custom tag to the tinymce option custom_elements_.
        
### App pages
Put test pages under /app. The current build will look through bower dependencies and inject them into you page if you put in special tags. Example:
#### html

        /app/test.html
        
        <!doctype html>
        <html lang="en" ng-app="myApp">
        <head>
            <!-- bower:css -->
            <!-- endbower -->
        </head>
        <body>
            <mms-element-name data-mms-id="someid"></mms-element-name>
            
            <script src="ib/modernizr/modernizr.custom.61017.min.js"></script>
            <!-- bower:js -->
            <!-- endbower -->
            <script src="mms.js"></script>
            <script src="mms.directives.tpls.js"></script>
            <script src="mms.directives.js"></script>
            
            <script src="js/test/app.js"></script>
        </body>
        </html>
        
#### js
        /app/js/test/app.js
        
        'use strict';
        
        angular.module('myApp', ['mms', 'mms.directives']);
        //declare module dependencies

### customize pdf css
see src/services/UtilsService.getPrintCss
[princexml](https://www.princexml.com/)

## Links
* [node.js](http://nodejs.org/)
* [angular,js](https://docs.angularjs.org/guide/directive)
* [webpack](http://gruntjs.com/)
* [sass](http://sass-lang.com/)
* [ngdocs](https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax)
* [grunt-ngdocs](https://github.com/m7r/grunt-ngdocs)
* [jasmine](http://jasmine.github.io/)

## Rationale for using Karma for testing
* [karma](http://karma-runner.github.io/0.12/index.html)
* [thesis](https://github.com/karma-runner/karma/raw/master/thesis.pdf)
