/*
'use strict';

//jasmine specs for services go here 

describe('service', function() {
    var URLService, SiteService, $httpBackend;

    beforeEach(module('mms'));

    beforeEach(inject(function($injector) {
        URLService = $injector.get('URLService');
        SiteService = $injector.get('SiteService');
        $httpBackend = $injector.get('$httpBackend');

    }));

    it('isTimestamp', function() {
        expect(URLService.isTimestamp('123')).toBe(false);
    });

    it('getSiteEuropa', function() {
        $httpBackend.whenGET('/alfresco/service/rest/sites').respond([
            {name: 'europa', title: 'Europa'}
        ]);
        SiteService.getSite('europa').then(function(site) {
            expect(site).toEqual({name: 'europa', title: 'Europa'});
        });
        $httpBackend.flush();
    });
});
*/

'use strict';

/* jasmine specs for services go here */

describe('service', function() {
  beforeEach(module('myApp.services'));


  describe('version', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});

// CommentService - (done), [4 empty]
describe('CommentService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the CommentService', inject(function() {
		expect(CommentService).toBeDefined();

		expect(CommentService.addComment).not.toBe(null);
		expect(CommentService.getComments).not.toBe(null);
		expect(CommentService.updateComment).not.toBe(null);
		expect(CommentService.deleteComment).not.toBe(null);
	}));

	it('addComment', inject(function() {}));

	it('getComments', inject(function() {}));

	it('updateComment', inject(function() {}));

	it('deleteComment', inject(function() {}));
});

