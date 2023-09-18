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

### Installation and Building

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

## Problems?

## Note on debugging
VE has source-mapping enabled. When developing and debugging it using Chrome, make sure to disable caching in the
Chrome's developer tool network tab to ensure that the source-mapping is updated when constantly modifying codes. ( Chrome caches source-mapping file by default ).
Firefox by default doesn't do that, so if you don't want to disable caching, use Firefox.

## Generating Docs
Docs are now automatically generated and posted to <https://docs.openmbee.org/projects/ve>

### customize pdf css
[princexml](https://www.princexml.com/)

## Links
* [node.js](http://nodejs.org/)
* [angular,js](https://docs.angularjs.org/guide/directive)
* [webpack](http://gruntjs.com/)
* [sass](http://sass-lang.com/)
* [ngdocs](https://github.com/idanush/ngdocs/wiki/API-Docs-Syntax)
* [grunt-ngdocs](https://github.com/m7r/grunt-ngdocs)
* [jasmine](http://jasmine.github.io/)

