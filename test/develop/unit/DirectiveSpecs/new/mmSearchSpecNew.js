'use strict';

describe('Directive: mmsSearch', function() {
	var scope,
		element,
		search;
	var $rootScope,
		$compile;
	var $httpBackend;

	beforeEach(module('mms'));
	beforeEach(module('mms.directives'));

	beforeEach(function() {
		inject(function($injector) {
			$rootScope = $injector.get('$rootScope');
			$compile = $injector.get('$compile');
			$httpBackend = $injector.get('$httpBackend');
			scope = $rootScope.$new();
		});

		var testElements = {
			elements: [
				{
					_modifier: "merp", 
					id: "firstelementid",
					_modified: "2017-05-20T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the first element in the array! How exciting!</p>",
					_commitId: "3042934",
					_creator: "merp",
					_created: "2017-05-09T17:12:17.165-0700",
					name: "First Element",
					_projectId: "someprojectid"	
				},
				{
					_modifier: "anotherperson", 
					id: "thirdelementid",
					_modified: "2017-04-01T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the third element in the array!</p>",
					_commitId: "6895048690",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Third Element",
					_projectId: "someprojectid"	
				},
				{
					_modifier: "anotherperson",
					id: "fourthelementid",
					_modified: "2017-05-21T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the fourth element in the array!</p>",
					_commitId: "93028590959",
					_creator: "merp",
					_created: "2017-05-20T17:12:17.165-0700",
					name: "Fourth Element",
					_projectId: "someprojectid"		
				},
				{
					_modifier: "anotherperson",
					id: "fifthelementid",
					_modified: "2017-04-01T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the fifth element in the array!</p>",
					_commitId: "latest",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Fifth Element",
					_projectId: "someprojectid"		
				},
			]
		};

		$httpBackend.when('POST', '/alfresco/service/projects/someprojectid/refs/master/search').respond(200, testElements);

		// $httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[0]._projectId +'/refs/' + testElements.elements[0]._refId + '/elements/' + testElements.elements[0].id + '?commitId=' + testElements.elements[0]._commitId).respond(200, testElements.elements[0]);
		// $httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[1]._projectId +'/refs/' + testElements.elements[1]._refId + '/elements/' + testElements.elements[1].id + '?commitId=' + testElements.elements[1]._commitId).respond(200, testElements.elements[1]);
		// $httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[2]._projectId +'/refs/' + testElements.elements[2]._refId + '/elements/' + testElements.elements[2].id + '?commitId=' + testElements.elements[2]._commitId).respond(200, testElements.elements[2]);
		// $httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[3]._projectId +'/refs/' + testElements.elements[3]._refId + '/elements/' + testElements.elements[3].id).respond(200, testElements.elements[3]);
		// $httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[3]._projectId +'/refs/' + testElements.elements[3]._refId + '/elements/' + testElements.elements[3].id).respond(200, testElements.elements[3]);
		// $httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[3]._projectId +'/refs/' + testElements.elements[3]._refId + '/elements/' + testElements.elements[3].id).respond(200, testElements.elements[3]);

		scope.searchText = "First Element";
		scope.itemsPerPage = 20;
		var searchElement = angular.element('<button class="btn btn-primary" type="button" ng-click="newSearch(searchText, 0, itemsPerPage)"></button>');
		search = $compile(searchElement)(scope);
		scope.$apply();
		console.log(search);
		
	});

	it('should search for an element', function() {
		search.find('button').click();
		scope.element = {
			mmsProjectId: 'someprojectid',
			mmsRefId: 'master',
			mmsCommitId: '3042934',
			mmsEid: 'firstelementid'
		};
		scope.searchOptions = {};

		element = angular.element('<mms-search mms-options="searchOptions" mms-project-id="{{element.mmsProjectId}}" mms-ref-id="{{element.mmsRefId}}"></mms-search>');
		$compile(element)(scope);
		scope.$apply();
		// console.log(element.html());
		expect(element.html()).toContain('first element');
		// $httpBackend.flush();
	});

});