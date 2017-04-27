'use strict';

describe('ProjectService', function () {
	beforeEach(module('mms'));

	var ProjectServiceObj;
	var mockQ, mockURLService, mockCacheService, mockApplicationService;
	var $httpBackend, $rootScope;
	var org = {}; 
	var orgs = {};
	var projects = {};
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
			orgs: [
				{
					id 	: "firstorg",
					name: "firstorg"
				}
			]
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

	}));


	describe('Method getOrg', function () {
		it('should return the org object', function () {
			var orgOb;
			var testOrg = orgs.orgs[0];
	        $httpBackend.when('GET', root + '/orgs').respond(orgs);
			ProjectServiceObj.getOrg('firstorg').then(function (data) {
				orgOb = data;
			}, function (reason) {
				orgOb = reason.message;
			});
			$httpBackend.flush();
			expect(orgOb).toEqual(testOrg);
		});
	});

	xdescribe('Method getOrgs', function () {

	});

	describe('Method getProjects', function () {
		it('should return an object of projects', function () {
			var projectsOb;
			var testProjects = projects.projects;
			$httpBackend.when('GET', root + '/projects').respond(projects);
			ProjectServiceObj.getProjects('secondorg').then(function (data) {
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
			$httpBackend.when('GET', root + '/projects').respond(
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

	xdescribe('Method getRefs', function () {

	});

	xdescribe('Method getRef', function () {

	});

	xdescribe('Method createRef', function () {

	});

	xdescribe('Method updateRef', function () {

	});

	xdescribe('Method deleteRef', function () {

	});

	xdescribe('Method getGroups', function () {

	});

	xdescribe('Method getGroup', function () {

	});

	xdescribe('Method diff', function () { //not implemented

	});

	xdescribe('Method merge', function () { //not implemented

	});

	xdescribe('Method reset', function () {

	});
});
