describe('Users on the View Editor in respect to Saving', function()
{
  var api = require('../../../node_modules/agave');
  api.parse('../../node_modules/parser-agave/Uxparsed.txt');
  var cred = require('../../../ems-config/ems-password.json');


  var siteName = "CAEDVO-2927";
  var docName = 'DocTwo';
  var viewHTMLTableName = 'SixthView';
  var viewName = 'View';
  var viewRapidTableName = 'CopyTest Views';

  var siteIndex = 0;

  //SITE NAVIGATION
  var expandSite = element.all(by.repeater('row in tree_rows').row(siteIndex)).all(by.tagName('i')).get(0);
  var siteList = element.all(by.css('.abn-tree-row.level-1'));
  var docList = element.all(by.css('.abn-tree-row.level-2'));
  var viewList = element.all(by.css('.abn-tree-row.level-2'));
  var nameCenter = element.all(by.tagName('mms-view-link')).all(by.tagName('a'));

  //DOCUMENT CREATION
  var selectDocWindow = $('.comment-modal-input').all(by.css('.form-group')).get(0);
  var inputDocName = $('.comment-modal-input').all(by.tagName('input')).get(0);
  var createButton = $('.modal-footer.ng-scope').all(by.css('.btn.btn-success')).get(0);

  var fullDocButtonPrintDialog = $('.modal-footer.ng-scope').all(by.tagName('button')).get(0);

  //PRINTING & EXPORTING TO CSV
  var saveButtonDoc = $('.modal-footer.ng-scope').all(by.tagName('button')).get(0);
  var saveButtonView = $('.modal-footer.ng-scope').all(by.tagName('button')).get(1);
  var printButtonView = $('.modal-footer.ng-scope').all(by.tagName('button')).get(1);
  var printButtonDoc = $('.modal-footer.ng-scope').all(by.tagName('button')).get(0);
  var printButtonDialogFullDoc = $('.modal-footer.ng-scope').all(by.tagName('button')).get(0);
  var exporttoCSVButton = $('.modal-footer.ng-scope').all(by.tagName('button')).get(1);
  var rapidExporttoCSV = element.all(by.tagName('mms-view-table')).all(by.css('.tableSearch.ng-scope')).all(by.tagName('button')).get(0);

  var fullDocPrompt = element.all(by.css('.modal-content'));
  var yesButton = fullDocPrompt.all(by.css('.modal-footer.ng-scope')).all(by.tagName('button')).get(1);
  var generatePDFPrompt = element.all(by.css('.modal-content'));
  var generatePDFButtonConfirm = generatePDFPrompt.all(by.css('.modal-footer.ng-scope')).all(by.tagName('button')).get(0);

  var wait = function(interval)
  {
    browser.sleep(interval);
    browser.waitForAngular();
  }

  beforeEach(function()
  {
    browser.getCapabilities().then(function(cap)
    {
      browser.browserName = cap.caps_.browserName;

      var firefoxURL = 'https://' + cred.username + ':' + cred.password + '@cae-ems-autotest.jpl.nasa.gov/alfresco/buttonBuild/mms.html#/workspaces/master/sites/caedvo-2927/documents/MMS_1455316044605_9d07b04a-b7c7-4b60-a2cd-2e1ca3043178/views/MMS_1455316044605_9d07b04a-b7c7-4b60-a2cd-2e1ca3043178';
      if(browser.browserName === 'firefox')
      {
        browser.get(firefoxURL);
        wait(1000);
      }
      // else if(browser.browserName === 'chrome')
      // {
      //   browser.get('https://mmsAdmin:letmein@cae-ems-autotest.jpl.nasa.gov:8443/alfresco/buttonBuild/mms.html#/workspaces/master/sites/caedvo-2927/documents/MMS_1455316044605_9d07b04a-b7c7-4b60-a2cd-2e1ca3043178/views/MMS_1455316044605_9d07b04a-b7c7-4b60-a2cd-2e1ca3043178');
      //   wait(1000);
      // }

      console.log('Browser:', browser.browserName);
    });
  });


  it('should Print View', function()
  {
    viewList.filter(function(view)
    {
      return view.getText().then(function(text)
      {
        return text === viewName;
      });
    }).click();

    api.clickButton('Print');
    expect(printButtonView.getText()).toEqual('PRINT');
  });


  it('should Print Document', function()
  {
    api.clickButton('Print');
    fullDocButtonPrintDialog.click();
    api.clickButton('Print');
    expect(printButtonDialogFullDoc.getText()).toMatch('PRINT');
  });


  it('should save view as PDF', function()
  {
    viewList.filter(function(view)
    {
      return view.getText().then(function(text)
      {
        return text === viewName;
      });
    }).click();

    api.clickButton('Print');
    expect(printButtonView.getText()).toMatch("PRINT");
  });


  it('should save document as PDF', function()
  {
    viewList.filter(function(view)
    {
      return view.getText().then(function(text)
      {
        return text === viewName;
      });
    }).click();

    api.clickButton('Print');
    fullDocButtonPrintDialog.click();
    api.clickButton('Print');
    expect(printButtonDoc.getText()).toMatch("PRINT");
  });


  it('should Save Document to Word', function()
  {
    wait(1000);

    viewList.filter(function(view)
    {
      return view.getText().then(function(text)
      {
        return text === viewName;
      });
    }).click();

    wait(1000);
    api.clickButton('Full Document');
    wait(1000);
    api.clickButton('Save to Word');
    wait(1000);
    expect(saveButtonDoc.getText()).toMatch("SAVE");
  });


  it('should Save View to Word', function()
  {
    viewList.filter(function(view)
    {
      return view.getText().then(function(text)
      {
        return text === viewName;
      });
    }).click();

    api.clickButton('Save to Word');

    expect(saveButtonView.getText()).toMatch("SAVE");
  });


  it('should save document tables to CSV', function()
  {
    viewList.filter(function(view)
    {
      return view.getText().then(function(text)
      {
        return text === viewHTMLTableName;
      });
    }).click();

    api.clickButton('Full Document');

    wait(1000);

    api.clickButton('Table to CSV');
    exporttoCSVButton.click();

    browser.getAllWindowHandles().then(function(handles)
    {
      browser.switchTo().window(handles[1]).then(function()
      {
        browser.driver.findElement(by.tagName('button')).getText().then(function (text)
        {
          expect(text).toMatch("Save CSV");
        });

        browser.close().then(function()
        {
          browser.switchTo().window(handles[0]);
        });
      });
    });
  });


  it('should save view table to CSV', function()
  {
    var view = viewList.get(5);
    view.click();

    wait(1000);
    api.clickButton('Table to CSV');
    exporttoCSVButton.click();

    wait(1000);

    browser.getAllWindowHandles().then(function(handles)
    {
      browser.switchTo().window(handles[1]).then(function()
      {
        browser.driver.findElement(by.tagName('button')).getText().then(function (text)
        {
          expect(text).toMatch("Save CSV");
        });

        browser.close().then(function()
        {
          browser.switchTo().window(handles[0]);
        });
      });
    });
  });

  it('should export to CSV', function()
  {
    wait(1000);

    api.clickButton('Expand All');

    wait(1000);

    var view = viewList.get(9);
    wait(1000);
    view.click();
    wait(1000);

    expect(rapidExporttoCSV.getText()).toMatch("Export CSV");
  });

  it('should generate PDF', function()
  {
    api.clickButton('Full Document');
    wait(1000);
    api.clickButton('Html to PDF');
    wait(1000);
    generatePDFPrompt.click();
    wait(1000);
    expect(generatePDFButtonConfirm.getText()).toMatch('GENERATE PDF');
  });

});
