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

	it('getElement', inject(function() {
		var response;
		//var getElementPromise = Service.getElement(id, 'latest', 'master');

		console.log(response);
	}));
});

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
		var expectedReturn = root + '/javawebscripts/elements/' + id;
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
		var expectedReturn = root + '/javawebscripts/sites/europa/projects/PROJECT-21bbdceb-a188-45d9-a585-b30bba346175/elements';
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

describe('CommentService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the CommentService', inject(function() {
		expect(CommentService).toBeDefined();
	}));

	it('should have an addComment function', inject(function() {
		expect(CommentService.addComment).not.toBe(null);
	}));

	it('should have a getComments function', inject(function() {
		expect(CommentService.getComments).not.toBe(null);
	}));

	it('should have a updateComment function', inject(function() {
		expect(CommentService.updateComment).not.toBe(null);
	}));

	it('should have a deleteComment function', inject(function() {
		expect(CommentService.deleteComment).not.toBe(null);
	}));
});

describe('ElementService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the ElementService and methods are valid', inject(function() {
		expect(ElementService).toBeDefined();
		expect(ElementService.getElements).not.toBe(null);
	}));
});

describe('ProjectService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the ProjectService', inject(function() {
		expect(ProjectService).toBeDefined();
		expect(ProjectService()).toEqual({});
	}))
});