// ConfigService - incomplete, 10 methods, [4 $http tested, 1 unknown, 5 $http untested]
describe('ConfigService', function() {
	beforeEach(module('mms'));

	var workspace = 'master';

	var ConfigService, $httpBackend;

	var products = {"products": [
	  {
	    "author": "kerzhner",
	    "lastModified": "2014-07-15T09:42:55.896-0700",
	    "name": "MDK Manual",
	    "qualifiedName": "/////Architectural Patterns & Examples/_17_0_2_3_8660276_1391623405097_989020_66206/MDK Manual",
	    "documentation": "<p><mms-transclude-com data-mms-eid=\"MMS_1405434431200_84583f43-955b-417f-890a-907b80b87161\">comment:cldelp<\/mms-transclude-com> <\/p>",
	    "sysmlid": "_17_0_2_3_e9f034d_1384298224245_406810_82668",
	    "owner": "_66206",
	    "read": "2014-07-18T15:48:28.160-0700",
	    "specialization": {
	      "displayedElements": ["_82668"],
	      "view2view": [
	        { "id": "_64209", "childrenViews": [] },
	        { "id": "_85232", "childrenViews": [] },
	        { "id": "_68313", "childrenViews": [] },
	        { "id": "_63686", "childrenViews": [] },
	        { "id": "_65764", "childrenViews": [ "MMS_1405373440109_7e6315b8-09ac-475e-b2eb-e295d79c5cfb" ] },
	        { "id": "_57979", "childrenViews": [] },
	        { "id": "_57876", "childrenViews": [ "_58325", "_60135" ] },
	        { "id": "_64146", "childrenViews": [] },
	        { "id": "_58448", "childrenViews": [ "_57507", "_57546", "_57876" ] },
	        { "id": "_68542", "childrenViews": [ "_82613", "_84397", "_71850", "_71922", "_71966" ] },
	        { "id": "_63084", "childrenViews": [ "_64146", "_64218" ] },
	        { "id": "_63842", "childrenViews": [] },
	        { "id": "_64595", "childrenViews": [] },
	        { "id": "_63766", "childrenViews": [] },
	        { "id": "_69116", "childrenViews": [ "_79604", "_85232", "_80021" ] },
	        { "id": "_80021", "childrenViews": [] },
	        { "id": "_64694", "childrenViews": [] },
	        { "id": "_57916", "childrenViews": [] },
	        { "id": "_58019", "childrenViews": [ "_58243", "_58306", "_58369" ] },
	        { "id": "_64218", "childrenViews": [] },
	        { "id": "_66680", "childrenViews": [] },
	        { "id": "_58243", "childrenViews": [] },
	        { "id": "_58325", "childrenViews": [ "_57939", "_57980", "_58019" ] },
	        { "id": "_63803", "childrenViews": [] },
	        { "id": "_64122", "childrenViews": [] },
	        { "id": "_66812", "childrenViews": ["_65193"] },
	        { "id": "_82574", "childrenViews": [ "_84485", "_63766", "_67950", "_68051" ] },
	        { "id": "_58369", "childrenViews": [] },
	        { "id": "_71966", "childrenViews": [] },
	        { "id": "_66253", "childrenViews": [] },
	        { "id": "_96446", "childrenViews": [ "_64122", "_64383", "_64519", "_64633", "_68313", "_64557", "_64595", "_66620", "_66680", "_66740", "_66517" ] },
	        { "id": "_84485", "childrenViews": [] },
	        { "id": "_57833", "childrenViews": [] }, { "id": "_57750", "childrenViews": [] },
	        { "id": "_58130", "childrenViews": [ "_58605", "_58644" ] },
	        { "id": "_67487", "childrenViews": [] },
	        { "id": "_97891", "childrenViews": [] },
	        { "id": "_68051", "childrenViews": [] },
	        { "id": "_95516", "childrenViews": [] },
	        { "id": "_57789", "childrenViews": [] },
	        { "id": "_65193", "childrenViews": [] },
	        { "id": "_66992", "childrenViews": ["_67487"] }, 
	        { "id": "_95607", "childrenViews": [] },
	        { "id": "_96498", "childrenViews": [] },
	        { "id": "_64633", "childrenViews": [] },
	        { "id": "_95650", "childrenViews": [] },
	        { "id": "_57939", "childrenViews": [ "_57833", "_63257", "_63569", "_63608", "_63647", "_63686", "_63725", "_63764", "_63803", "_63842" ] },
	        { "id": "_63534", "childrenViews": [ "_63624", "_63084" ] },
	        { "id": "_67950", "childrenViews": [ "_64694", "_66992" ] },
	        { "id": "_63647", "childrenViews": ["_62517"] },
	        { "id": "_58113", "childrenViews": [] },
	        { "id": "_95855", "childrenViews": [] },
	        { "id": "_64517", "childrenViews": [] },
	        { "id": "_63624", "childrenViews": [] },
	        { "id": "_62517", "childrenViews": [] },
	        { "id": "_79604", "childrenViews": [] },
	        { "id": "_68132", "childrenViews": [] },
	        { "id": "_95710", "childrenViews": [ "_95754", "_95607", "_96446", "_68430" ] },
	        { "id": "_58605", "childrenViews": [] }, 
	        { "id": "_57507", "childrenViews": [] },
	        { "id": "_57792", "childrenViews": [] },
	        { "id": "_58286", "childrenViews": [] },
	        { "id": "_63764", "childrenViews": [] },
	        { "id": "_63569", "childrenViews": [] },
	        { "id": "_82958", "childrenViews": [ "_95710", "_95560", "_95944", "_95516", "_95650", "_96498", "_105372" ] },
	        { "id": "_63257", "childrenViews": [] },
	        { "id": "_64519", "childrenViews": [] },
	        { "id": "_82613", "childrenViews": [] },
	        { "id": "_84397", "childrenViews": [] },
	        { "id": "_57980", "childrenViews": [ "_57792", "_57916", "_57979", "_58113", "_58176" ] },
	        { "id": "_58169", "childrenViews": [] },
	        { "id": "_58644", "childrenViews": [] },
	        { "id": "_66517", "childrenViews": [] },
	        { "id": "_64383", "childrenViews": [] },
	        { "id": "_57546", "childrenViews": [ "_57750", "_57789" ] },
	        { "id": "_58306", "childrenViews": [] },
	        { "id": "_64557", "childrenViews": [] },
	        { "id": "_58247", "childrenViews": [] },
	        { "id": "_60135", "childrenViews": [ "_58130", "_58169", "_58286", "_58247" ] },
	        { "id": "_66740", "childrenViews": [] },
	        { "id": "_82668", "childrenViews": [ "_65764", "_82574", "_58448", "_68087", "_68542", "_82958", "_63534" ] },
	        { "id": "_71850", "childrenViews": [] },
	        { "id": "_68430", "childrenViews": [] },
	        { "id": "_66620", "childrenViews": [] },
	        { "id": "_63608", "childrenViews": [] },
	        { "id": "_95804", "childrenViews": [] },
	        { "id": "_63725", "childrenViews": [] },
	        { "id": "_95754", "childrenViews": [] },
	        { "id": "_58176", "childrenViews": [] },
	        { "id": "_68087", "childrenViews": [ "_64517", "_68132", "_66253", "_64209" ] },
	        { "id": "_105372", "childrenViews": [] },
	        { "id": "_95560", "childrenViews": [ "_95897", "_95855", "_95804" ] },
	        { "id": "_95897", "childrenViews": [] },
	        { "id": "_95944", "childrenViews": [ "_69116", "_97891", "_66812" ] },
	        { "id": "_71922", "childrenViews": [] },
	        { "id": "MMS_1405373440109_7e6315b8-09ac-475e-b2eb-e295d79c5cfb", "childrenViews": [] }
	      ],
	      "allowedElements": ["_82668"],
	      "contains": [{
	        "sourceType": "reference",
	        "source": "_82668",
	        "sourceProperty": "documentation",
	        "type": "Paragraph"
	      }],
	      "noSections": ["_67487"],
	      "type": "View"
	    },
	    "editable": false
	  },
	  {
	    "author": "dcoren",
	    "lastModified": "2014-07-14T14:34:11.442-0700",
	    "name": "EMS Application Manuals",
	    "qualifiedName": "/////Architectural Patterns & Examples/_66206/EMS Application Manuals",
	    "documentation": "",
	    "sysmlid": "_69133",
	    "owner": "_66206",
	    "read": "2014-07-18T15:48:28.178-0700",
	    "specialization": {
	      "displayedElements": ["_69133"],
	      "view2view": [
	        { "id": "_114871", "childrenViews": [] },
	        { "id": "_66337", "childrenViews": [] },
	        { "id": "_64386", "childrenViews": [ "_68984", "_71086", "_71128", "_47762", "_56051", "_56074" ] },
	        { "id": "_64383", "childrenViews": [ "_69801", "_64303" ] },
	        { "id": "_74394", "childrenViews": [] },
	        { "id": "_112660", "childrenViews": [] },
	        { "id": "_69801", "childrenViews": [] },
	        { "id": "_64303", "childrenViews": [] },
	        { "id": "_71128", "childrenViews": [ "_112660", "_114871" ] },
	        { "id": "_71086", "childrenViews": [] },
	        { "id": "_47762", "childrenViews": [] },
	        { "id": "_68984", "childrenViews": [] },
	        { "id": "_67194", "childrenViews": [ "_66319", "_66322", "_66337", "_66340" ] },
	        { "id": "_64385", "childrenViews": [] },
	        { "id": "_69923", "childrenViews": [] },
	        { "id": "_69977", "childrenViews": [] },
	        { "id": "_69133", "childrenViews": [ "_67194", "_59326" ] },
	        { "id": "_56074", "childrenViews": [] },
	        { "id": "_64384", "childrenViews": [] },
	        { "id": "_66322", "childrenViews": [] },
	        { "id": "_105062", "childrenViews": [ "_64384", "_69923" ] },
	        { "id": "_69192", "childrenViews": [ "_64385", "_64386" ] },
	        { "id": "_59326", "childrenViews": [ "_69192", "_105062", "_69977", "_74394", "_64383" ] },
	        { "id": "_66340", "childrenViews": [] },
	        { "id": "_56051", "childrenViews": [] },
	        { "id": "_66319", "childrenViews": [] }
	      ],
	      "allowedElements": ["_69133"],
	      "contains": [{
	        "sourceType": "reference",
	        "source": "_69133",
	        "sourceProperty": "documentation",
	        "type": "Paragraph"
	      }],
	      "noSections": [],
	      "type": "View"
	    },
	    "editable": false
	  }
	]};

	var configurations = {configurations: [{
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "Some description",
					name: "Some name",
					modified: "2014-07-14T16:43:07.752-0700"
	}]};

	beforeEach(inject(function($injector) {
        ConfigService = $injector.get('ConfigService');
        $httpBackend = $injector.get('$httpBackend');

        $httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations').respond(configurations);

    // posting error?
        $httpBackend.whenPOST('/alfresco/service/workspaces/master/sites/ems-support/configurations').respond({
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "New description",
					name: "New name",
					modified: "2014-07-21T14:25:07.752-0700"
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations/af927dcb753f').respond({
			configurations: [
				{
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "Some description",
					name: "Some name",
					modified: "2014-07-14T16:43:07.752-0700"
				}
			]
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations/af927dcb753f/products').respond(products);

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/configurations/af927dcb753f/snapshots').respond("");

		$httpBackend.whenGET('/alfresco/service/workspaces/master/sites/ems-support/products/_69133/snapshots').respond({"snapshots": [{
		  "id": "_17_0_2_3_8660276_1391133273620_303350_69133_1405373651222",
		  "created": "2014-07-14T14:34:11.223-0700",
		  "sysmlid": "_17_0_2_3_8660276_1391133273620_303350_69133",
		  "sysmlname": "EMS Application Manuals",
		  "configurations": [],
		  "creator": "dcoren"
		}]});


    }));

	it('can get an instance of the ConfigService', inject(function() {
		expect(ConfigService).toBeDefined();

		expect(ConfigService.getSiteConfigs).not.toBe(null);
		expect(ConfigService.getConfig).not.toBe(null);
		expect(ConfigService.getConfigProducts).not.toBe(null);
		expect(ConfigService.getConfigProducts).not.toBe(null);
		expect(ConfigService.getConfigSnapshots).not.toBe(null);
		expect(ConfigService.updateConfig).not.toBe(null);
		expect(ConfigService.createConfig).not.toBe(null);
		expect(ConfigService.updateConfigSnapshots).not.toBe(null);
		expect(ConfigService.updateConfigProducts).not.toBe(null);
		expect(ConfigService.createSnapshots).not.toBe(null);
	}));

	// accesses $http - √
	it('getSiteConfigs', inject(function() {

		ConfigService.getSiteConfigs('ems-support', 'master').then(function(data) {
			expect(data[0]).toEqual({
				id: "af927dcb753f",
				timestamp: "2014-07-14T16:43:07.747-0700",
				description: "Some description",
				name: "Some name",
				modified: "2014-07-14T16:43:07.752-0700"
			});
		});

		$httpBackend.flush();
	}));

	// accesses $http - √
	it('getConfig', inject(function() {

		ConfigService.getConfig('ems-support', 'master', 'af927dcb753f').then(function(data) {
			expect(data[0]).toEqual({
				id: "af927dcb753f",
				timestamp: "2014-07-14T16:43:07.747-0700",
				description: "Some description",
				name: "Some name",
				modified: "2014-07-14T16:43:07.752-0700"
			});

			$httpBackend.flush();
		});

	}));

	// accesses $http - √
	it('getConfigProducts', inject(function() {

		ConfigService.getConfigProducts('af927dcb753f', 'ems-support', 'master').then(function(data) {
			expect(data).toEqual(products);

			$httpBackend.flush();
		});

	}));

	// accesses $http - untested
	it('getConfigSnapshots', inject(function() {

		
	}));

	// accesses $http - √
	it('getProductSnapshots', inject(function() {

		ConfigService.getConfigSnapshots('_69133', 'ems-support', 'master').then(function(data) {
			expect(data).toEqual({"snapshots": [{
			  "id": "_17_0_2_3_8660276_1391133273620_303350_69133_1405373651222",
			  "created": "2014-07-14T14:34:11.223-0700",
			  "sysmlid": "_17_0_2_3_8660276_1391133273620_303350_69133",
			  "sysmlname": "EMS Application Manuals",
			  "configurations": [],
			  "creator": "dcoren"
			}]});

			$httpBackend.flush();
		});
	}));

	// accesses $http - ? testing problem with whenPOST?
	it('updateConfig', inject(function() {

		var newConfig = {
					id: "af927dcb753f",
					timestamp: "2014-07-14T16:43:07.747-0700",
					description: "New description",
					name: "New name",
					modified: "2014-07-21T14:25:07.752-0700"
		};

		ConfigService.updateConfig(newConfig, 'ems-support', 'master').then(function(response) {
			//console.log(response);
			expect(response.name).toEqual("New name");
		}, function(mesage) {
			console.log('config: ' + message);
		});

	}));

	// accesses $http - untested
	it('createConfig', inject(function() {

	}));

	// accesses $http - untested
	it('updateConfigSnapshots', inject(function() {

	}));

	// accesses $http - untested
	it('updateConfigProducts', inject(function() {

	}));

	// accesses $http - untested
	it('createSnapshots', inject(function() {

	}));
});

// ElementService - incomplete, 12 methods, [10 done, 1 empty, 1 untested] 
// !-- NOTE: still missing testing with inProgress --!
describe('ElementService', function() {
	beforeEach(module('mms'));

	var myElementService, $httpBackend, $rootScope;

	var root = '/alfresco/service';
	var forceEmpty, forceFail;
	var displayError = function() { console.log('This should not be displayed') };

	var element_17783 = {
		    "author": "jsalcedo",
		    "lastModified": "2014-07-21T15:04:46.336-0700",
		    "name": "Test2_JS",
		    "qualifiedName": "/////NewTest//Test1_JS",
		    "documentation": "old documentation",
		    "sysmlid": "_17783",
		    "owner": "_17448",
		    "read": "2014-07-22T09:17:06.353-0700",
		    "specialization": {
		        "displayedElements": ["_17783"],
		        "view2view": [
		            {"childrenViews": [], "id": "_17742"},
		            {"childrenViews": [], "id": "_17771"},
		            {"childrenViews": [], "id": "_17538"},
		            {"childrenViews": [], "id": "_17958"},
		            {"childrenViews": 
		            	["_17742", "_17958", "_17550", "_17771", "_17538", "_17913", "_16192"],
		                "id": "_17783"
		            },
		            {"childrenViews": [], "id": "_17913"},
		            { "childrenViews": [], "id": "_16192"},
		            { "childrenViews": [], "id": "_17550"}
		        ],
		        "allowedElements": ["_17783"],
		        "contains": [{
		            "sourceType": "reference",
		            "source": "_17783",
		            "sourceProperty": "documentation",
		            "type": "Paragraph"
		        }],
		        "noSections": [],
		        "type": "Product"
		    },
		    "editable": true
	};
	var updated_17783 = {
		    "author": "jsalcedo",
		    "lastModified": "2014-07-22T15:04:46.336-0700",
		    "name": "Test2_JS",
		    "qualifiedName": "/////NewTest//Test1_JS",
		    "documentation": "new documentation",
		    "sysmlid": "_17783",
		    "owner": "_17448",
		    "read": "2014-07-22T09:17:06.353-0700",
		    "specialization": {
		        "displayedElements": ["_17783"],
		        "view2view": [
		            {"childrenViews": [], "id": "_17742"},
		            {"childrenViews": [], "id": "_17771"},
		            {"childrenViews": [], "id": "_17538"},
		            {"childrenViews": [], "id": "_17958"},
		            {"childrenViews": 
		            	["_17742", "_17958", "_17550", "_17771", "_17538", "_17913", "_16192"],
		                "id": "_17783"
		            },
		            {"childrenViews": [], "id": "_17913"},
		            { "childrenViews": [], "id": "_16192"},
		            { "childrenViews": [], "id": "_17550"}
		        ],
		        "allowedElements": ["_17783"],
		        "contains": [{
		            "sourceType": "reference",
		            "source": "_17783",
		            "sourceProperty": "documentation",
		            "type": "Paragraph"
		        }],
		        "noSections": [],
		        "type": "Product"
		    },
		    "editable": true
	};

	var element_17448 = {
	    "author": "dlam",
	    "lastModified": "2014-07-10T10:46:26.499-0700",
	    "name": "test",
	    "qualifiedName": "/////NewTest/test",
	    "documentation": "",
	    "sysmlid": "_17448",
	    "owner": "PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4",
	    "read": "2014-07-22T09:37:03.357-0700",
	    "specialization": {"type": "Package"},
	    "editable": true};
	var updated_17448 = {
	    "author": "dlam",
	    "lastModified": "2014-07-22T10:46:26.499-0700",
	    "name": "test",
	    "qualifiedName": "/////NewTest/test",
	    "documentation": "not empty",
	    "sysmlid": "_17448",
	    "owner": "PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4",
	    "read": "2014-07-22T09:37:03.357-0700",
	    "specialization": {"type": "Package"},
	    "editable": true
	};

	var newElement = {
	    "author": "muschek",
	    "lastModified": "2014-07-22T10:46:26.499-0700",
	    "name": "new element",
	    "qualifiedName": "/////dummy/new element",
	    "documentation": "insert documentation here",
	    "owner": "ownerId",
	    "read": "2014-07-22T09:37:03.357-0700",
	    "specialization": {"type": "Package"},
	    "editable": true
	};

	beforeEach(inject(function($injector) {
		ElementService = $injector.get('ElementService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

		forceEmpty = false;
		forceFail = false;

		// GetElement responses
		$httpBackend.whenGET(root + '/workspaces/master/elements/12345?timestamp=01-01-2014').respond(
			{ elements: [ { sysmlid:12345, specialization: { type:'Comment' }, lastModified: '01-01-2014' } ] } );
		$httpBackend.whenGET(root + '/workspaces/master/elements/12345').respond( function(method, url, data) {
			var elements;
			if (forceEmpty) 
				elements = { elements: [] };
			else {
				elements = {elements: [ { sysmlid:12345, specialization: { type:'Comment' },
					lastModified: '07-30-2014'} ] };
			}
			return [200, elements];});
		$httpBackend.whenGET(root + '/workspaces/master/elements/12346').respond( function(method, url, data) {
			if (forceFail) {
				return [500, undefined, {status: {code:500, name:'Internal Error', 
					description:'An error inside the HTTP server which prevented it from fulfilling the request.'}}];
			} else {
				return [200, { elements: [ { sysmlid: 12346, specialization: { type:'Package'} } ] } ];
			}});
	

		// GetElement misc responses
		$httpBackend.whenGET(root + '/workspaces/master/elements/badId').respond( function(method, url, data) {
			var error = "[ERROR]: Element with id, badId not found\n[WARNING]: No elements found";
			return [404, error];});
		$httpBackend.whenGET(root + '/workspaces/master/elements/emptyId').respond( { elements: [] });
		$httpBackend.whenGET(root + '/workspaces/master/elements').respond(
			{elements:[ {sysmlid:12345, name:'commentElement', documentation:'old documentation',
			specialization:{type:'Comment'}}, {sysmlid:12346, name:'packageElement', 
			specialization:{type:'Package'}}]});
		$httpBackend.whenGET(root + '/workspaces/master/elements/noSpecialization').respond(
			{ elements: [ { sysmlid: 'noSpecialization', documentation: 'has no specialization' } ] } );
		$httpBackend.whenGET(root + '/workspaces/master/elements/operationId').respond(
			{ elements: [ { sysmlid: 'operationId', specialization: { type: 'Operation', 
			parameters: [ 'paramId', 'paramId2' ], expresion: 'expressionId' } } ] } );
		$httpBackend.whenGET(root + '/workspaces/master/elements/productId').respond(
			{ elements: [ { sysmlid: 'productId', specialization: { type: 'Product', 
			view2view: [ { sysmlid: 'viewId', childrenViews:[] } ], noSections: [] } } ] } );

		$httpBackend.whenGET(root + '/workspaces/master/elements/_17783').respond({elements: [element_17783]});
		$httpBackend.whenGET(root + '/workspaces/master/elements/_17784').respond(function(method, url, data) {
			var response = "[ERROR]: Element with id, _17784 not found\n[WARNING]: No elements found";
			return [404, response];
		});
		$httpBackend.whenGET(root + '/workspaces/master/elements/_17448').respond({elements: [element_17448]});

		$httpBackend.whenPOST(root + '/workspaces/master/elements').respond(function(method, url, data) {
			var json = JSON.parse(data);
			if (!json.elements[0].sysmlid) {
				json.elements[0].sysmlid = json.elements[0].name;
			}
			return [200, json];
		});

		$httpBackend.whenGET(root + '/workspaces/master/sites/siteId/products?timestamp=01-01-2014')
		.respond({products:[{sysmlid:'PROJECT-123456', name:'Europa', projectVersion:'v1'},
			{sysmlid:'PROJECT-2468', name:'Europa FS', projectVersion:'v34'}]});
		$httpBackend.whenGET(root + '/workspaces/master/sites/siteId').respond(function(method, url) {
			return [500, undefined, {status: {code:500, name:'Internal Error', 
				description:'An error inside the HTTP server which prevented it from fulfilling the request.'}}];
		});
	}));

	it('can get an instance of the ElementService and methods are valid', inject(function() {
		expect(ElementService).toBeDefined();

		expect(ElementService.getElement).not.toBe(null);
		expect(ElementService.getElements).not.toBe(null);
		expect(ElementService.getElementsForEdit).not.toBe(null);
		expect(ElementService.getOwnedElements).not.toBe(null);
		expect(ElementService.updateElement).not.toBe(null);
		expect(ElementService.updateElements).not.toBe(null);
		expect(ElementService.createElement).not.toBe(null);
		expect(ElementService.createElements).not.toBe(null);
		expect(ElementService.getGenericElements).not.toBe(null);
		expect(ElementService.isDirty).not.toBe(null);
		expect(ElementService.search).not.toBe(null);
	}));

	// !-- NOTE: calls on the VersionService.getElement function --!
	// done - 1 expected to fail
	it('getElement', inject(function() {

		// !-- NOTE: expects to fail --!
		// !(inProgress.hasOwnProperty(key)), !(ver === 'latest'), VersionService.getElement...
		expect( function() {
			ElementService.getElement(12345, undefined, undefined, '01-01-2014').then(function(response) {
				expect(response.sysmlid).toEqual( 12345 );
				expect(response.specialization).toEqual( { type: 'Comment' } );
				expect(response.lastModified).toEqual( '01-01-2014' );
			}); $httpBackend.flush();
		}).toThrow();
		
		// !(inProgress.hasOwnProperty(key)), (ver === 'latest'), !(elements.hasOwnProperty(id)),
		// $http.get - fail
		ElementService.getElement('badId', undefined, undefined, 'latest').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(404);
				expect(failMessage.data).toEqual("[ERROR]: Element with id, badId not found\n[WARNING]: No elements found");
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();

		// !(inProgress.hasOwnProperty(key)), (ver === 'latest'), !(elements.hasOwnProperty(id)),
		// $http.get - pass, !(data.elements.length > 0)
		ElementService.getElement('emptyId', undefined, undefined, 'latest').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();

		// !(inProgress.hasOwnProperty(key)), (ver === 'latest'), !(elements.hasOwnProperty(id)),
		// $http.get - pass, (data.elements.length > 0), !(elements.hasOwnProperty(id))
		ElementService.getElement('12345', undefined, undefined, 'latest').then(function(response) {
			expect(response.sysmlid).toEqual( 12345 );
			expect(response.specialization).toEqual( { type: 'Comment' } );
			expect(response.lastModified).toEqual( '07-30-2014' );
		}); $httpBackend.flush();
		// elements[12345] now exists

		/*
		Cannot exist because the 'elements' cache does not change between the two checks.
		 !(inProgress.hasOwnProperty(key)), (ver === 'latest'), !(elements.hasOwnProperty(id)),
		 $http.get - pass, (data.elements.length > 0), (elements.hasOwnProperty(id))
		*/

		// !(inProgress.hasOwnProperty(key)), (ver === 'latest'), (elements.hasOwnProperty(id)),
		// !(!update), $http.get - fail
		var twoElementURL = root + '/workspaces/master/elements';
		ElementService.getGenericElements(twoElementURL, 'elements', true, 'master', 'latest');
		// elements[12346] now exists
		forceFail = true;
		ElementService.getElement('12346', true, undefined, 'latest').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual(undefined);
				expect(failMessage.message).toEqual('Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(inProgress.hasOwnProperty(key)), (ver === 'latest'), (elements.hasOwnProperty(id)),
		// !(!update), $http.get - pass, !(data.elements.length > 0)
		forceEmpty = true;
		ElementService.getElement('12345', true, undefined, 'latest').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.data).toEqual( { elements: [] } );
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();
		forceEmpty = false;

		/*
		Cannot exist because the 'elements' cache does not change between the two checks.
		 !(inProgress.hasOwnProperty(key)), (ver === 'latest'), (elements.hasOwnProperty(id)),
		 !(!update), $http.get - pass, (data.elements.length > 0), !(elements.hasOwnProperty(id))
		*/

		// !(inProgress.hasOwnProperty(key)), (ver === 'latest'), (elements.hasOwnProperty(id)),
		// (!update)
		ElementService.getElement('12345', false, undefined, 'latest').then(function(response) {
			expect(response.sysmlid).toEqual(12345);
			expect(response.specialization).toEqual( { type: 'Comment' } );
			expect(response.lastModified).toEqual('07-30-2014');
		}); $rootScope.$apply();

		// (inProgress.hasOwnProperty(key))
		var firstPromise = ElementService.getElement('12345', true, undefined, 'latest');
		var secondPromise = ElementService.getElement('12345', true, undefined, 'latest');
		expect(secondPromise).toEqual(firstPromise);
	}));

	// done
	it('getElements', inject(function() {

		// Empty ids
		var ids = [];
		ElementService.getElements(ids, undefined, undefined, undefined).then(function(response) {
			expect(response).toEqual( [] );
		}); $rootScope.$apply();

		// One valid id
		ids = ['12345'];
		ElementService.getElements(ids, undefined, undefined, undefined).then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].sysmlid).toEqual(12345);
			expect(response[0].specialization).toEqual( { type: 'Comment' } );
			expect(response[0].lastModified).toEqual( '07-30-2014' );
		}); $httpBackend.flush();
		// elements[12345] now exists

		// Couple valid ids
		ids = ['12345', '12346'];
		ElementService.getElements(ids, undefined, undefined, undefined).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0].sysmlid).toEqual(12345);
			expect(response[0].specialization).toEqual( { type: 'Comment' } );
			expect(response[0].lastModified).toEqual( '07-30-2014' );

			expect(response[1].sysmlid).toEqual(12346);
			expect(response[1].specialization).toEqual( { type: 'Package' } );
		}); $httpBackend.flush();
		// elements[12346] now exists

		// Invalid id, but no update
		forceFail = true;
		ids = ['12346'];
		ElementService.getElements(ids, false, undefined, undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0].sysmlid).toEqual(12346);
			expect(response[0].specialization).toEqual( { type: 'Package' } );
		}); $rootScope.$apply();

		// Invalid id, but will update
		ElementService.getElements(ids, true, undefined, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual(undefined);
				expect(failMessage.message).toEqual('Server Error');
			});
		$httpBackend.flush();

		// Mixed (valid and invalid) ids
		ids = ['12345', '12346'];
		ElementService.getElements(ids, true, undefined, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual(undefined);
				expect(failMessage.message).toEqual('Server Error');
			});
		$httpBackend.flush();
	}));

	// !-- NOTE: when trying to remove attributes from the specialization that should
	// not be editable function actually removes nothing. --!
	// done - 3 expected to fail
	it('getElementForEdit', inject(function() {

		/*
			!(edits.hasOwnProperty(id) && !update), getElement - fail
				a. (edits.hasOwnProperty(id) && update)
				b. (!edits.hasOwnProperty(id) && !update)
		*/
		ElementService.getElementForEdit('badId', true, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(404);
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();

		/*
			!(edits.hasOwnProperty(id) && !update), getElement - pass, !(edits.hasOwnProperty(id)), 
			!(edit.hasOwnProperty('specialization'))
		*/
		ElementService.getElementForEdit('noSpecialization', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('noSpecialization');
			expect(response.documentation).toEqual('has no specialization');
			expect(response.specialization).toEqual(undefined);
		}); $httpBackend.flush();
		// edits[noSpecialization] now exists

		/*
			!(edits.hasOwnProperty(id) && !update), getElement - pass, !(edits.hasOwnProperty(id)), 
			(edit.hasOwnProperty('specialization')), !(edit.specialization.hasOwnProperty(nonEditKeys[i]))
		*/
		ElementService.getElementForEdit('operationId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization.type).toEqual('Operation');
			expect(response.specialization.parameters.length).toEqual(2);
			expect(response.specialization.expresion).toEqual('expressionId');
		}); $httpBackend.flush();
		// edits[operationId] now exists

		/*
			!(edits.hasOwnProperty(id) && !update), getElement - pass, !(edits.hasOwnProperty(id)), 
			(edit.hasOwnProperty('specialization')), (edit.specialization.hasOwnProperty(nonEditKeys[i]))
		*/
		ElementService.getElementForEdit('productId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('productId');
			expect(response.specialization.type).toEqual('Product');
			expect(response.specialization.noSections).toEqual( [] );
			expect(response.specialization.view2view).toEqual( undefined );
		}); $httpBackend.flush();
		// edits[productId] now exists

		/*
			!(edits.hasOwnProperty(id) && !update), getElement - pass, (edits.hasOwnProperty(id)), 
			!(edit.hasOwnProperty('specialization'))
		*/
		ElementService.getElementForEdit('noSpecialization', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('noSpecialization');
			expect(response.documentation).toEqual('has no specialization');
			expect(response.specialization).toEqual(undefined);

			// edit the response
			response.documentation = 'this element has no specialization';
		}); $httpBackend.flush();
		
		// After edit
		ElementService.getElementForEdit('noSpecialization', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('noSpecialization');
			expect(response.documentation).toEqual('has no specialization');
			expect(response.specialization).toEqual(undefined);
		}); $httpBackend.flush();

		/*
			!(edits.hasOwnProperty(id) && !update), getElement - pass, (edits.hasOwnProperty(id)), 
			(edit.hasOwnProperty('specialization')), !(edit.specialization.hasOwnProperty(nonEditKeys[i]))
		*/
		ElementService.getElementForEdit('operationId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization.type).toEqual('Operation');
			expect(response.specialization.parameters.length).toEqual(2);
			expect(response.specialization.expresion).toEqual('expressionId');

			// now add documentation, to show for a change
			response.documentation = 'operations do not have non-editable properties';
		}); $httpBackend.flush();

		/* 
		 !-- NOTE: I'm not sure if the element for edit that has been updated from the server,
		 ought to have the documentation property if it did not already exist, but currently,
		 it does. -- !
		*/
		//After an edit has been made.
		ElementService.getElementForEdit('operationId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization.type).toEqual('Operation');
			expect(response.specialization.parameters.length).toEqual(2);
			expect(response.specialization.expresion).toEqual('expressionId');
			expect(response.documentation).toEqual('operations do not have non-editable properties');
		}); $httpBackend.flush();

		/*
			!(edits.hasOwnProperty(id) && !update), getElement - pass, (edits.hasOwnProperty(id)), 
			(edit.hasOwnProperty('specialization')), (edit.specialization.hasOwnProperty(nonEditKeys[i]))
		*/
		ElementService.getElementForEdit('productId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('productId');
			expect(response.specialization.type).toEqual('Product');
			expect(response.specialization.noSections).toEqual( [] );
			expect(response.specialization.view2view).toEqual( undefined );

			// make an edit
			response.documentation = 'products have non-editable properties';
		}); $httpBackend.flush();

		/* 
		 !-- NOTE: I'm not sure if the element for edit that has been updated from the server,
		 ought to have the documentation property if it did not already exist, but currently,
		 it does. -- !
		*/
		//After an edit has been made.
		ElementService.getElementForEdit('productId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('productId');
			expect(response.specialization.type).toEqual('Product');
			expect(response.specialization.noSections).toEqual( [] );
			expect(response.specialization.view2view).toEqual( undefined );
			expect(response.documentation).toEqual('products have non-editable properties');
		}); $httpBackend.flush();

		//	(edits.hasOwnProperty(id) && !update)
		ElementService.getElementForEdit('12345', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual(12345);
			expect(response.specialization.type).toEqual('Comment');
			expect(response.lastModified).toEqual('07-30-2014');

			// edit the response
			response.lastModified = '07-31-2014';
		}); $httpBackend.flush();

		ElementService.getElementForEdit('12345', false, undefined).then(function(response) {
			expect(response.sysmlid).toEqual(12345);
			expect(response.specialization.type).toEqual('Comment');
			expect(response.lastModified).toEqual('07-31-2014');
		}); $rootScope.$apply();
	}));

	// done - unless redundant testing is required
	it('getElementsForEdit', inject(function() {

		/// Empty ids
		var ids = [];
		ElementService.getElementsForEdit(ids, undefined, undefined, undefined).then(function(response) {
			expect(response).toEqual( [] );
		}); $rootScope.$apply();

		// One valid id
		ids = ['12345'];
		ElementService.getElementsForEdit(ids, undefined, undefined, undefined).then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].sysmlid).toEqual(12345);
			expect(response[0].specialization).toEqual( { type: 'Comment' } );
			expect(response[0].lastModified).toEqual( '07-30-2014' );
		}); $httpBackend.flush();
		// edits[12345] now exists

		// Couple valid ids
		ids = ['12345', '12346'];
		ElementService.getElementsForEdit(ids, undefined, undefined, undefined).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0].sysmlid).toEqual(12345);
			expect(response[0].specialization).toEqual( { type: 'Comment' } );
			expect(response[0].lastModified).toEqual( '07-30-2014' );

			expect(response[1].sysmlid).toEqual(12346);
			expect(response[1].specialization).toEqual( { type: 'Package' } );
		}); $httpBackend.flush();
		// edist[12346] now exists

		// Invalid id, but no update
		forceFail = true;
		ids = ['12346'];
		ElementService.getElementsForEdit(ids, false, undefined, undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0].sysmlid).toEqual(12346);
			expect(response[0].specialization).toEqual( { type: 'Package' } );
		}); $rootScope.$apply();

		// Invalid id, but will update
		ElementService.getElementsForEdit(ids, true, undefined, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual(undefined);
				expect(failMessage.message).toEqual('Server Error');
			});
		$httpBackend.flush();

		// Mixed (valid and invalid) ids
		ids = ['12345', '12346'];
		ElementService.getElementsForEdit(ids, true, undefined, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual(undefined);
				expect(failMessage.message).toEqual('Server Error');
			});
		$httpBackend.flush();
		forceFail = false;
	}));

	// is an empty function
	it('getOwnedElements', inject(function() {}));

	// done - minus error and specialization portion
	it('updateElement', inject(function() {

		// Default - also does not exist in elements or edits
		ElementService.updateElement(updated_17783).then(function(updatedElement) {

			// because updated_17783's owner property was deleted
			expect(updatedElement).toEqual(updated_17783);
			expect(updatedElement.owner).not.toBeDefined();
			expect(updated_17783.owner).not.toBeDefined();
		}); $httpBackend.flush();

		ElementService.updateElement(element_17783); // reset the elements array to original value
		$httpBackend.flush();

		// reset the owner values
		updated_17783.owner = '_17448';
		element_17783.owner = '_17448'; 


		// Default - master = 'master' - also exists in elements
		ElementService.updateElement(updated_17783, 'master').then(function(updatedElement) {
		
			expect(updatedElement).toEqual(updated_17783);
			expect(updatedElement.owner).not.toBeDefined();
		}); $httpBackend.flush();

		ElementService.updateElement(element_17783); // reset the elements array to original value
		$httpBackend.flush();

		// reset the owner values
		updated_17783.owner = '_17448';
		element_17783.owner = '_17448'; 
		

		// sysmlid missing
		var noIdElement = {author:'muschek', name: 'noIdElement', specialization: {type: 'Package'}, 
							editable: true};

		ElementService.updateElement(noIdElement, 'master').then(function(response) {
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes).toEqual('Element id not found, create element first!');
		});

		// exists in edits
		// create element, get it back for editing, edit then update, re-edit and update,
		// check the copy gotten for edit and check for it to have updated
		var noSpec = {author: 'muschek', name:'noSpec'};
		ElementService.createElement(noSpec);
		$httpBackend.flush();

		ElementService.getElementForEdit('noSpec').then(function(response) {
			var noSpec4Edit = response;
			noSpec4Edit.name = 'updated noSpec';
			ElementService.updateElement(noSpec4Edit).then(function(response2) {
				var noSpec4Edit2 = response2;
				noSpec4Edit2.name = 'reUpdated noSpec';

				ElementService.updateElement(noSpec4Edit2).then(function(response3) {
					expect(response3.name).toEqual('reUpdated noSpec');
					expect(noSpec4Edit.name).toEqual('reUpdated noSpec');
				})
			});
		});
		$httpBackend.flush();


		// However, the owner value is retained in the response as long as the
		// element already existed in the elements cache.
		ElementService.getElement('_17448');
		$httpBackend.flush();

		ElementService.updateElement(updated_17448).then(function(updatedElement) {
			expect(updatedElement).not.toEqual(updated_17448);
			expect(updatedElement.owner).toBeDefined();
		});
		$httpBackend.flush();

		updated_17448.owner = 'PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4';
		// does not test the specialization portion
		
	}));
	// done - unless redundant testing is required
	it('updateElements', inject(function() {

		// First, need to ensure the sysmlids are in the elements cache
		ElementService.getElements(['_17448', '_17783']).then(function(elements) {
			expect(elements[0]).toEqual(element_17448);
			expect(elements[1]).toEqual(element_17783);

		});
		$httpBackend.flush();

		// Then, you can try to update
		ElementService.updateElements([updated_17448, updated_17783]).then(function(elements) {

			// updateElements has now deleted the owner property of both updated_17448 & updated_17783
			expect(updated_17448.owner).not.toBeDefined();
			expect(updated_17783.owner).not.toBeDefined();

			// however, the returned elements have owner properties due to their existence in the cache
			expect(elements[0].owner).toBeDefined();
			expect(elements[1].owner).toBeDefined();

			var ids = [updated_17448.sysmlid, updated_17783.sysmlid];

			ElementService.getElements(ids).then(function(elements2) {

				expect(elements2[0]).not.toEqual(element_17448);
				expect(elements2[1]).not.toEqual(element_17783);
			});
		}); $httpBackend.flush();

		updated_17448.owner = 'PROJECT-78b1ddf7-0d4f-4507-bf41-6ea9b48249d4';
		updated_17783.owner = '_17448';

		// empty list of elements to update
		ElementService.updateElements([]).then(function(response) {
			expect(response).toEqual([]);
		}); 

		// Update with an element without a sysmlid
		ElementService.updateElements([{author:'muschek', name:'invalid'}]).then(function(response) {
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes).toEqual('Element id not found, create element first!');
		});

		//$httpBackend.flush();

	}));

	// done
	it('createElement', inject(function() {
		// Default
		ElementService.createElement(newElement).then(function(response) {
			expect(response.author).toEqual('muschek');
		});


		// Owner not specified
		var modNewElement = newElement;
		delete modNewElement.owner;
		ElementService.createElement(modNewElement).then(function(response) {
			expect(response.owner).toEqual('PROJECT-21bbdceb-a188-45d9-a585-b30bba346175');
		});


		// Sysmlid given
		var modNewElement2 = newElement;
		modNewElement2.sysmlid = '019f';
		ElementService.createElement(modNewElement2).then(function(response) {
			console.log('should not be calling here');

		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.message).toEqual('Element create cannot have id');
		});

		// Error

		$httpBackend.flush();
	}));

	// done - unless redundant testing is required
	it('createElements', inject(function() {

		var newElement = {author:'muschek', name:'newElement', owner:'newElement2'};
		var newElement2 = {author:'muschek', name:'newElement2', owner: 'anotherElement'};

		// Default
		ElementService.createElements([newElement, newElement2]).then(function(elements) {

			expect(elements[0].sysmlid).toBeDefined();
			expect(elements[1].sysmlid).toBeDefined();

			newElement.sysmlid = elements[0].sysmlid;
			newElement2.sysmlid = elements[1].sysmlid;

			expect(elements[0]).toEqual(newElement);
			expect(elements[1]).toEqual(newElement2);
		}); $httpBackend.flush();

		// Empty array for new elements
		ElementService.createElements([]).then(function(elements) {
			expect(elements).toEqual([]);
		});

		// Preset sysmlid
		var newElement3 = {author: 'muschek', name:'preset sysmlid', sysmlid:12345, owner:'anotherElement'};
		ElementService.createElements([newElement3]).then(function(elements) {
			console.log('Should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.message).toEqual('Element create cannot have id');
		});

		// No owner set
		var newElement4 = {author: 'muschek', name:'no owner element'};
		ElementService.createElements([newElement4]).then(function(elements) {
			
			expect(elements[0].owner).toEqual('PROJECT-21bbdceb-a188-45d9-a585-b30bba346175');
			newElement4.sysmlid = elements[0].sysmlid;
			expect(elements[0]).toEqual(newElement4);
		}); $httpBackend.flush();
	}));

	// !-- NOTE: when calling on elements that have sysmlid it will pass back copies of the first element
	// that had no sysmlid --!
	// done
	it('getGenericElements', inject(function() {
		// (!inProgress.hasOwnProperty(progress)), (ver !== 'latest') 
		var siteProductsURL = '/alfresco/service/workspaces/master/sites/siteId/products';
		ElementService.getGenericElements(siteProductsURL, 'products', undefined, undefined, '01-01-2014')
		.then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({sysmlid:'PROJECT-123456', name:'Europa', projectVersion:'v1'});
			expect(response[1]).toEqual({sysmlid:'PROJECT-2468', name:'Europa FS', projectVersion:'v34'});
		}); $httpBackend.flush();

		// (!inProgress.hasOwnProperty(progress)), (ver === 'latest'), $http.get(url) - fail 
		var badURL = '/alfresco/service/workspaces/master/sites/siteId';
		ElementService.getGenericElements(badURL, 'sites', undefined, undefined, 'latest')
		.then(function(response) { console.log('This should not be displayed'); }, function(failMes) {
			expect(failMes.status).toEqual(500);
			expect(failMes.message).toEqual('Server Error');
		}); $httpBackend.flush();

		// !(inProgress.hasOwnProperty(progress)), (ver === 'latest'), $http.get(url) - pass, 
		// !(elements.hasOwnProperty(element.sysmlid))
		var elementsURL = '/alfresco/service/workspaces/master/elements';
		ElementService.getGenericElements(elementsURL, 'elements', false, undefined, 'latest')
		.then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({sysmlid:12345, name:'commentElement', documentation:'old documentation',
				specialization:{type:'Comment'}});
			expect(response[1]).toEqual({sysmlid:12346, name:'packageElement', specialization:{type:'Package'}});
		}); $httpBackend.flush();
		// elements[12345] and elements[12346] now exist


		// !(inProgress.hasOwnProperty(progress)), (ver === 'latest'), $http.get(url) - pass, 
		// (elements.hasOwnProperty(element.sysmlid)), !update
		var new_12345 = {sysmlid:12345, name:'commentElement', documentation:'new documentation',
		 specialization:{type:'Comment'}};
		ElementService.updateElement(new_12345, 'master');
		$httpBackend.flush();

		ElementService.getGenericElements(elementsURL, 'elements', false, undefined, 'latest')
		.then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({sysmlid:12345, name:'commentElement', documentation:'new documentation',
				specialization:{type:'Comment'}});
			expect(response[1]).toEqual({sysmlid:12346, name:'packageElement', specialization:{type:'Package'}});
		}); $rootScope.$apply();

		// !(inProgress.hasOwnProperty(progress)), (ver === 'latest'), $http.get(url) - pass, 
		// (elements.hasOwnProperty(element.sysmlid)), update
		ElementService.getGenericElements(elementsURL, 'elements', true, undefined, 'latest')
		.then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({sysmlid:12345, name:'commentElement', documentation:'old documentation',
				specialization:{type:'Comment'}});
			expect(response[1]).toEqual({sysmlid:12346, name:'packageElement', specialization:{type:'Package'}});
		}); $httpBackend.flush();

		// (inProgress.hasOwnProperty(progress))
		var emptyURL = root + '/workspaces/master/elements/emptyId';
		var firstPromise = ElementService.getGenericElements(emptyURL, 'elements', undefined, undefined, 'latest');
		var secondPromise = ElementService.getGenericElements(emptyURL, 'elements', undefined, undefined, 'latest');
		expect(secondPromise).toEqual(firstPromise);
	}));

	// done
	it('isDirty', inject(function() {

		// Basic get and check if it has changed
		ElementService.getElement('_17448').then(function(element) {
			expect(ElementService.isDirty('_17448')).toEqual(false);
		});

		// Change and check
		ElementService.getElementForEdit('_17448').then(function(element) {
			var element4Edit = element;

			// Before change, still clean
			expect(ElementService.isDirty('_17448')).toEqual(false);

			// After change, now dirty
			element4Edit.author = 'muschek';
			expect(ElementService.isDirty('_17448')).toEqual(true);
		})

		$httpBackend.flush();

	}));

	// accesses $http - untested
	it('search', inject(function() {

	}));
});

