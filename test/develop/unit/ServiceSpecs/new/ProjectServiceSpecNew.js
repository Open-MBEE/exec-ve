'use strict';


describe('ProjectService', function () {
	beforeEach(module('mms'));

	var ProjectServiceObj;
	var mockQ, mockURLService, mockCacheService, mockApplicationService;
	var $httpBackend, $rootScope;
	var orgs, projects;

	beforeEach(inject(function ($injector) {
		ProjectServiceObj 		= $injector.get('ProjectService');
		mockQ					= $injector.get('$q');
		mockURLService			= $injector.get('URLService');
		mockCacheService		= $injector.get('CacheService');
		mockApplicationService	= $injector.get('ApplicationService');

		orgs = {
			"orgs": [
				{
					"id": "firstorg",
					"name": "firstorg"
				},
				{
					"id": "secondorg",
					"name": "secondorg"
				}
			]
		}

		projects = {
			"projects": [
			    {
			        "_created": "2017-04-18T14:56:57.635-0700",
			        "_creator": "gandalf",
			        "_elasticId": "elasticId",
			        "_modified": "2017-04-18T14:56:57.635-0700",
			        "_modifier": "gandalf",
			        "_mounts": [],
			        "_projectId": "projectId",
			        "_refId": "master",
			        "categoryId": "",
			        "id": "hereisanid",
			        "name": "youshallnotpass",
			        "orgId": "minesofmoria",
			        "twcId": "",
			        "type": "Project",
			        "uri": "file:/Users/gandalf/Documents/youshallnotpass.mdzip"
			    },
			    {
			        "_created": "2017-04-19T11:31:07.968-0700",
			        "_creator": "admin",
			        "_elasticId": "elasticId2",
			        "_modified": "2017-04-19T11:31:07.968-0700",
			        "_modifier": "admin",
			        "_mounts": [],
			        "_projectId": "projectId2",
			        "_refId": "master",
			        "categoryId": "",
			        "id": "hereisanotherid",
			        "name": "thelonelymountain",
			        "orgId": "Erebor",
			        "twcId": "",
			        "type": "Project",
			        "uri": "file:/Users/admin/Downloads/thelonelymountain.mdzip"
			    }
			]
		}
	});


	it(, function () {

	});
});
