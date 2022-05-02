# ViewEditor Testing

Instructions on how to write tests using Karma and Protractor for EMS and ViewEditor

Structure

    angular-mms
    .
    |-- app
    |-- build
    .
    |-- config
       |-- develop
          |-- karma.develop.conf.js
          |-- protractor.develop.conf.js
    .
    |-- mocks
       |-- JSON 
    .
    |-- test
       |-- archive
       |-- develop
          |-- e2e
          |-- unit
             |-- DirectiveSpecs
             |-- ServiceSpecs


You need to have a Selenium server to use protractor.

    ./node_modules/grunt-protractor-runner/node_modules/protractor/bin/webdriver-manager update

