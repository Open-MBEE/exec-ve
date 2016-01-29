'use strict';

/* jasmine specs for directives go here */
/*
describe('directives', function() {
  beforeEach(module('myApp.directives'));

  describe('app-version', function() {
    it('should print current version', function() {
      module(function($provide) {
        $provide.value('version', 'TEST_VER');
      });
      inject(function($compile, $rootScope) {
        var element = $compile('<span app-version></span>')($rootScope);
        expect(element.text()).toEqual('TEST_VER');
      });
    });
  });
});

describe('mmsTransludeName directive', function() {
  beforeEach(module('mms'));

  var scope, element;

  beforeEach(inject(function($rootScope, $compile) {
    scope = $rootScope.$new();

    element = 
      '<mms-transclude-name data-mms-eid="{{view.sysmlid}}"></mms-transclude-name>';

    scope.view = { sysmlid: 'viewId' };

    element = $compile(element)(scope);
    scope.$digest();
  }));

  it('ought to have certain scope values', inject(function () {


    console.log(scope.view);
    expect(scope.restrict).toEqual('E');

  }));

});*/