// NotificationService - (done), 3 methods, [3 empty]
describe('NotificationService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the NotificationService and methods are valid', inject(function() {
		expect(NotificationService).toBeDefined();

		expect(NotificationService.getFollowing).not.toBe(null);
		expect(NotificationService.follow).not.toBe(null);
		expect(NotificationService.unfollow).not.toBe(null);
	}));

	it('getFollowing', inject(function() {

	}));

	it('follow', inject(function() {

	}));

	it('unfollow', inject(function() {

	}));
});

// ProjectService - (done), [empty]
describe('ProjectService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the ProjectService', inject(function() {
		expect(ProjectService).toBeDefined();
		expect(ProjectService()).toEqual({});
	}))
});

// SearchService - (done), [1 expected failure]
describe('SearchService', function() {
	beforeEach(module('mms'));

	var SearchService, $httpBackend;

	beforeEach(inject(function($injector) {

		SearchService = $injector.get('SearchService');
		$httpBackend = $injector.get('$httpBackend');
	}));

	it('can get an instance of the SearchService and methods are valid', inject(function() {
		expect(SearchService).toBeDefined();

		expect(SearchService.searchElements).not.toBe(null);
	}));

	// depreciated function, results in a TypeError being thrown
	it('searchElements', inject(function() {

		expect(function() {SearchService.searchElements('muschek')}).toThrow(new TypeError('URLService.getRoot is not a function'));
	}));
});

