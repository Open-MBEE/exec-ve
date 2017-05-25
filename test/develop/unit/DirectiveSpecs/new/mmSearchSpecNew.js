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

	});

	it('should search for an element', function() {

		// scope.ve_title = 'Some Title';
		// scope.org = 'someorgid';
		// scope.orgs = ['someorgid', 'anotherorgid', 'yetanotherorgid'];
		// scope.project = 'someprojectid';
		// scope.projects = ['someprojectid', 'anotherprojectid', 'yetanotherprojectid'];
		// scope.ref = 'master';
		// scope.branch = 'master';
		// scope.branches = ['master', 'branchfour', 'branchfive', 'branchthree'];
		// scope.tag = 'latest';
		// scope.tags = ['latest', '9304823', '23943'];
		// scope.search = $rootScope.search; 

		// var elementOne = angular.element('<ve-nav mms-title="ve_title" mms-org="org" mms-orgs="orgs" mms-project="project" mms-projects="projects" mms-ref="ref" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-search="search"></ve-nav>');
		// $compile(elementOne)(scope);
		// scope.$apply();

		scope.searchText = 'first element';
		scope.itemsPerPage = 20;
		search = $compile(angular.element('<button class="btn btn-primary" type="button" ng-click="newSearch(searchText, 0, itemsPerPage)"><span class="btn-text">SEARCH</span> <i class="{{searchClass}}"></i></button>'))(scope);
		scope.$apply();

		var searchButton = search.find('button').click();
		// searchButton.triggerHandler('click');

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
		console.log(element.html());
		expect(element.html()).toContain('first element');
		// $httpBackend.flush();
	});

});