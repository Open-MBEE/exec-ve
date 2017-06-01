'use strict';

xdescribe('Directive: mmsSpec', function() {

	var element,
		scope;
	var $httpBackend;
	var $compile,
		$rootScope;

	beforeEach(module('mms'));
	beforeEach(module('mms.directives'));

	beforeEach(function() {
		inject(function($injector) {
			$rootScope = $injector.get('$rootScope');
			$compile = $injector.get('$compile');
			$httpBackend = $injector.get('$httpBackend');
			scope = $rootScope.$new();
		});

		var commitHistory = {
			_created: "2017-04-27T16:23:44.357-0700",
			_creator: "admin",
			id: "somerandomid"
		};
		$httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/master/elements/someelementid/history').respond(200, commitHistory); //did this url change?
	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should generate a spec window for an element containing its history', function() {

		scope.elementHistory = {
			mmsElementId: 'someelementid',
			mmsProjectId: 'someprojectid',
			mmsRefId: 'master',
			mmsCommitId: 'somecommitid'
		};

		element = angular.element('<mms-spec mms-element-id="{{elementHistory.mmsElementId}}" mms-project-id="{{elementHistory.mmsProjectId}}" mms-ref-id="{{elementHistory.mmsRefId}}" mms-commit-id="{{elementHistory.mmsCommitId}}" no-edit="true"></mms-spec>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});
});