// SiteService - (done), [2 $http, 4 normal, 1 empty]
describe('SiteService', function() {
	beforeEach(module('mms'));

	var SiteService, $httpBackend;

	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		SiteService = $injector.get('SiteService');

		$httpBackend.whenGET('/alfresco/service/rest/sites').respond([
            {name: 'europa', title: 'Europa'}
        ]);		

	}));

	it('can get an instance of the SiteService and methods are valid', inject(function() {
		expect(SiteService).toBeDefined();

		expect(SiteService.getCurrentSite).not.toBe(null);
		expect(SiteService.setCurrentSite).not.toBe(null);
		expect(SiteService.getCurrentWorkspace).not.toBe(null);
		expect(SiteService.setCurrentWorkspace).not.toBe(null);
		expect(SiteService.getSites).not.toBe(null);
		expect(SiteService.getSite).not.toBe(null);
		expect(SiteService.getSiteProjects).not.toBe(null);
	}));

	// done
	it('getCurrentSite', inject(function() {
		expect(SiteService.getCurrentSite()).toBe('europa');
	}));

	// done
	it('setCurrentSite', inject(function() {
		SiteService.setCurrentSite('notEuropa');
		expect(SiteService.getCurrentSite()).toBe('notEuropa');
	}));

	// done
	it('getCurrentWorkspace', inject(function() {
		expect(SiteService.getCurrentWorkspace()).toBe('master');
	}));

	// done
	it('setCurrentWorkspace', inject(function() {
		SiteService.setCurrentWorkspace('notMaster');
		expect(SiteService.getCurrentWorkspace()).toBe('notMaster');
	}))

	// done
	it('getSites', inject(function() {

		SiteService.getSites().then(function(data) {
        	expect(data).toEqual([{name: 'europa', title: 'Europa'}]);
        });

        $httpBackend.flush();
	}));

	// done
	it('getSite', inject(function() {
			
        SiteService.getSite('europa').then(function(site) {
            expect(site).toEqual({name: 'europa', title: 'Europa'});
        });

        $httpBackend.flush();
	}));

	// empty function
	it('getSiteProjects', inject(function() {

	}))
});

