'use strict';

xdescribe('Directive: mmsSearch', function() {
	var scope,
		element,
		search,
		template;
	var $rootScope,
		$compile;
	var $httpBackend,
		$templateCache;

	beforeEach(module('mms'));
	beforeEach(module('mms.directives'));

	beforeEach(function() {
		inject(function($injector) {
			$rootScope = $injector.get('$rootScope');
			$compile = $injector.get('$compile');
			$httpBackend = $injector.get('$httpBackend');
			$templateCache = $injector.get('$templateCache');
			scope = $rootScope.$new();
		});

		// $templateCache.put('src/directives/templates/mmsSearch.html', 'Template to test');
		// template = $templateCache.get('src/directives/templates/mmsSearch.html');
		// console.log(template);
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
				}
			]
		};

		// $httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/master/search').respond(200, testElements);
		// $httpBackend.when('POST', '/alfresco/service/projects/someprojectid/refs/master/search').respond(200, testElements);
		$httpBackend.when('PUT', '/alfresco/service/projects/someprojectid/refs/master/search\?extended=true', {}).respond(200, testElements.elements[0]);

		// scope.searchText = "First Element";
		// scope.itemsPerPage = 20;
		// var searchElement = angular.element(template);
		// $compile(searchElement)(scope);
		// // console.log(searchElement);
		// scope.$apply();
		// searchElement.isolateScope().newSearch(scope.searchText, 1, scope.itemsPerPage);
	});

	afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

	it('should search for an element', function() {
		scope.element = {
			mmsProjectId: 'someprojectid',
			mmsRefId: 'master',
			mmsCommitId: '3042934',
			mmsEid: 'firstelementid'
		};
		scope.searchOptions = {};

		element = angular.element('<mms-search mms-options="searchOptions" mms-project-id="{{element.mmsProjectId}}" mms-ref-id="{{element.mmsRefId}}"></mms-search>');
		$compile(element)(scope);

		scope.searchText = "First Element";
		scope.itemsPerPage = 20;

		scope.$apply();

		element.isolateScope().newSearch(scope.searchText, 1, scope.itemsPerPage);
		// console.log(element.html());
		// expect(element.html()).toContain('First Element');
		$httpBackend.flush();
	});

});