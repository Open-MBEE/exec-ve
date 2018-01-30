'use strict';

xdescribe('Directive: mmsDiffAttr', function() {

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
					documentation: "",
					_commitId: "latest",
					_creator: "merp",
					_created: "2017-05-09T17:12:17.165-0700",
					name: "First Element",
					_projectId: "someprojectid"	
				},
				{
					_modifier: "merp", //same as element above, but added text in documentation
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
					_modifier: "merp", //same as element above, but deleted text in documentation
					id: "firstelementid",
					_modified: "2017-05-21T13:22:31.614-0700",
					_refId: "master",
					documentation: "",
					_commitId: "320940234",
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
					_modifier: "someperson", //same as above, but different refs
					id: "secondelementid",
					_modified: "2017-05-02T13:22:31.614-0700",
					_refId: "somebranch",
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
				},
				{
					_modifier: "anotherperson", //same as above, different commits
					id: "thirdelementid",
					_modified: "2017-04-01T13:22:31.614-0700",
					_refId: "branchthree",
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
					_refId: "branchfour",
					documentation: "<p>This the fourth element in the array!</p>",
					_commitId: "93028590959",
					_creator: "merp",
					_created: "2017-05-20T17:12:17.165-0700",
					name: "Fourth Element",
					_projectId: "anotherprojectid"	
				},
				{
					_modifier: "anotherperson",
					id: "fifthelementid",
					_modified: "2017-04-01T13:22:31.614-0700",
					_refId: "branchfive",
					documentation: "<p>This the fifth element in the array!</p>",
					_commitId: "latest",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Fifth Element",
					_projectId: "yetanotherprojectid"	
				},
				{
					_modifier: "anotherperson",
					id: "sixthelementid",
					_modified: "2017-04-01T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the sixth element in the array!</p>",
					_commitId: "latest",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Sixth Element",
					_projectId: "yetanotherprojectid"	
				},
				{
					_modifier: "anotherperson",
					id: "seventhelementid",
					_modified: "2017-04-01T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the seventh element in the array!</p>",
					_commitId: "latest",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Seventh Element",
					_projectId: "nthprojectid"	
				},
				{
					_modifier: "anotherperson",
					id: "eighthelementid",
					_modified: "2017-04-02T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the eighth element in the array!</p>",
					_commitId: "89798989897",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Eighth Element",
					_projectId: "nthprojectid"	
				},
				{
					_modifier: "anotherperson",
					id: "eighthelementid",
					_modified: "2017-04-03T13:22:31.614-0700",
					_refId: "master",
					documentation: "<p>This the eighth element in the array!</p>",
					_commitId: "latest",
					_creator: "merp",
					_created: "2017-03-01T17:12:17.165-0700",
					name: "Eighth Element",
					_projectId: "nthprojectid"	
				}
			]
		};

		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[0]._projectId +'/refs/' + testElements.elements[0]._refId + '/elements/' + testElements.elements[0].id).respond(200, testElements.elements[0]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[1]._projectId +'/refs/' + testElements.elements[1]._refId + '/elements/' + testElements.elements[1].id + '?commitId=' + testElements.elements[1]._commitId).respond(200, testElements.elements[1]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[2]._projectId +'/refs/' + testElements.elements[2]._refId + '/elements/' + testElements.elements[2].id + '?commitId=' + testElements.elements[2]._commitId).respond(200, testElements.elements[2]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[3]._projectId +'/refs/' + testElements.elements[3]._refId + '/elements/' + testElements.elements[3].id + '?commitId=' + testElements.elements[3]._commitId).respond(200, testElements.elements[3]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[4]._projectId +'/refs/' + testElements.elements[4]._refId + '/elements/' + testElements.elements[4].id + '?commitId=' + testElements.elements[4]._commitId).respond(200, testElements.elements[4]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[5]._projectId +'/refs/' + testElements.elements[5]._refId + '/elements/' + testElements.elements[5].id + '?commitId=' + testElements.elements[5]._commitId).respond(200, testElements.elements[5]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[6]._projectId +'/refs/' + testElements.elements[6]._refId + '/elements/' + testElements.elements[6].id + '?commitId=' + testElements.elements[6]._commitId).respond(200, testElements.elements[6]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[7]._projectId +'/refs/' + testElements.elements[7]._refId + '/elements/' + testElements.elements[7].id + '?commitId=' + testElements.elements[7]._commitId).respond(200, testElements.elements[7]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[8]._projectId +'/refs/' + testElements.elements[8]._refId + '/elements/' + testElements.elements[8].id).respond(200, testElements.elements[8]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[9]._projectId +'/refs/' + testElements.elements[9]._refId + '/elements/' + testElements.elements[9].id).respond(200, testElements.elements[9]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[10]._projectId +'/refs/' + testElements.elements[10]._refId + '/elements/' + testElements.elements[10].id).respond(200, testElements.elements[10]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[11]._projectId +'/refs/' + testElements.elements[11]._refId + '/elements/' + testElements.elements[11].id + '?commitId=' + testElements.elements[11]._commitId).respond(200, testElements.elements[11]);
		$httpBackend.when('GET', '/alfresco/service/projects/'+ testElements.elements[12]._projectId +'/refs/' + testElements.elements[12]._refId + '/elements/' + testElements.elements[12].id + '?commitId=' + testElements.elements[12]._commitId).respond(200, testElements.elements[12]);
	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should compare Same Project, Different Refs, Same Commit', function() {
		scope.elementOne = {
			mmsEidOne: "fifthelementid",
			mmsRefOneId: "branchfive",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "yetanotherprojectid"		 
		};
		scope.elementTwo = {
			mmsEidTwo: "sixthelementid",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "yetanotherprojectid"
		};

		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Same Project, Same Refs, Same Commit', function() {
		scope.elementOne = {
			mmsEidOne: "fifthelementid",
			mmsRefOneId: "branchfive",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "yetanotherprojectid"		 
		};
		scope.elementTwo = {
			mmsEidTwo: "fifthelementid",
			mmsRefTwoId: "branchfive",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "yetanotherprojectid"		 
		};

		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});


	it('should compare Same Project, Ref Two does not exist, Same Commit', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "fifthelementid",
			mmsRefOneId: "branchfive",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "yetanotherprojectid"		 
		};
		scope.elementTwo = {
			mmsEidTwo: "fifthelementid",
			mmsRefTwoId: "thisrefdoesntexist",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "yetanotherprojectid"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementTwo.mmsProjectTwoId + '/refs/' + scope.elementTwo.mmsRefTwoId + '/elements/' + scope.elementTwo.mmsEidTwo).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Same Project, Ref One does not exist, Same Commit', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "fifthelementid",
			mmsRefOneId: "thisrefdoesntexist",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "yetanotherprojectid"
		};
		scope.elementTwo = {
			mmsEidTwo: "fifthelementid",
			mmsRefTwoId: "branchfive",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "yetanotherprojectid"		 
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementOne.mmsProjectOneId + '/refs/' + scope.elementOne.mmsRefOneId + '/elements/' + scope.elementOne.mmsEidOne).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Same Project, Same Refs, Different Commits', function() {
		scope.elementOne = {
			mmsEidOne: "thirdelementid",
			mmsRefOneId: "branchthree",
			mmsCommitOneId: "3902839085",
			mmsProjectOneId: "someprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "thirdelementid",
			mmsRefTwoId: "branchthree",
			mmsCommitTwoId: "6895048690",
			mmsProjectTwoId: "someprojectid"
		};

		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Same Project, Same Refs, Commit One does not exist', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "thirdelementid",
			mmsRefOneId: "branchthree",
			mmsCommitOneId: "thiscommitdoesntexist",
			mmsProjectOneId: "someprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "thirdelementid",
			mmsRefTwoId: "branchthree",
			mmsCommitTwoId: "6895048690",
			mmsProjectTwoId: "someprojectid"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementOne.mmsProjectOneId + '/refs/' + scope.elementOne.mmsRefOneId + '/elements/' + scope.elementOne.mmsEidOne + '?commitId=' + scope.elementOne.mmsCommitOneId).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Same Project, Same Refs, Both Commits do not exist', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "thirdelementid",
			mmsRefOneId: "branchthree",
			mmsCommitOneId: "thiscommitdoesntexist",
			mmsProjectOneId: "someprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "thirdelementid",
			mmsRefTwoId: "branchthree",
			mmsCommitTwoId: "thiscommitdoesntexisteither",
			mmsProjectTwoId: "someprojectid"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementOne.mmsProjectOneId + '/refs/' + scope.elementOne.mmsRefOneId + '/elements/' + scope.elementOne.mmsEidOne + '?commitId=' + scope.elementOne.mmsCommitOneId).respond({status: 404, message: "" });
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementTwo.mmsProjectTwoId + '/refs/' + scope.elementTwo.mmsRefTwoId + '/elements/' + scope.elementTwo.mmsEidTwo + '?commitId=' + scope.elementTwo.mmsCommitTwoId).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Different Projects, Same Refs, Same Commits', function() {
		scope.elementOne = {
			mmsEidOne: "sixthelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "yetanotherprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "seventhelementid",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "nthprojectid"
		};

		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Project One Does Not Exist, Same Refs, Same Commits', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "sixthelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "thisprojectdoesntexist"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "seventhelementid",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "nthprojectid"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementOne.mmsProjectOneId + '/refs/' + scope.elementOne.mmsRefOneId + '/elements/' + scope.elementOne.mmsEidOne).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Project Two Does Not Exist, Same Refs, Same Commits', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "sixthelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "yetanotherprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "seventhelementid",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "thisprojectdoesntexist"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementTwo.mmsProjectTwoId + '/refs/' + scope.elementTwo.mmsRefTwoId + '/elements/' + scope.elementTwo.mmsEidTwo).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Both Projects do not exist, Same Refs, Same Commits', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "sixthelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "latest",
			mmsProjectOneId: "thisprojectdoesntexist"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "seventhelementid",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "thisprojectdoesntexisteither"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementOne.mmsProjectOneId + '/refs/' + scope.elementOne.mmsRefOneId + '/elements/' + scope.elementOne.mmsEidOne).respond({status: 404, message: "" });
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementTwo.mmsProjectTwoId + '/refs/' + scope.elementTwo.mmsRefTwoId + '/elements/' + scope.elementTwo.mmsEidTwo).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Element is New', function() {
		scope.elementOne = {
			mmsEidOne: "firstelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "9028490394",
			mmsProjectOneId: "someprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "firstelementid",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "someprojectid"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementOne.mmsProjectOneId + '/refs/' + scope.elementOne.mmsRefOneId + '/elements/' + scope.elementOne.mmsEidOne + '?commitId=' + scope.elementOne.mmsCommitOneId).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Element is Deleted', function() {
		scope.elementOne = {
			mmsEidOne: "eighthelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "89798989897",
			mmsProjectOneId: "nthprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "eighthelementid",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "latest",
			mmsProjectTwoId: "nthprojectid"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementTwo.mmsProjectTwoId + '/refs/' + scope.elementTwo.mmsRefTwoId + '/elements/' + scope.elementTwo.mmsEidTwo).respond({status: 200, message: "[ERROR]: Element MMS_1493917957356_969a3e36-f1e0-461d-9a24-c6b6f815cc84 is deleted"});
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});

	it('should compare Element Does Not Exist', function() { //expected error
		scope.elementOne = {
			mmsEidOne: "firstelementid",
			mmsRefOneId: "master",
			mmsCommitOneId: "3042934",
			mmsProjectOneId: "someprojectid"	 
		};
		scope.elementTwo = {
			mmsEidTwo: "thiselementdoesnotexist",
			mmsRefTwoId: "master",
			mmsCommitTwoId: "320940234",
			mmsProjectTwoId: "someprojectid"
		};
		$httpBackend.expect('GET', '/alfresco/service/projects/' + scope.elementTwo.mmsProjectTwoId + '/refs/' + scope.elementTwo.mmsRefTwoId + '/elements/' + scope.elementTwo.mmsEidTwo + '?commitId=' + scope.elementTwo.mmsCommitTwoId).respond({status: 404, message: "" });
		element = angular.element('<mms-diff-attr mms-project-one-id="{{elementOne.mmsProjectOneId}}" mms-project-two-id="{{elementTwo.mmsProjectTwoId}}" mms-eid-one="{{elementOne.mmsEidOne}}" mms-eid-two="{{elementTwo.mmsEidTwo}}" mms-ref-one-id="{{elementOne.mmsRefOneId}}" mms-ref-two-id="{{elementTwo.mmsRefTwoId}}" mms-commit-one-id="{{elementOne.mmsCommitOneId}}" mms-commit-two-id="{{elementTwo.mmsCommitTwoId}}"></mms-diff-attr>');
		$compile(element)(scope);
		scope.$apply();
		$httpBackend.flush();
	});
});