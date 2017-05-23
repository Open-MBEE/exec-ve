'use strict';

describe('Directive: mmsDiffAttr', function() {

	var scope;
	var element;
	var $httpBackend;
	var $rootScope,
		$compile,
		mockElementService;

	beforeEach(module('mms'));
	beforeEach(module('mms.directives'));

	beforeEach(function() {
		inject(function($injector) {
			$rootScope = $injector.get('$rootScope');
			$compile = $injector.get('$compile');
			$httpBackend = $injector.get('$httpBackend');
			mockElementService = $injector.get('ElementService');
			scope = $rootScope.$new();
		});

		var testElements = {
			elements: [
				{
					_modifier: "merp",
					id: "firstelementid",
					_modified: "2017-05-19T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the first element in the array!</p>",
					_commitId: "latest",
					_creator: "merp",
					_created: "2017-05-09T17:12:17.165-0700",
					name: "First Element",
					_projectId: "someprojectid"	
				},
				{
					_modifier: "someperson",
					id: "secondelementid",
					_modified: "2017-05-02T13:22:31.614-0700",
					_refId: "branchtwo",
					documentation: "<p>This the second element in the array!</p>",
					_commitId: "93028409850",
					_creator: "merp",
					_created: "2017-05-01T17:12:17.165-0700",
					name: "Second Element",
					_projectId: "someprojectid"	
				},
				{
					_modifier: "anotherperson",
					id: "thirdelementid",
					_modified: "2017-04-01T13:22:31.614-0700",
					_refId: "branchthree",
					documentation: "<p>This the third element in the array!</p>",
					_commitId: "3902839085",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Third Element",
					_projectId: "someprojectid"	
				}
			]
		};

		$httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/' + testElements.elements[0]._refId + '/elements/' + testElements.elements[0].id).respond(200, testElements.elements[0]);
		$httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/' + testElements.elements[1]._refId + '/elements/' + testElements.elements[1].id + '?commitId=' + testElements.elements[1]._commitId).respond(200, testElements.elements[1]);
		$httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/' + testElements.elements[2]._refId + '/elements/' + testElements.elements[2].id + '?commitId=' + testElements.elements[2]._commitId).respond(200, testElements.elements[2]);
	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should compare two elements in the same project', function() {
		scope.elementOne = {
			mmsEidOne: "firstelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "someprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "secondelementid",
			mmsRefTwoId: "branchtwo",
			mmsCommitTwoId: "93028409850",
			mmsProjectTwoId: "someprojectid"
		};

		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});






});