//ViewService: createView, createDocument, createInstanceSpecification, getViewElements

'use strict';
describe('CacheService', function() {
	beforeEach(module('mms', function($provide) {}));
    var root = '/alfresco/service';
    var forceFail;
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

        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/products').respond(function(method, url, data) {
            if (forceFail) { return [500, 'Internal Server Error']; }
            else {
                var products = { products: [ { id: 'productId', name: 'Product Name', snapshots: [ { created: '01-01-2014', creator: 'muschek',
                id: 'snapshotId' } ] } ] };
                return [200, products];
            }
        });    
    }));