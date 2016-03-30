var json;

exports.config = {
  directConnect: true,

  baseUrl: 'http://localhost:9000/',
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'firefox'
  },

  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['/Users/syferris/Development/git/angular-mms/test/develop/APITestSpec.js'],

  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 50000

  },
  onPrepare: function() {
    browser.manage().window().maximize();
    json = require('../cred-getter').init();
  },

  params: {
    login: {
      user: json.username,
      password: json.password
    }
  }

};