// URLService - (done), 16 methods, [16 normal]
describe('URLService', function() {
	beforeEach(module('mms'));

	var root = '/alfresco/service';
	var id = 'id';
	var site = 'siteName';
	var workspace = 'workspaceName';

	var Service;

	it('can get an instance of URLService', inject(function() {
		//URLService function exists
		expect(URLService).toBeDefined();
		//URLService returns object that has all these attributes
		Service = URLService();
		expect(Service.getSiteDashboardURL).toBeDefined();
		expect(Service.getElementURL).toBeDefined();
		expect(Service.getElementVersionsURL).toBeDefined();
		expect(Service.getPostElementsURL).toBeDefined();
		expect(Service.handleHttpStatus).toBeDefined();
		expect(Service.getSitesURL).toBeDefined();
		expect(Service.getElementSearchURL).toBeDefined();
		expect(Service.getImageURL).toBeDefined();
		expect(Service.getProductSnapshotsURL).toBeDefined();
		expect(Service.getConfigSnapshotsURL).toBeDefined();
		expect(Service.getSiteProductsURL).toBeDefined();
		expect(Service.getConfigURL).toBeDefined();
		expect(Service.getSiteConfigsURL).toBeDefined();
		expect(Service.getConfigProductsURL).toBeDefined();
		expect(Service.getDocumentViewsURL).toBeDefined();
		expect(Service.getViewElementsURL).toBeDefined();
	}));

	it('getConfigSnapshotsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations/' + id + '/snapshots';
		expect(Service.getConfigSnapshotsURL(id, site, workspace)).toBe(expectedReturn);
	}));

	it('getProductSnapshotsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/products/' + id + '/snapshots';
		expect(Service.getProductSnapshotsURL(id, site, workspace)).toBe(expectedReturn)
	}));

	it('getSiteConfigsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations';
		expect(Service.getSiteConfigsURL(site, workspace)).toBe(expectedReturn);
	}));

	it('getConfigProductsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations/' + id + '/products';
		expect(Service.getConfigProductsURL(id, site, workspace)).toBe(expectedReturn);
	}));

	it('getConfigURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/configurations/' + id;
		expect(Service.getConfigURL(id, site, workspace)).toBe(expectedReturn);
	}));

	it('getSiteProductsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/sites/' + site + '/products';
		expect(Service.getSiteProductsURL(site, workspace)).toBe(expectedReturn);
	}));

	it('getImageURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/artifacts/' + id;
		// First just get it to work with the latest
		expect(Service.getImageURL(id, workspace, 'latest')).toBe(expectedReturn);
		// Then with a version
	}));

	it('getSiteDashboardURL', inject(function() {
		var expectedReturn = '/share/page/site/' + site + '/dashboard';
		expect(Service.getSiteDashboardURL(site)).toBe(expectedReturn);
	}));

	it('getElementURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/elements/' + id;
		// Another version dependent function
		// But actually independent?
		expect(Service.getElementURL(id, workspace, 'latest')).toBe(expectedReturn);
	}));

	it('getDocumentViewsURL', inject(function() {
		var expectedReturn = root + '/javawebscripts/products/' + id + '/views';
		expect(Service.getDocumentViewsURL(id, workspace, 'latest')).toBe(expectedReturn);
	}));

	it('getViewElementsURL', inject(function() {
		var expectedReturn = root + '/javawebscripts/views/' + id + '/elements';
		expect(Service.getViewElementsURL(id, workspace, 'latest')).toBe(expectedReturn);
	}));

	it('getElementVersionsURL', inject(function() {
		var expectedReturn = root + '/javawebscripts/elements/' + id + '/versions';
		expect(Service.getElementVersionsURL(id, workspace)).toBe(expectedReturn);
	}));

	it('getPostElementsURL', inject(function() {
		var expectedReturn = root + '/workspaces/' + workspace + '/elements';
		expect(Service.getPostElementsURL(workspace)).toBe(expectedReturn);
	}));

	it('getSitesURL', inject(function() {
		var expectedReturn = root + '/rest/sites';
		expect(Service.getSitesURL()).toBe(expectedReturn);
	}));

	it('getElementSearchURL', inject(function() {
		var query = 'queryKeyword';
		var expectedReturn = root + '/javawebscripts/element/search?keyword=' + query;
		expect(Service.getElementSearchURL(query, workspace)).toBe(expectedReturn);
	}));

	/*
	Private methods: isTimestamp, addVersion, handleHttpStatus
	Not tested
	*/
});

