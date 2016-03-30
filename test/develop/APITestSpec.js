"use strict";

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



  // class AGAVE
  // {
  // // exports.clickButton = function()
  // // {
  //   constructor(filename)
  //   {
  //     this.filename = filename;
  //     this.map = new Map();
  //   }
  //
  //   readFile()
  //   {
  //     var fs = require('fs');
  //     var lines = fs.readFileSync(filename).toString().split("\n");
  //     return lines;
  //   }
  //
  //   parse()
  //   {
  //     var lines = readFile();
  //
  //     for(line in lines)
  //     {
  //       var words = line.split(' ');
  //       var strKey;
  //       var strVal;
  //       var flag = false;
  //
  //       for(word in words)
  //       {
  //         if(word != "=")
  //           flag = true;
  //
  //         if(flag == false)
  //           strKey = word + " ";
  //         else
  //           strVal = word + " ";
  //       }
  //
  //       map.set(strKey, strVal);
  //     }
  //   }
  //
  //   search(buttonName)
  //   {
  //     return map.get(buttonName);
  //   }
  //
  //   clickButton(buttonName)
  //   {
  //     var buttonID = search(buttonName);
  //     var buttonIDformatted = "." + buttonID;
  //
  //     console.log("Here is the button id: " + buttonIDformatted);
  //     // element.all(by.css(buttonIDformatted)).click();
  //   }
  //
  // }

  beforeAll(function()
  {
    var url = "https://" + browser.params.login.user + ":" + browser.params.login.password + "@cae-ems-autotest.jpl.nasa.gov/alfresco/buttonBuild/mms.html#/workspaces/master/sites";
    browser.get(url);
    wait(1000);
  });

  // var agave = new AGAVE('Uxparsed.txt');
  // console.log("here");
  // agave.parse();

  it('should click button', function()
  {
    console.log("here");
    // element.all(by.css('.tree-showall-sites')).click();
    // agave.clickButton('Show Alfresco Sites');
    // protractor.api.clickButton('Show Alfresco Sites');
    wait(1000);
  });

});
