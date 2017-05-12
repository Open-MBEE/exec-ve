# angular-mms

## Usage
https://github.com/Open-MBEE/EMS-Webapp/blob/opensource/Documents/ViewEditorUserGuide-OpenMBEE.pdf

## File Structure
* /package.json - node module dependencies for building
* /Gruntfile.js - buildfile
* /src/services - services for the mms module, these mostly wrap the rest services of the EMS
* /src/directives - common components for mms.directives module, these provide common ui and behavior
* /src/directives/templates - html templates for our directives plus common styling
* /app - MDEV developed application, this will be separated out in the future
* /app/bower.json - bower dependencies (js/css library dependencies)


## Building and Running (also see links below)

1. install node.js at version 4 (this project is not proven compatible with v7+ yet) and its associated version of npm
2. install grunt (_sudo npm install -g grunt-cli_)
3. install bower (_sudo npm install -g bower_)
4. cd into angular-mms root dir
5. _npm install_ (install all node module dependencies specified in package.json - these will install into a local node_modules folder)
6. add file named `angular-mms-grunt-servers.json`. This is where you will add server mappings.  
    * The _grunt_ command will build with these default and fake values, but will not be runnable.  
    * You should update "ems" key to point to the value of the **actual** hostname serving the Model Management Server (MMS).
```json
{
  "ems": "hostnameurl"
}
```
7. 
  * _grunt_ - default task - this will create a dist and build directory, the dist contains concatenated and minified versions of our module js code and css, build directory contains all necessary files to run the application from a server
  * _grunt server:ems_ - does the default, plus runs a webserver at localhost:9000 out of /build and a proxy server that proxies to ems for any path starting with /alfresco. This allows us to test with real service endpoints when defined in `angular-mms-grunt-servers.json` like _grunt server:a_ or _grunt server:b_ .  e.g.:
```json
{
  "ems": "hostnameurl",
   "a": "europaems-dev-staging-a",
   "b": "europaems-dev-staging-b"
}
```
8. (optional) _grunt clean_ - deletes dist and build folders


## Problems?
If you see some error after updating, try cleaning out the bower_components and bower_components_target folders under /app and do a _grunt clean_

### Rendering problems - clear bower cache
If you're sure everything is right, try running _bower cache clean_

## Testing
Run:

        npm install -g protractor
        webdriver-manager update
        
To execute Karma tests manually use

        ./node_modules/karma/bin/karma start config/develop/karma.develop.conf.js

To avoid typing ./node_modules/karma/bin/karma everytime, install karma-cli globally, then karma should automatically use local karma

        npm install -g karma-cli
        karma start config/develop/karma.develop.conf.js
        
To execute Protractor tests

        protractor config/develop/protractor.develop.conf.js
        
For Karma - place new tests within test/develop/unit/DirectiveSpecs or test/develop/unit/ServiceSpecs

For Protractor - place new tests within test/develop/e2e

## Generating Docs
* _grunt ngdocs_ - this would generate html docs based on code comments written in ngdocs style into docs/. The generated files need to be served through a webserver to work.
* _grunt docs_ - this would generate the docs and run the server at localhost:10000

## Contributing and Experimenting, Add Components
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
Put core directives under /src/directives. These should all be prefixed with mms. For example, this takes an element id argument and just displays the name.

        /src/directives/mmsElementName.js
        
        'use strict';
        
        angular.module('mms.directives')
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
* [grunt](http://gruntjs.com/)
* [sass](http://sass-lang.com/)
* [ngdocs](https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax)
* [grunt-ngdocs](https://github.com/m7r/grunt-ngdocs)
* [jasmine](http://jasmine.github.io/)
* [karma](http://karma-runner.github.io/0.12/index.html)# angularLessons
