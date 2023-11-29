'use strict';

describe('ProjectService', function () {
	beforeEach(module('mms'));

	var ProjectServiceObj;
	var mockQ, mockURLService, mockCacheService, mockApplicationService;
	var $httpBackend, $window;
	var org = {}; 
	var orgs = {};
	var ref = {};
	var refs = {};
	var projects = {};
	var groups = {};
	var requestHandler;

	var root = '/alfresco/service';

	beforeEach(inject(function ($injector) {
		$httpBackend			= $injector.get('$httpBackend');
		ProjectServiceObj 		= $injector.get('ProjectService');
		mockQ					= $injector.get('$q');
		mockURLService			= $injector.get('URLService');
		mockCacheService		= $injector.get('CacheService');
		mockApplicationService	= $injector.get('ApplicationService');

		org = {
			id 	: "firstorg",
			name: "firstorg"
		}
		orgs = {
			orgs: [
				{
					id 	: "firstorg",
					name: "firstorg"
				},
				{
					id 	: "secondorg",
					name: "secondorg"
				}
			]
		}
		projects = {
			projects: [
			    {
			        _created	: "2017-04-18T14:56:57.635-0700",
			        _creator	: "gandalf",
			        _elasticId	: "elasticId",
			        _modified	: "2017-04-18T14:56:57.635-0700",
			        _modifier	: "gandalf",
			        _mounts		: [],
			        _projectId	: "projectId",
			        _refId		: "master",
			        categoryId	: "",
			        id 			: "hereisanid",
			        name		: "youshallnotpass",
			        orgId 		: "minesofmoria",
			        twcId 		: "",
			        type 		: "Project",
			        uri 		: "file:/Users/gandalf/Documents/youshallnotpass.mdzip"
			    },
			    {
			        _created 	: "2017-04-19T11:31:07.968-0700",
			        _creator	: "admin",
			        _elasticId	: "elasticId2",
			        _modified	: "2017-04-19T11:31:07.968-0700",
			        _modifier	: "admin",
			        _mounts		: [],
			        _projectId	: "projectId2",
			        _refId 		: "master",
			        categoryId 	: "",
			        id 			: "hereisanotherid",
			        name 		: "thelonelymountain",
			        orgId 		: "Erebor",
			        twcId 		: "",
			        type 		: "Project",
			        uri 		: "file:/Users/admin/Downloads/thelonelymountain.mdzip"
			    }
			]
		}
		ref = [{
			_elasticId: "refelastic3",
			id: "thirdref",
			name: "thirdref"
		}]
		refs = {
			refs: [
				{
					_elasticId: "refelastic1",
					id: "master",
					name: "master"
				},
				{
					_elasticId: "refelastic2",
					id: "secondref",
					name: "secondref"
				}
			]
		}
		groups = {
			groups: [
				{
					_name: "group1",
					_parentId: "groupparent1",
					id: "groups1id"
				},
				{
					_name: "groups2",
					_parentId: "groupsparent2",
					id: "group2id"
				}
			]
		}

	}));

	afterEach(function () {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	describe('Method getOrgs', function () {
		it('should return the orgs', function() {
			var orgsOb;
			var testOrgs = [
				{
					id 	: "firstorg",
					name: "firstorg"
				},
				{
					id 	: "secondorg",
					name: "secondorg"
				}
			];
			$httpBackend.when('GET', root + '/orgs').respond(orgs);
			ProjectServiceObj.getOrgs().then(function (data) {
				orgsOb = data;
			}, function (reason) {
				orgsOb = reason.message;
			});
			$httpBackend.flush();
			expect(orgsOb).toEqual(testOrgs);
		});
	});

	describe('Method getOrg', function () {
		it('should return the org object', function () {
			var orgOb;
			var testOrg = orgs.orgs[0];
	        requestHandler = $httpBackend.when('GET', root + '/orgs').respond(orgs);
			ProjectServiceObj.getOrg('firstorg').then(function (data) {
				orgOb = data;
			}, function (reason) {
				orgOb = reason.message;
			});
			$httpBackend.flush();
			expect(orgOb).toEqual(testOrg);
		});
	});

	describe('Method getProjects', function () { //why is ProjectService changing the orgId in the json??
		it('should return an object of projects', function () {
			var projectsOb;
			var testProjects = [
			    {
			        _created	: "2017-04-18T14:56:57.635-0700",
			        _creator	: "gandalf",
			        _elasticId	: "elasticId",
			        _modified	: "2017-04-18T14:56:57.635-0700",
			        _modifier	: "gandalf",
			        _mounts		: [],
			        _projectId	: "projectId",
			        _refId		: "master",
			        categoryId	: "",
			        id 			: "hereisanid",
			        name		: "youshallnotpass",
			        orgId 		: "minesofmoria",
			        twcId 		: "",
			        type 		: "Project",
			        uri 		: "file:/Users/gandalf/Documents/youshallnotpass.mdzip"
			    },
			    {
			        _created 	: "2017-04-19T11:31:07.968-0700",
			        _creator	: "admin",
			        _elasticId	: "elasticId2",
			        _modified	: "2017-04-19T11:31:07.968-0700",
			        _modifier	: "admin",
			        _mounts		: [],
			        _projectId	: "projectId2",
			        _refId 		: "master",
			        categoryId 	: "",
			        id 			: "hereisanotherid",
			        name 		: "thelonelymountain",
			        orgId 		: "minesofmoria",
			        twcId 		: "",
			        type 		: "Project",
			        uri 		: "file:/Users/admin/Downloads/thelonelymountain.mdzip"
			    }
			];
			$httpBackend.when('GET', root + '/orgs/minesofmoria/projects').respond(
	            function (method, url, data) {
	                return [200, projects];
	            }
        	);
			ProjectServiceObj.getProjects('minesofmoria').then(function (data) {
				projectsOb = data;
			}, function (reason) {
				projectsOb = reason.message;
			});
			$httpBackend.flush();
			expect(projectsOb).toEqual(testProjects);
		});
	});

	describe('Method getProject', function () {
		it('should return the project object', function () {
			var projectOb;
			var testProject = projects.projects[0];
			$httpBackend.when('GET', root + '/projects/hereisanid').respond(
				function (method, url, data) {
					return [200, projects];
			});
			ProjectServiceObj.getProject('hereisanid').then(function (data) {
				projectOb = data;
			}, function (reason) {
				projectOb = reason.message;
			});
			$httpBackend.flush();
			expect(projectOb).toEqual(testProject);
		});
	});

	describe('Method getRefs', function () {
		it('should return all the refs in the project', function () {
			var refsOb;
			var testRefs = [
				{
					_elasticId: "refelastic1",
					id: "master",
					name: "master",
					type: "Branch"
				},
				{
					_elasticId: "refelastic2",
					id: "secondref",
					name: "secondref"
				}
				];
			$httpBackend.when('GET', root + '/projects/hereisanid/refs').respond(
				function (method, url, data) {
					return [200, refs];
			});
			ProjectServiceObj.getRefs('hereisanid').then(function (data) {
				refsOb = data;
			}, function (reason) {
				refsOb = reason.message;
			});
			$httpBackend.flush();
			expect(refsOb).toEqual(testRefs);
		});
	});

	describe('Method getRef', function () {
		it('should return a ref from the project', function () {
			var refOb;
			var testRef = refs.refs[1];
			$httpBackend.when('GET', root + '/projects/hereisanid/refs').respond(
				function (method, url, data) {
					return [200, refs];
			});
			ProjectServiceObj.getRef('secondref', 'hereisanid').then(function (data) {
				refOb = data;
			}, function (reason) {
				refOb = reason.message;
			});
			$httpBackend.flush();
			expect(refOb).toEqual(testRef);
		});
	});

	describe('Method createRef', function () {
		it('should create a ref', function() {
			var refOb;
			var testRef = {
				_elasticId: "refelastic3",
				id: "thirdref",
				name: "thirdref"
			};
			var elemOb = {};
			elemOb.refs = [testRef];
			elemOb.source = mockApplicationService.getSource();

			$httpBackend.expectPOST(root + '/projects/hereisanid/refs', elemOb).respond(200, elemOb);
			ProjectServiceObj.createRef(testRef, 'hereisanid').then(function (data) {
				refOb = data;
			}, function (reason) {
				refOb = reason.message;
			});
			$httpBackend.flush();
			expect(refOb).toEqual(testRef);
		});
	});

	describe('Method updateRef: do not need to test', function () { //no need to test
	});

	describe('Method deleteRef: do not need to test', function () { //not going to work
	});

	describe('Method getGroups', function () {
		it('should return all groups from a project', function () {
			var groupsOb;
			var testGroups = [
				{
					_name: "group1",
					_parentId: "groupparent1",
					id: "groups1id"
				},
				{
					_name: "groups2",
					_parentId: "groupsparent2",
					id: "group2id"
				}
			];
			$httpBackend.when('GET', root + '/projects/hereisanid/refs/master/groups').respond(
				function (method, url, data) {
					return [200, groups];
			});
			ProjectServiceObj.getGroups('hereisanid', 'master').then(function (data) {
				groupsOb = data;
			}, function (reason) {
				groupsOb = reason.message;
			});
			$httpBackend.flush();
			expect(groupsOb).toEqual(testGroups);
		});
	});

	describe('Method getGroup', function () {
		it('should return a group from a project', function () {
			var groupOb;
			var testGroup = groups.groups[1];
			$httpBackend.when('GET', root + '/projects/hereisanid/refs/master/groups').respond(
				function (method, url, data) {
					return [200, groups];
			});
			ProjectServiceObj.getGroup('group2id','hereisanid','master').then(function (data) {
				groupOb = data;
			}, function (reason) {
				groupOb = reason.message;
			});
			$httpBackend.flush();
			expect(groupOb).toEqual(testGroup);
		});
	});

	describe('Method diff: do not need to test', function () { 
	});

	describe('Method merge: do not need to test', function () { 
	});

	describe('Method reset: do not need to test', function () { 
	});
});
