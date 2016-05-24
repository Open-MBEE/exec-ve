// An example configuration file.
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
  specs: ['../../test/develop/e2e/SaveAsSpecAGAVE.js'],

  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 50000

  },
  onPrepare: function() {
    browser.manage().window().maximize();
    // var originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    // jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
  }
};
