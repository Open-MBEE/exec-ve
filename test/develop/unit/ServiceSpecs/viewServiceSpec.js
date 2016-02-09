//ViewService: createView, createDocument, createInstanceSpecification, getViewElements

'use strict';
describe('ViewService', function() {
	beforeEach(module('mms', function($provide) {}));
    var root = '/alfresco/service';
    var forceFail;
    var ViewService, $httpBackend, $rootScope, ownerId;

	beforeEach(inject(function($injector) {
		ViewService = $injector.get('ViewService');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
		ownerId = {
		    "siteCharacterizationId": "vetest",
		    "qualifiedId": "/vetest/PROJECT-21bbdceb-a188-45d9-a585-b30bba346175/_17_0_5_1_407019f_1402422593316_200143_16117/_17_0_5_1_407019f_1402422683509_36078_16169/MMS_1442345799882_df10c451-ab83-4b99-8e40-0a8e04b38b9d",
		    "nodeRefId": "versionStore://version2Store/9fcf1b57-dcaa-43b2-93bf-0eb6e0a2692a",
		    "versionedRefId": "versionStore://version2Store/f94951b8-7fbd-4a33-8d29-d11876091302",
		    "qualifiedName": "/vetest/VETest/adasdsddd3/Test64 sgfa/test opaquepara",
		    "sysmlid": "MMS_1442345799882_df10c451-ab83-4b99-8e40-0a8e04b38b9d",
		    "isMetatype": false,
		    "editable": true,
		    "creator": "dlam",
		    "modified": "2015-12-17T12:45:15.316-0800",
		    "modifier": "dlam",
		    "created": "Thu Dec 17 12:25:39 PST 2015",
		    "name": "test opaquepara",
		    "documentation": "",
		    "owner": "_17_0_5_1_407019f_1402422683509_36078_16169",
		    "appliedMetatypes": [
		        "_17_0_1_232f03dc_1325612611695_581988_21583",
		        "_9_0_62a020a_1105704885343_144138_7929"
		    ],
		    "read": "2016-02-09T13:57:59.842-0800",
		    "specialization": {
		        "displayedElements": ["MMS_1442345799882_df10c451-ab83-4b99-8e40-0a8e04b38b9d"],
		        "contents": {
		            "operand": [{
		                "type": "InstanceValue",
		                "instance": "MMS_1442345802606_38e60e27-d4b1-47ce-b876-840a2b7e9b3c"
		            }],
		            "type": "Expression"
		        },
		        "allowedElements": [],
		        "contains": [],
		        "type": "View"
		    }
		};
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
		describe('Method CreateView', function() {
			// ViewService.createView(undefined, viewName, undefined, workspace, wsCoverDocId)
			// .then(function(data) {
			// 	return data;
			// }, function(reason) {
			// 	return null;
			// });
			// promise = ViewService.createView($scope.createViewParent, $scope.newView.name, 
			// 								 $scope.document.sysmlid, ws);
			it('create a view similar to the workspace state in app.js', inject(function() {
				ViewService.createView(undefined, 'Untitled View', undefined, 'master', 'viewDoc').then(function(data) {
					// this is a strange ass test basically testing building a json object
					//console.log(data.specialization.contains);
					//console.log("The long object " + JSON.stringify(data));
					//expect(data.owner).toEqual('ownerId');
					expect(data.name).toEqual('Untitled View');
					expect(data.documentation).toEqual('');
					expect(data.specialization.type).toEqual('View');
					// expect(data.specialization.contains).toEqual([{type:'Paragraph', sourceType:'reference',
					// 	source: data.sysmlid, sourceProperty:'documentation'}]);
					// expect(data.specialization.allowedElements).toEqual([data.sysmlid]);
					// expect(data.specialization.displayedElements).toEqual([data.sysmlid]);
					// expect(data.specialization.childrenViews).toEqual([]);
				}, function(reason){
					console.log("this happened" + reason);
				}); 
				$httpBackend.flush();//only because it might call the element service
			}));
			it('create a view similar to the workspace state in the tree controller', inject(function() {
				ViewService.createView(ownerId, 'create view for tree', 'idMatchDocId', 'master').then(function(data){
					//console.log("The long object " + JSON.stringify(data.owner));
					expect(data.owner).toEqual('ownerId');
				},
				function(reason){
					console.log("this happened" + reason);
				});
				$httpBackend.flush();
			}));
		});
		describe('Method createDocument', function() {
			//ViewService.createDocument($scope.doc.name, $scope.addDocSite, ws);
			it('create a document similar to the tree Controller', inject(function() {
				ViewService.createDocument('idMatchDocId','siteId' ,'master').then(function(data){
					console.log("The long object " + JSON.stringify(data.owner));
				},
				function(reason){
					console.log("this happened" + reason);
				});
			}));

		});
	});