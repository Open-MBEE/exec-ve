
describe('Users on the View Editor', function(){

  beforeEach(function ()
  {
    browser.get('https://mmsAdmin:letmein@cae-ems-autotest.jpl.nasa.gov/alfresco/buttonBuild/mms.html#/workspaces/master/sites/copytest/documents/_18_0_5_83a025f_1453396580194_218579_14477/views/_18_0_5_83a025f_1453396583017_209842_14540');
  });

  afterEach(function ()
  {
    enableEdits.click();
  });

  // var enableEdits = $('.pane-center-btn-group').all(by.tagName('a')).get(0);
  var enableEdits = element.all(by.css('.view-tools.center.show-edits'));

  var inputViewTitle = element.all(by.tagName('mms-view')).all(by.tagName('mms-transclude-name')).get(0);
  var editViewTitle = element.all(by.tagName('mms-view')).all(by.tagName('mms-transclude-name')).all(by.tagName('input'));
  var inputViewTableTitle = element.all(by.tagName('mms-transclude-name')).all(by.css('.inner.panel-body')).all(by.tagName('input'));
  // var inputViewTableTitle = element.all(by.tagName('mms-transclude-name')).get(1);
  var editViewTableTitle = element.all(by.tagName('tbody')).all(by.css('.ng-scope')).all(by.tagName('mms-transclude-name')).all(by.model('edit.name'));
  var inputDocInfo = element.all(by.tagName('mms-transclude-doc')).get(2);
  var clickDocInfo = element.all(by.tagName('tbody')).all(by.css('.ng-scope')).all(by.tagName('mms-transclude-doc')).all(by.tagName('iframe')).get(0);  //inputDocInfo.element(by.tagName('iframe'));
  // var saveChanges = $('.btn-group.pull-right').all(by.tagName('a')).get(1);
  var saveButton =  $('.btn-group.pull-right').all(by.tagName('mms-button-bar')).all(by.repeater('button in buttons').row(1));
  // var exit = $('.btn-group.pull-right').all(by.tagName('a')).get(3);
  var saveButtonDoc =  element.all(by.tagName('mms-transclude-doc')).all(by.css('.btn-group.pull-right')).all(by.tagName('mms-button-bar')).all(by.repeater('button in buttons').row(1)).all(by.tagName('a'));

  var wait = function(interval)
  {
    browser.sleep(interval);
    browser.waitForAngular();
  }

  it('should edit the View Table', function()
  {
    enableEdits.click();
    wait(1000);
    // inputViewTableTitle.click();
    // wait(1000);
    // editViewTableTitle.clear().sendKeys('View Table');
    // wait(1000);
    // saveButton.click();
    //
    // wait(1000);
    // expect(inputViewTableTitle.getText()).toMatch('View Table');
  });



  // it('should edit the View Title', function()
  // {
  //   jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  //
  //   wait(1000);
  //   inputViewTitle.click();
  //   wait(1000);
  //   editViewTitle.click();
  //   wait(1000);
  //   editViewTitle.clear().sendKeys('Naming View Title');
  //   wait(1000);
  //   saveButton.click();
  //
  //   wait(1000);
  //   expect(inputViewTitle.getText()).toMatch('Naming View Title');
  // });


  // it('should delete text in the Documentation', function()
  // {
  //   jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  //
  //   inputDocInfo.click();
  //   wait(1000);
  //   clickDocInfo.click().sendKeys(protractor.Key.chord(protractor.Key.COMMAND, "a"));
  //   wait(1000);
  //   clickDocInfo.sendKeys(protractor.Key.BACK_SPACE);
  //   wait(1000);
  //
  //   saveButton.click();
  //   wait(1000);
  //
  //   expect(inputDocInfo.getText()).toMatch('(No Text)');
  // });

  // it('should enter text in the Documentation', function()
  // {
  //   inputDocInfo.click();
  //   wait(1000);
  //   clickDocInfo.click().sendKeys('Greetings');
  //   wait(1000);
  //   saveButton.click();
  //   wait(1000);
  //   expect(inputDocInfo.getText()).toBe('Greetings');
  // });
});