// UtilsService - incomplete, 2 methods, [1 normal, 1 other]
describe('UtilsService', function() {
	beforeEach(module('mms'));

	var UtilsService;

	beforeEach(inject(function($injector) {
		UtilsService = $injector.get('UtilsService');
	}));

	it('can get an instance of the UtilsService and methods are valid', inject(function() {
		expect(UtilsService).toBeDefined();

		expect(UtilsService.hasCircularReference).not.toBe(null);
		expect(UtilsService.cleanElement).not.toBe(null);
	}));

	// will need to come up with way to test this
	it('hasCircularReference', inject(function() {

	}));

	// done
	it('cleanElement', inject(function() {

		// hasProperty('specialization'), specialization.type == 'Property', spec.value !== array
		var dirtyElement = {author:'muschek', sysmlid:12345, name:'dirtyElement', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID', 
			value: 'not an array'}};
		UtilsService.cleanElement(dirtyElement);
		expect(dirtyElement.specialization.value).toEqual([]);

		// !-- NOTE: under new API will not get a value that contains a specialization --!
		// hasProperty('specialization'), specialization.type == 'Property', spec.value == array, 
		// elements in value have property specialization
		var dirtyElement2 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
			value:[{type:'ValueWithSpec', specialization:{type:'Unknown'}}, 
			{type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
		UtilsService.cleanElement(dirtyElement2);
		expect(dirtyElement2.specialization.value[0].specialization).not.toBeDefined();
		expect(dirtyElement2.specialization.value[1].specialization).not.toBeDefined();

		// !-- NOTE: this path does nothing --!
		// hasProperty('specialization'), specialization.type == 'View'
		var dirtyElement3 = {author:'muschek', sysmlid:12347, name:'dirtyElement3', owner:'otherElement',
		specialization: {type:'View', contains:[{type:'Paragraph', sourceType:'text', text:'insert paragraph'}],
		displayedElements:['displayedElementID', 'displayedElementID2'], 
		allowedElements:['allowedElementID', 'allowedElementID2'], childrenViews:[]}};
		UtilsService.cleanElement(dirtyElement3);
		expect(dirtyElement3.specialization.displayedElements).toBeDefined();
		expect(dirtyElement3.specialization.allowedElements).toBeDefined();

		// !hasProperty('specialization')
		var nonDirtyElement = {author:'muschek', sysmlid:12348, name:'nonDirtyElement', owner:'otherElement'};
		UtilsService.cleanElement(nonDirtyElement);
		expect(nonDirtyElement.author).toEqual('muschek');
		expect(nonDirtyElement.sysmlid).toEqual(12348);
		expect(nonDirtyElement.name).toEqual('nonDirtyElement');
		expect(nonDirtyElement.owner).toEqual('otherElement');
	}));
});

/*
// VersionService - incomplete, 4 methods, [4 $http]
describe('VersionService', function() {
	beforeEach(module('mms'));

	var basicFormat = '2014-07-21T15:04:46.336-0700';

	var VersionService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		VersionService = $injector.get('VersionService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

		$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/badId\?timestamp+/)
		.respond(function(method, url) {
			var errorMessage = '[ERROR]: Element with id, badId not found\n[WARNING]: No elements found';
			return [404, errorMessage];
		});

		$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/emptyId+/)
		.respond({elements:[]});
	/*
			$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/12345\?timestamp=01-01-2014+/).respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'01-01-2014'}]});
			$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/12345\?timestamp=02-01-2014+/).respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'02-01-2014'}]});
			$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/12346\?timestamp=01-01-2014+/).respond(
			{elements: [{author:'muschek', name:'anotherBasicElement', sysmlid:12346, lastModified:'01-01-2014'}]});
	*/
	/*

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345?timestamp=01-01-2014').respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'01-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345?timestamp=02-01-2014').respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'02-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12346?timestamp=01-01-2014').respond(
			{elements: [{author:'muschek', name:'anoterBasicElement', sysmlid:12346, lastModified: '01-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345/versions').respond(
			{versions: [{sysmlid:12345, timestamp:'01-01-2014', versionLabel:'14.1'}, 
			{sysmlid:12345, timestamp:'02-01-2014', versionLabel:'14.2'}]});
			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12346/versions').respond(
			{versions: [{sysmlid:12346, timestamp:'01-01-2014', versionLabel:'14.1'}]});

			// Version testing will be kept to timestamps for the time being
	}));


	it('can get an instance of VersionService', inject(function() {
		expect(VersionService).toBeDefined();

		expect(VersionService.getElement).toBeDefined();
		expect(VersionService.getElements).toBeDefined();
		expect(VersionService.getElementVersions).toBeDefined();
		expect(VersionService.getGenericElements).toBeDefined();
	}));

	// done
	it('getElement', inject(function() {
		
		// !inProgress.hasProperty(key), !elements.hasProperty(id), error
		VersionService.getElement('badId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();
		// badId now exist in elements

		// ..., elements.hasProperty(id), !elements[id].hasProperty(version), error
		VersionService.getElement('badId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();

		// !inProgress.hasProperty(key), !elements.hasProperty(id), success, elements.length <= 0
		VersionService.getElement('emptyId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.data).toEqual({elements:[]});
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();
		// emptyId now exists in elements

		// ..., elements.hasProperty(id), success, elements.length <= 0
		VersionService.getElement('emptyId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.data).toEqual({elements:[]});
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();

		// !inProgress.hasProperty(key), !elements.hasProperty(id), success, elements.length > 0
		VersionService.getElement('12345', '01-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('01-01-2014');
		}); $httpBackend.flush();
		// 12345 now exists in elements, and 01-01-2014 version exists in cache

		// ..., elements.hasProperty(id), !elements[id].hasProperty(version), success, elements.length > 0
		VersionService.getElement('12345', '02-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('02-01-2014');
		}); $httpBackend.flush();
		// 02-01-2014 version now exists in cache

		// ..., ..., elements[id].hasProperty(version)
		VersionService.getElement('12345', '01-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('01-01-2014');
		}); $rootScope.$apply();

		// inProgress.hasProperty(key)
		var firstPromise = VersionService.getElement('12346', '01-01-2014');
		var secondPromise = VersionService.getElement('12346', '01-01-2014');
		var thirdPromise = VersionService.getElement('12346', '02-01-2014');
		var fourthPromise = VersionService.getElement('12346', '01-01-2014', 'otherWorkspace'); 
		expect(secondPromise).toEqual(firstPromise);
		expect(thirdPromise).not.toEqual(firstPromise);
		expect(fourthPromise).not.toEqual(firstPromise);
	}));

	// 1 of 4 done
	it('getElements', inject(function() {
		var ids = ['12345', '12346'];

		// Default
		VersionService.getElements(ids, '01-01-2014', 'master').then(function(response) {
			var element1 = response[0];
			var element2 = response[1];

			expect(element1.name).toEqual('basicElement');
			expect(element2.name).toEqual('anotherBasicElement');
		}); $httpBackend.flush();


		// Some or none of the elements have the given timestamp
		
		// Some or all of the ids are invalid

		// Redundant testing similar to getElement
	}));

	// !-- NOTE: is using old API --!
	// done, however, all will fail
	it('getElementVersions', inject(function() {

		// (!versions.hasProperty(id) && !update), error
		VersionService.getElementVersions('badId', false, 'master').then(function(response) {
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.message).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
		}); $httpBackend.flush();

		// (!versions.hasProperty(id) && !update), success
		VersionService.getElementVersions('12345', false, 'master').then(function(response) {
			expect(response.length).toEqual(2);
			var version1 = response[0];
			var version2 = response[1];
			expect(version1.versionLabel).toEqual('14.1');
			expect(version2.versionLabel).toEqual('14.2');
		}); $httpBackend.flush();
		// versions now contains 12345's versions

		// (!versions.hasProperty(id) && update), success
		VersionService.getElementVersions('12346', true, 'master').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].versionLabel).toEqual('14.1');
		}); $httpBackend.flush();
		// versions now contains 12346's versions

		// (versions.hasProperty(id) && !update)
		VersionService.getElementVersions('12346', false, 'master').then(function(response) {
			// modify the version's data as to check if it modifies
			response[0].versionLabel = '14.7';
		}); $rootScope.$apply();

		VersionService.getElementVersions('12346', false, 'master').then(function(response) {
			expect(response[0].sysmlid).toEqual('12346');
			expect(response[0].versionLabel).toEqual('14.7');
		}); $rootScope.$apply();

		// (versions.hasProperty(id) && update), success
		VersionService.getElementVersions('12346', true, 'master').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].sysmlid).toEqual('12346');
			expect(response[0].versionLabel).toEqual('14.1');
		}); $httpBackend.flush();
	}));

	// 0 of 4
	it('getGenericElements', inject(function() {

		// !inProgress.hasProperty(progress), error

		// !inProgress.hasProperty(progress), success, !elements.hasProperty(element.sysmlid)

		// ..., success, elements.hasProperty(element.sysmlid), !elements[element.sysmlid].hasProperty(version)

		// ..., ..., elements.hasProperty(element.sysmlid), elements[element.sysmlid].hasProperty(version)
	}));
});
*/

/*
// ViewService - incomplete, 18 methods, [4 empty,  4 tested, 10 use $http]
describe('ViewService', function() {
	beforeEach(module('mms'));

	var root = '/alfresco/service';
	var ViewService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		ViewService = $injector.get('ViewService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

		$httpBackend.whenGET('/alfresco/service/workspaces/master/views/12345/elements?timestamp=01-01-2014').respond(
			{elements: [{author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'}, 
			{author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'}]});
		$httpBackend.whenGET('/alfresco/service/workspaces/master/views/12345/elements').respond({elements:[
			{author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'07-28-2014'},
			{author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'07-28-2014'}]});
	
		$httpBackend.whenGET(root + '/workspaces/master/sites/siteId/products/54321/views?timestamp=01-01-2014').respond(
			{elements:[{author:'muschek', name:'doc view', owner:54321, sysmlid:54322, lastModified:'01-01-2014'}]});
		$httpBackend.whenGET(root + '/workspaces/master/sites/siteId/products/65432/views').respond(
			{elements: [{author:'muschek', name:'other id view', owner:65432, sysmlid:65433, lastModified:'07-28-2014'}]});

		$httpBackend.whenGET(root + '/workspaces/master/elements/badId').respond(function(method, url) {
			var warning = '[ERROR]: Element with id, badId not found\n[WARNING]: No elements found';
			return [404, warning];
		});
		$httpBackend.whenGET(root + '/workspaces/master/elements/noSpecDocId').respond(
			{elements: [{author:'muschek', name:'doc with no spec', sysmlid:'noSpecDocId'}]});
		$httpBackend.whenGET(root + '/workspaces/master/elements/emptyView2ViewDocId').respond(
			{elements: [{author:'muschek', name:'doc with empty view2view', sysmlid:'emptyView2ViewDocId',
			specialization: {type:'Product', view2view:[], noSections:[]}
			}]});
		$httpBackend.whenGET(root + '/workspaces/master/elements/noIdMatchDocId').respond(
			{elements: [{author:'muschek', name:'do with non-empty view2view but no id match',
			sysmlid:'noIdMatchDocId', specialization:{type:'Product', 
			view2view:[{id:'notMatchingId', childrenViews:[]}]}}]});
		$httpBackend.whenGET(root + '/workspaces/master/elements/idMatchDocId').respond(
			{elements: [{name:'doc with matching id', sysmlid:'idMatchDocId', specialization:{type:'Product',
			view2view:[{id:'nonMatchId', childrenViews:[]}, {id:'parentViewId', childrenViews:[]}]}}]});

		$httpBackend.when('POST', root + '/workspaces/master/elements').respond(function(method, url, data) {

			var json = JSON.parse(data);

			if (!json.elements[0].sysmlid) {
				json.elements[0].sysmlid = json.elements[0].name + 'Id';
			}

			return [200, json];
		});
	}));

	it('can get an instance of the ViewService and methods are valid', inject(function() {
		expect(ViewService).toBeDefined();

		expect(ViewService.getView).not.toBe(null);
		expect(ViewService.getViews).not.toBe(null);
		expect(ViewService.getDocument).not.toBe(null);
		expect(ViewService.updateView).not.toBe(null);
		expect(ViewService.updateDocument).not.toBe(null);
		expect(ViewService.getViewElements).not.toBe(null);
		expect(ViewService.getViewComments).not.toBe(null);
		expect(ViewService.addViewComment).not.toBe(null);
		expect(ViewService.deleteViewComment).not.toBe(null);
		expect(ViewService.updateViewElements).not.toBe(null);
		expect(ViewService.createView).not.toBe(null);
		expect(ViewService.addViewToDocument).not.toBe(null);
		expect(ViewService.getDocumentViews).not.toBe(null);
		expect(ViewService.getSiteDocuments).not.toBe(null);
		expect(ViewService.setCurrentViewId).not.toBe(null);
		expect(ViewService.setCurrentDocumentId).not.toBe(null);
		expect(ViewService.getCurrentViewId).not.toBe(null);
		expect(ViewService.getCurrentDocumentId).not.toBe(null);
	}));

	// just calls ElementService
	it('getView', inject(function() {

	}));

	// just calls ElementService
	it('getViews', inject(function() {

	}));

	// just calls ElementService
	it('getDocument', inject(function() {

	}));

	// just calls ElementService
	it('updateView', inject(function() {

	}));

	// just calls ElementService
	it('updateDocument', inject(function() {

	}));

	// !-- NOTE: uses old web services API --!
	// !-- NOTE: also loses track of version when retrieving from server --!
	// done, expected to fail
	it('getViewElements', inject(function() {
		// (!viewElements.hasOwnProperty(ver) && * && *), fail
		ViewService.getViewElements('badId', false, 'master', '01-01-2014').then(function(response) {
			console.log('This should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
		});
		
		// (!viewElements.hasOwnProperty(ver) && * && *), success, !viewElements.hasOwnProperty(ver)
		ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		}); $httpBackend.flush();
		// viewElements['01-01-2014']['12345'] now exists

		// (viewElements.hasOwnProperty(ver) && !viewElements[ver].hasOwnProperty(id) && *), success, 
		// viewElements.hasOwnProperty(ver)
		ViewService.getViewElements('12345', false, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'07-28-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'07-28-2014'});
		}); $httpBackend.flush();
		// viewElements['latest']['12345'] now exists

		// (viewElements.hasOwnProperty(ver) && viewElements[ver].hasOwnProperty(id) && !update)
		ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		}); $rootScope.$apply();

		// (viewElements.hasOwnProperty(ver) && viewElements[ver].hasOwnProperty(id) && update),
		// success, viewElements.hasOwnProperty(ver)
		ViewService.getViewElements('12345', true, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'07-28-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'07-28-2014'});
		});
	}));

	// !-- NOTE: uses old web services API --!
	// !-- NOTE: also uses a function that requires a site but none is given --!
	// done, expected to fail
	it('getDocumentViews', inject(function() {
		// (!productViews.hasOwnProperty(ver) && * && *), fail
		ViewService.getDocumentViews('badId', false, 'master', '01-01-2014').then(function(response) {
			console.log('This should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
		}); $httpBackend.flush();

		// (!productViews.hasOwnProperty(ver) && * && *), success, !productViews.hasOwnProperty(ver)
		ViewService.getDocumentViews(54321, false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'doc view', owner:54321, sysmlid:54322, lastModified:'01-01-2014'});
		}); $httpBackend.flush();

		// (productViews.hasProperty(ver) && !productViews[ver].hasProperty(id) && *), success
		// productViews.hasOwnProperty(ver)
		ViewService.getDocumentViews(65432, false, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'other id view', owner:65432, sysmlid:65433, lastModified:'07-28-2014'});
		}); $httpBackend.flush();

		// (productViews.hasOwnProperty(ver) && productViews[ver].hasOwnProperty(id) && !update)
		ViewService.getDocumentViews(54321, false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'doc view', owner:54321, sysmlid:54322, lastModified:'01-01-2014'});
		}); $rootScope.$apply();

		// (productViews.hasOwnProperty(ver) && productViews[ver].hasOwnProperty(id) && update)
		// success, productViews.hasOwnProperty(ver)
		ViewService.getDocumentViews(54321, true, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'other id view', owner:65432, sysmlid:65433, lastModified:'07-28-2014'});
		}); $httpBackend.flush();
	}));

	// done, empty
	it('getViewComments', inject(function() {}));

	// done, empty
	it('addViewComment', inject(function() {}));

	// done, empty
	it('deleteViewComment', inject(function() {}));

	// done, empty
	it('updateViewElements', inject(function() {}));

	// done
	it('addViewToDocument', inject(function() {
		// fail
		ViewService.addViewToDocument('viewId', 'badId', 'parentViewId', 'master').then(function(response) {
			console.log('This should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
		}); $httpBackend.flush();

		// success, data.specialization.view2view.length == 0, fail

		// success, data has no specialization
		expect(function() {
			ViewService.addViewToDocument('viewId', 'noSpecDocId', 'parentViewId', 'master');
			$httpBackend.flush();
		}).toThrow(new Error('data.specialization is undefined'));

		// success, data.specialization.view2view.length == 0, success
		ViewService.addViewToDocument('viewId', 'emptyView2ViewDocId', 'parentViewId', 'master')
		.then(function(response) {
			expect(response.sysmlid).toEqual('emptyView2ViewDocId');
			expect(response.specialization.view2view.length).not.toEqual(0);
			expect(response.specialization.view2view[0]).toEqual({id: 'viewId', childrenViews:[]});
		}); $httpBackend.flush();

		// success, data.specialization.view2view.length > 0, fail

		// success, data.specialization.view2view.length > 0, no id match, success
		ViewService.addViewToDocument('viewId', 'noIdMatchDocId', 'parentViewId', 'master')
		.then(function(response) {
			expect(response.sysmlid).toEqual('noIdMatchDocId');
			expect(response.specialization.view2view.length).toEqual(2);
			expect(response.specialization.view2view[0]).toEqual({id:'notMatchingId', childrenViews:[]});
			expect(response.specialization.view2view[1]).toEqual({id: 'viewId', childrenViews:[]});
		}); $httpBackend.flush();

		// success, data.specialization.view2vivew.length > 0, id match, success
		ViewService.addViewToDocument('viewId', 'idMatchDocId', 'parentViewId', 'master')
		.then(function(response) {
			expect(response.sysmlid).toEqual('idMatchDocId');
			expect(response.specialization.view2view.length).toEqual(3);
			expect(response.specialization.view2view[0]).toEqual({id: 'nonMatchId', childrenViews:[]});
			expect(response.specialization.view2view[1]).toEqual({id: 'parentViewId', childrenViews:['viewId']});
			expect(response.specialization.view2view[2]).toEqual({id: 'viewId', childrenViews:[]});
		}); $httpBackend.flush();
	}));

	// !-- NOTE: due to how ElementService.updateElement works the new view's owner property will be deleted --!
	// Test cases assume that ElementService's method both pass correctly
	// done - expect this to fail
	it('createView', inject(function() {

		// createElement - pass, updateElement - pass, !documentId
		ViewService.createView('ownerId', undefined, undefined, 'master').then(function(response) {
			expect(response.owner).toEqual('ownerId');
			expect(response.name).toEqual('Untitled View');
			expect(response.documentation).toEqual('');
			expect(response.specialization.type).toEqual('View');
			expect(response.specialization.contains).toEqual([{type:'Paragraph', sourceType:'reference',
				source: response.sysmlid, sourceProperty:'documentation'}]);
			expect(response.specialization.allowedElements).toEqual([response.sysmlid]);
			expect(response.specialization.displayedElements).toEqual([response.sysmlid]);
			expect(response.specialization.childrenViews).toEqual([]);
		}); $httpBackend.flush();

		// createElement - pass, updateElement - pass, documentId, addViewToDoc - fail

		// createElement - pass, updateElement - pass, documentId, addViewToDoc - pass
		ViewService.createView('ownerId', 'name', 'idMatchDocId', 'master').then(function(response) {
			expect(response.owner).toEqual('ownerId');
			expect(response.name).toEqual('name');
			expect(response.documentation).toEqual('');
			expect(response.specialization.type).toEqual('View');
			expect(response.specialization.contains).toEqual([{type:'Paragraph', sourceType:'reference',
				source: response.sysmlid, sourceProperty:'documentation'}]);
			expect(response.specialization.allowedElements).toEqual([response.sysmlid]);
			expect(response.specialization.displayedElements).toEqual([response.sysmlid]);
			expect(response.specialization.childrenViews).toEqual([]);
		}); $httpBackend.flush();

	}));

	// testable
	it('getSiteDocuments', inject(function() {

		// (!siteDocuments.hasOwnProperty(site) && *), getGenericElements - fail

		// (!siteDocuments.hasOwnProperty(site) && *), getGenericElements - pass

		// (siteDocuments.hasOwnProperty(site) && !update)

	}));

	it('getCurrentViewId', inject(function() {
		expect(ViewService.getCurrentViewId()).toBe('');
	}));

	it('setCurrentViewId', inject(function() {
		ViewService.setCurrentViewId('newViewId');
		expect(ViewService.getCurrentViewId()).toBe('newViewId');
	}));

	it('getCurrentDocumentId', inject(function() {
		expect(ViewService.getCurrentDocumentId()).toBe('');
	}));

	it('setCurrentDocumentId', inject(function() {
		ViewService.setCurrentDocumentId('newDocumentId');
		expect(ViewService.getCurrentDocumentId()).toBe('newDocumentId');
	}));
});
*/

// VizService - incomplete, 1 method, [1 uses $http]
describe('VizService', function() {
	beforeEach(module('mms'));

	var Service;

	it('can get an instance of the VizService and methods are valid', inject(function() {
		expect(VizService).toBeDefined();

		Service = VizService();
		expect(Service.getImageURL).not.toBe(null);
	}));

	// uses $http
	it('getImageURL', inject(function() {

	}));
});
