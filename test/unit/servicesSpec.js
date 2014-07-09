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

// ConfigService - incomplete, 10 methods, [10 use $http]
describe('ConfigService', function() {
	beforeEach(module('mms'));

	var workspace = 'master';

	var Service;

	it('can get an instance of the ConfigService', inject(function() {
		expect(ConfigService).toBeDefined();

		Service = ConfigService();
		expect(Service.getSiteConfigs).not.toBe(null);
		expect(Service.getConfig).not.toBe(null);
		expect(Service.getConfigProducts).not.toBe(null);
		expect(Service.getConfigProducts).not.toBe(null);
		expect(Service.getConfigSnapshots).not.toBe(null);
		expect(Service.updateConfig).not.toBe(null);
		expect(Service.createConfig).not.toBe(null);
		expect(Service.updateConfigSnapshots).not.toBe(null);
		expect(Service.updateConfigProducts).not.toBe(null);
		expect(Service.createSnapshots).not.toBe(null);
	}));

	// accesses $http - untested
	it('getSiteConfigs', inject(function() {

	}));

	// accesses $http - untested
	it('getConfig', inject(function() {

	}));

	// accesses $http - untested
	it('getConfigProducts', inject(function() {

	}));

	// accesses $http - untested
	it('getConfigSnapshots', inject(function() {

	}));

	// accesses $http - untested
	it('getProductSnapshots', inject(function() {

	}));

	// accesses $http - untested
	it('updateConfig', inject(function() {

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

// ElementService - incomplete, 12 methods, [1 empty, 10 use $http, 1 other]
describe('ElementService', function() {
	beforeEach(module('mms'));

	var Service;

	it('can get an instance of the ElementService and methods are valid', inject(function() {
		expect(ElementService).toBeDefined();

		Service = ElementService();
		expect(Service.getElement).not.toBe(null);
		expect(Service.getElements).not.toBe(null);
		expect(Service.getElementsForEdit).not.toBe(null);
		expect(Service.getOwnedElements).not.toBe(null);
		expect(Service.updateElement).not.toBe(null);
		expect(Service.updateElements).not.toBe(null);
		expect(Service.createElement).not.toBe(null);
		expect(Service.createElements).not.toBe(null);
		expect(Service.getGenericElements).not.toBe(null);
		expect(Service.isDirty).not.toBe(null);
		expect(Service.search).not.toBe(null);
	}));

	// accesses $http - untested
	it('getElement', inject(function() {

	}));

	// accesses $http - untested
	it('getElements', inject(function() {

	}));

	// accesses $http - untested
	it('getElementForEdit', inject(function() {

	}));

	// accesses $http - untested
	it('getElementsForEdit', inject(function() {

	}));

	// is an empty function
	it('getOwnedElements', inject(function() {}));

	// accesses $http - untested
	it('updateElement', inject(function() {

	}));

	// accesses $http - untested
	it('updateElements', inject(function() {

	}));

	// accesses $http - untested
	it('createElement', inject(function() {

	}));

	// accesses $http - untested
	it('createElements', inject(function() {

	}));

	// accesses $http - untested
	it('getGenericElements', inject(function() {

	}));

	// needs clever way to test
	it('isDirty', inject(function() {

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

// SearchService - incomplete, 1 method, [1 uses $http]
describe('SearchService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the SearchService and methods are valid', inject(function() {
		expect(SearchService).toBeDefined();

		expect(SearchService.searchElements).not.toBe(null);
	}));

	// accesses $http - untested
	it('searchElements', inject(function() {

	}));
});

// SiteService - incomplete, 7 methods, [2 use $http, 4 tested, 1 empty]
describe('SiteService', function() {
	beforeEach(module('mms'));

	var Service;

	it('can get an instance of the SiteService and methods are valid', inject(function() {
		expect(SiteService).toBeDefined();

		Service = SiteService();
		expect(Service.getCurrentSite).not.toBe(null);
		expect(Service.setCurrentSite).not.toBe(null);
		expect(Service.getCurrentWorkspace).not.toBe(null);
		expect(Service.setCurrentWorkspace).not.toBe(null);
		expect(Service.getSites).not.toBe(null);
		expect(Service.getSite).not.toBe(null);
		expect(Service.getSiteProjects).not.toBe(null);
	}));

	it('getCurrentSite', inject(function() {
		expect(Service.getCurrentSite()).toBe('europa');
	}));

	it('setCurrentSite', inject(function() {
		Service.setCurrentSite('notEuropa');
		expect(Service.getCurrentSite()).toBe('notEuropa');
	}));

	it('getCurrentWorkspace', inject(function() {
		expect(Service.getCurrentWorkspace()).toBe('master');
	}));

	it('setCurrentWorkspace', inject(function() {
		Service.setCurrentWorkspace('notMaster');
		expect(Service.getCurrentWorkspace()).toBe('notMaster');
	}))

	// accesses $http - untested
	it('getSites', inject(function() {

	}));

	// accesses $http - untested
	it('getSite', inject(function() {

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

// UtilsService - incomplete, 2 methods, [2 other]
describe('UtilsService', function() {
	beforeEach(module('mms'));

	var Service;

	it('can get an instance of the UtilsService and methods are valid', inject(function() {
		expect(UtilsService).toBeDefined();

		Service = UtilsService();
		expect(Service.hasCircularReference).not.toBe(null);
		expect(Service.cleanElement).not.toBe(null);
	}));

	// will need to come up with way to test this
	it('hasCircularReference', inject(function() {

	}));

	// will also need to come up with way to test this
	it('cleanElement', inject(function() {

	}));

});

// VersionService - incomplete, 4 methods, [4 use $http]
describe('VersionService', function() {
	beforeEach(module('mms'));

	var id = 'id';
	var version = 'latest';
	var workspace = 'master';

	var Service;

	it('can get an instance of VersionService', inject(function() {
		expect(VersionService).toBeDefined();

		Service = VersionService();
		expect(Service.getElement).toBeDefined();
		expect(Service.getElements).toBeDefined();
		expect(Service.getElementVersions).toBeDefined();
		expect(Service.getGenericElements).toBeDefined();
	}));

	// uses $http 
	it('getElement', inject(function() {
		
	}));

	// uses $http
	it('getElements', inject(function() {

	}));

	// uses $http
	it('getElementVersions', inject(function() {

	}));

	// uses $http
	it('getGenericElements', inject(function() {

	}));
});

// ViewService - incomplete, 18 methods, [4 empty,  4 tested, 10 use $http]
describe('ViewService', function() {
	beforeEach(module('mms'));

	var Service;

	it('can get an instance of the ViewService and methods are valid', inject(function() {
		expect(ViewService).toBeDefined();

		Service = ViewService();
		expect(Service.getView).not.toBe(null);
		expect(Service.getViews).not.toBe(null);
		expect(Service.getDocument).not.toBe(null);
		expect(Service.updateView).not.toBe(null);
		expect(Service.updateDocument).not.toBe(null);
		expect(Service.getViewElements).not.toBe(null);
		expect(Service.getViewComments).not.toBe(null);
		expect(Service.addViewComment).not.toBe(null);
		expect(Service.deleteViewComment).not.toBe(null);
		expect(Service.updateViewElements).not.toBe(null);
		expect(Service.createView).not.toBe(null);
		expect(Service.addViewToDocument).not.toBe(null);
		expect(Service.getDocumentViews).not.toBe(null);
		expect(Service.getSiteDocuments).not.toBe(null);
		expect(Service.setCurrentViewId).not.toBe(null);
		expect(Service.setCurrentDocumentId).not.toBe(null);
		expect(Service.getCurrentViewId).not.toBe(null);
		expect(Service.getCurrentDocumentId).not.toBe(null);
	}));

	// calls on ElementService and therefore $http
	it('getView', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('getViews', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('getDocument', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('updateView', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('updateDocument', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('getViewElements', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('getDocumentViews', inject(function() {

	}));

	// empty function
	it('getViewComments', inject(function() {}));

	// empty function
	it('addViewComment', inject(function() {}));

	// empty function
	it('deleteViewComment', inject(function() {}));

	// empty function
	it('updateViewElements', inject(function() {}));

	// calls on getDocument and therefore $http
	it('addViewToDocument', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('createView', inject(function() {

	}));

	// calls on ElementService and therefore $http
	it('getSiteDocuments', inject(function() {

	}));

	it('getCurrentViewId', inject(function() {
		expect(Service.getCurrentViewId()).toBe('');
	}));

	it('setCurrentViewId', inject(function() {
		Service.setCurrentViewId('newViewId');
		expect(Service.getCurrentViewId()).toBe('newViewId');
	}));

	it('getCurrentDocumentId', inject(function() {
		expect(Service.getCurrentDocumentId()).toBe('');
	}));

	it('setCurrentDocumentId', inject(function() {
		Service.setCurrentDocumentId('newDocumentId');
		expect(Service.getCurrentDocumentId()).toBe('newDocumentId');
	}))
});

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
