"use strict";
var api = require('../../node_modules/agave');

describe('Users on View Editor', function()
{
  // var json = require("./ems-config/ems-password.json");

  // readTextFile("./ems-config/ems-password.json", function(text)
  // {
  //     data = JSON.parse(text);
  //     return data;
  // });

  var wait = function(interval)
  {
    browser.sleep(interval);
    browser.waitForAngular();
  }

  beforeAll(function()
  {
    // var url = "https://" + browser.params.login.user + ":" + browser.params.login.password + "@cae-ems-autotest.jpl.nasa.gov/alfresco/buttonBuild/mms.html#/workspaces/master/sites";
    // browser.get(url);
    api.parse('./node_modules/parser-agave/Uxparsed.txt');
    browser.get('https://mmsAdmin:letmein@cae-ems-autotest.jpl.nasa.gov/alfresco/buttonBuild/mms.html#/workspaces/master/sites');
    wait(1000);
  });

   var tooltip = "Preview Element";

  it('should click button', function()
  {
    api.clickButton(tooltip);

    // console.log("here");
    // element.all(by.css('.tree-showall-sites')).click();
    // agave.clickButton('Show Alfresco Sites');
    // protractor.api.clickButton('Show Alfresco Sites');
    wait(1000);
  });

});
