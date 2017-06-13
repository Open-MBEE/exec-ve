//This does not need to be tested (6/4/17)
"use strict";

describe("URLService", function () {
    beforeEach(module('mms'));

    var mockApplicationService, URLServiceObj, $httpBackend, $rootScope, $http, $q, root;

    beforeEach(inject(function ($injector) {
        URLServiceObj   = $injector.get('URLService');
        $http        = $injector.get('$http');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope   = $injector.get('$rootScope');
        $q           = $injector.get('$q');
        it('should get the root url', inject(function () {
            root = URLServiceObj.getRoot();
            expect(root).toBeDefined();
        }));

        $httpBackend.when('GET', root + '/mmsversion').respond(
            function (method, url, data) {
                return [200, {mmsVersion: "2.3.8"}];
            }
        );
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingRequest();
    });


    describe('Method getMmsVersionURL', function () {
        it('should return the root url with /mmsversion appended to the string', inject(function () {
            var mmsUrl = URLServiceObj.getMmsVersionURL();
            expect('/alfresco/service/mmsversion').toMatch(mmsUrl.toString());
        }))
    });

    describe('Method getHtmlToPdfURL', function () {
        var tmpId        = 1234;
        var project = "this_isnt_your_project";
        var ref      = "dont_go_to_this_site";
        var htmlToPdfURL;
        it('should generate a Html to PDF url', inject(function () {
            htmlToPdfURL = root + "/projects/" + project + "/refs/" + ref + "/documents/" + tmpId + "/htmlToPdf/123456789";
            expect(htmlToPdfURL).toMatch(URLServiceObj.getHtmlToPdfURL(tmpId, project, ref));
        }));
    });

    describe('Method getCheckLoginURL', function () {
        it("should create the checklogin url used to check login for Alfresco", inject(function () {
            var checkLoginUrl = root + '/checklogin';
            expect(checkLoginUrl).toMatch(URLServiceObj.getCheckLoginURL());
        }));
    });

    describe('Method getOrgsURL', function() {
    	it("should create the url for organizations", function() {
    		var orgsUrl = root + '/orgs';
    		expect(orgsUrl).toMatch(URLServiceObj.getOrgsURL());
    	});
    });

    describe('Method getProjectsURL', function() {
    	var orgId = 'hereisanorg';
    	var projectId = 'hereisaproject';
    	it("should create the url for projects", function() {
    		var projectsUrl = root + '/orgs/' + orgId + '/projects';
    		expect(projectsUrl).toMatch(URLServiceObj.getProjectsURL(orgId));
    	});
    });

    describe('Method getProjectURL', function() {
    	var projectId = 'hereisaproject';
    	it("should create the url for a project", function() {
    		var projectUrl = root + '/projects/' + projectId;
    		expect(projectUrl).toMatch(URLServiceObj.getProjectURL(projectId));
    	});
    });

    describe('Method getProjectMountsURL', function() {
    	var projectId = 'hereisaproject';
    	var refId = 'thisisaref';
    	it("should create the url for the mounts of a project", function() {
    		var projectMountsUrl = root + '/projects/' + projectId + '/refs/' + refId + '/mounts';
    		expect(projectMountsUrl).toMatch(URLServiceObj.getProjectMountsURL(projectId, refId));
    	});
    });

    describe('Method getRefsURL', function() {
    	var projectId = 'hereisaproject';
    	it("should create the url for the refs of a project", function() {
    		var refsUrl = root + '/projects/' + projectId + '/refs';
    		expect(refsUrl).toMatch(URLServiceObj.getRefsURL(projectId));
    	});
    });

    describe('Method getRefURL', function() {
    	var projectId = 'hereisaproject';
    	var refId = 'thisisaref';
    	it("should create the url for the refs of a project", function() {
    		var refUrl = root + '/projects/' + projectId + '/refs/' + refId;
    		expect(refUrl).toMatch(URLServiceObj.getRefURL(projectId, refId));
    	});
    });

    describe('Method getGroupsURL', function() {
    	var projectId = 'hereisaproject';
    	var refId = 'thisisaref';
    	it("should create the url for the groups of a project", function() {
    		var groupsUrl = root + '/projects/' + projectId + '/refs/' + refId + '/groups';
    		expect(groupsUrl).toMatch(URLServiceObj.getGroupsURL(projectId, refId));
    	});
    });

    describe('Method getProjectDocumentsURL', function() {
    	var reqOb = {
			projectId: "heyaproject",
			elementId: "heyanelement",
			refId: 'master',
			commitId: 'latest'
		};
    	it("should create the url for the refs of a project", function() {
    		var projectDocumentsUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/documents';
    		expect(projectDocumentsUrl).toMatch(URLServiceObj.getProjectDocumentsURL(reqOb));
    	});
    });

    describe('Method getImageURL', function() { //not sure what's happening with this
    	var reqOb = {
			projectId: "heyaproject",
			elementId: "heyanelement",
			refId: 'master',
			commitId: 'latest',
			accept: true
		};
    	it("should create the url for an image", function() {
    		var imageUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/artifacts/' + reqOb.elementId + '?accept=' + reqOb.accept;
    		expect(imageUrl).toMatch(URLServiceObj.getImageURL(reqOb));
    	});
    });

    describe('Method getElementURL', function() { //not sure what's happening with this
    	var reqOb = {
			projectId: "heyaproject",
			elementId: "heyanelement",
			refId: 'master',
			commitId: 'latest',
			accept: true
		};
    	it("should create the url for an element", function() {
    		var elementUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
    		expect(elementUrl).toMatch(URLServiceObj.getElementURL(reqOb));
    	});
    });

  //   describe('Method getOwnedElementURL', function () {
  //   	var reqOb = {
		// 	projectId: "heyaproject",
		// 	elementId: "heyanelement",
		// 	refId: 'master',
		// 	commitId: 'latest',
		// 	depth: 15,
		// 	extended: true
		// };
  //       it('should create the url for all owned elements', inject(function () {
  //  			var ownedElementUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
  //           expect(ownedElementUrl).toEqual(URLServiceObj.getOwnedElementURL(reqOb));
  //       }));
  //   });

    describe('Method getDocumentViewsURL', function () {
    	var reqOb = {
			projectId: "heyaproject",
			elementId: "heyanelement",
			refId: 'master',
			commitId: 'latest',
			accept: true
		};
        it('should create the url for the document views', function () {
        	var documentViewsUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/documents/' + reqOb.elementId + '/views';
        	expect(documentViewsUrl).toMatch(URLServiceObj.getDocumentViewsURL(reqOb));
        });
    });

    describe('Method getElementHistoryURL', function () {
    	var reqOb = {
			projectId: "heyaproject",
			elementId: "heyanelement",
			refId: 'master',
			commitId: 'latest',
			accept: true
		};
        it('should create the url to query for element history', function () {
        	var elementHistoryUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/history';
        	expect(elementHistoryUrl).toMatch(URLServiceObj.getElementHistoryURL(reqOb));
        });
    });

    describe('Method getPostElementsURL', function () {
    	var reqOb = {
			projectId: "heyaproject",
			elementId: "heyanelement",
			refId: 'master',
			commitId: 'latest',
			extended: true,
			returnChildViews: true
		};
        it('should create the url for posting element changes', function () {
        	var postElementsUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/history';
        	expect(postElementsUrl).toMatch(URLServiceObj.getPostElementsURL(reqOb));

        	var postElementsUrlEx = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/history' + '&extended=' + reqOb.extended;
        	expect(postElementsUrlEx).toMatch(URLServiceObj.getPostElementsURL(reqOb));

        	var postElementsUrlEx = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/history' + '?extended=' + reqOb.extended;
        	expect(postElementsUrlEx).toMatch(URLServiceObj.getPostElementsURL(reqOb));

        	var postElementsUrlCh = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/history';
        	expect(postElementsUrl).toMatch(URLServiceObj.getPostElementsURL(reqOb));

        	var postElementsUrlTk = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/history';
        	expect(postElementsUrl).toMatch(URLServiceObj.getPostElementsURL(reqOb));
        });
    });

    // xdescribe('Method handleHttpStatus', function () {
    //     var data     = "merp";
    //     var statuses = [404, 401, 403, 409, 400, 410, 408, 500, 501];
    //     var header   = {"merp": "derp"};
    //     var config   = "This is a config";
        
    //     it('set the state of a deferred object based on the status of http 404 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Not Found").toEqual(URLServiceObj.handleHttpStatus(data, 404, header, config, deferred));
    //         deferred.resolve();
    //     });
    //     it('set the state of a deferred object based on the status of http 401 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Permission Error").toEqual(URLServiceObj.handleHttpStatus(data, 401, header, config, deferred));
    //         deferred.resolve();
    //     });
    //     it('set the state of a deferred object based on the status of http 403 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Permission Error").toEqual(URLServiceObj.handleHttpStatus(data, 403, header, config, deferred));
    //         deferred.resolve();
    //     });
    //     it('set the state of a deferred object based on the status of http 409 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Conflict").toEqual(URLServiceObj.handleHttpStatus(data, 409, header, config, deferred));
    //         deferred.resolve();
    //     });
    //     it('set the state of a deferred object based on the status of http 400 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Bad Request").toEqual(URLServiceObj.handleHttpStatus(data, 400, header, config, deferred));
    //         deferred.resolve();
    //     });
    //     it('set the state of a deferred object based on the status of http 410 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Deleted").toEqual(URLServiceObj.handleHttpStatus(data, 410, header, config, deferred));
    //         deferred.resolve();
    //     });
    //     it('set the state of a deferred object based on the status of http 408 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Timed Out").toEqual(URLServiceObj.handleHttpStatus(data, 408, header, config, deferred));
    //         deferred.resolve();
    //     });
    //     it('set the state of a deferred object based on the status of http 501 status', function () {
    //     	var deferred = $q.defer();
    //     	var promise = deferred.promise;
    //         expect("Cacheing").toEqual(URLServiceObj.handleHttpStatus(data, 501, header, config, deferred));
    //         deferred.resolve();
    //     });
    // });

    describe('Method getElementSearchURL', function () {
    	var reqOb = {
			projectId: "heyaproject",
			elementId: "heyanelement",
			refId: 'master',
			commitId: 'latest',
			accept: true
		};
        it('should create the url to query for element keyword search', function () {
        	var elementSearchUrl = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/search';
        	expect(elementSearchUrl).toMatch(URLServiceObj.getElementSearchURL(reqOb));
        });
    });

});
