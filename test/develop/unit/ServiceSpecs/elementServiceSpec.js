'use strict';
/* ElementService Unit Tests: 
 * Includes: test get and update element, update element that results in 
 * server giving back conflict but in fact not a conflict
 * ElementService - gets:
 * getElement
 *   test inProgress - call getElement with the same arguments 2 times before 
 *   server returns, check the returned promise is the same
 *   test nominal getElement, cache gets populated
 * getElements
 *   avoid unnecessary queries - put some elements in cache, call getElements
 *   with new ids and existing ids together, it should only request the new ids 
 *   from server in the put request but include all elements in resolve
 */

describe('ElementService', function() {
	beforeEach(module('mms'));

	var ElementService, $httpBackend, $rootScope;
	var root = '/alfresco/service';
	var forceEmpty, forceFail, modElements;


	beforeEach(inject(function($injector) {
		ElementService = $injector.get('ElementService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

		forceEmpty = false;
		forceFail = false;
		modElements = false;

		// GetElement responses
		$httpBackend.whenGET(root + '/workspaces/master/elements/12345?timestamp=01-01-2014').respond(
			{ elements: [ { sysmlId:12345, type:'Comment', _modified: '01-01-2014' } ] } );
		$httpBackend.whenGET(root + '/workspaces/master/elements/12345').respond( function(method, url, data) {
			var elements;
			if (forceEmpty)
				elements = { elements: [] };
			else {
				elements = {elements: [ { sysmlId:12345,  type:'Comment',
					_modified: '07-30-2014'} ] };
			}
			return [200, elements];});
		$httpBackend.whenGET(root + '/workspaces/master/elements/12346').respond( function(method, url, data) {
			if (forceFail) {
				return [500, undefined, {status: {code:500, name:'Internal Error',
					description:'An error inside the HTTP server which prevented it from fulfilling the request.'}}];
			} else {
				return [200, { elements: [ { sysmlId: 12346, type:'Package' } ] } ];
			}});

		// GetElement misc responses
		$httpBackend.whenGET(root + '/workspaces/master/elements/badId').respond( function(method, url, data) {
			var error = "[ERROR]: Element with id, badId not found\n[WARNING]: No elements found";
			return [404, error];});
		$httpBackend.whenGET(root + '/workspaces/master/elements/emptyId').respond( { elements: [] });
		$httpBackend.whenGET(root + '/workspaces/master/elements').respond(
			{elements:[ {sysmlId:12345, name:'commentElement', documentation:'old documentation',
			type:'Comment'}, {sysmlId:12346, name:'packageElement',
			type:'Package'}]});
        $httpBackend.whenPUT(root + '/workspaces/master/elements').respond(
    		{elements:[ {sysmlId:12345, name:'commentElement', documentation:'old documentation',
    		type:'Comment'}, {sysmlId:12346, name:'packageElement',
    		type:'Package'}]});

		$httpBackend.whenGET(root + '/workspaces/master/elements/noSpecialization').respond(
			{ elements: [ { sysmlId: 'noSpecialization', documentation: 'has no specialization' } ] } );
		$httpBackend.whenGET(root + '/workspaces/master/elements/operationId').respond(
			{ elements: [ { sysmlId: 'operationId', type: 'Operation',
			parameterIds: [ 'paramId', 'paramId2' ], expressionId: 'expressionId'  } ] } );
		$httpBackend.whenGET(root + '/workspaces/master/elements/productId').respond(
			{ elements: [ { sysmlId: 'productId', type: 'Class',
			view2view: [ { sysmlId: 'viewId', childrenViews:[] } ]} ] } );

		// UpdateElement response
		$httpBackend.whenPOST(root + '/workspaces/master/elements').respond(function(method, url, data) {
			if (forceEmpty) {
				return [200, { elements: [] } ];
			}

			var json = JSON.parse(data);
			if (json.elements[0].sysmlId === 'badId') {
				return [500, 'Internal Server Error'];
			} else {
				if (json.elements[0]) {
					if (json.elements[0].type  === 'Pop-Up') {
						return [400, 'Invalid element type'];
					}
				}
				if (!json.elements[0].sysmlId) {
					json.elements[0].sysmlId = json.elements[0].name;
				}
				return [200, json];
			} });
	}));
    describe('ElementService.getElement() method', function() {
    	it('should get an element not in the cache', inject(function() {
            ElementService.getElement(12345, undefined, undefined, '01-01-2014').then(function(response) {
				expect(response.sysmlId).toEqual( 12345 );
				expect(response.type).toEqual('Comment');
				expect(response._modified).toEqual( '01-01-2014' );
			}); //$httpBackend.flush();

    	}));
    }); //elements: []
    describe('ElementService.getElements() method', function() {
        it('should get elements not in the cache', inject(function() {
            var ids=[];
            // Couple valid ids
            ids = ['12345', '12346'];
            ElementService.getElements(ids, undefined, undefined, undefined).then(function(response) {
                //console.log(response);
                expect(response.length).toEqual(2);

                expect(response[0].sysmlId).toEqual(12345);
                expect(response[0].type).toEqual('Comment');
                //expect(response[0].lastModified).toEqual( '07-30-2014' );

                expect(response[1].sysmlId).toEqual(12346);
                expect(response[1].type).toEqual( 'Package');
            }); //$httpBackend.flush();

        }));
    });
    describe('ElementService.updateElement() method', function() {  //--talk to doris
        it('should update a element not in the cache without passing a workspace', inject(function() {
            var elem = { sysmlId: '12345', _modified:'never' };
    		ElementService.updateElement(elem, undefined).then(function(response) {
    			expect(response).toEqual(elem);
    		});
            ElementService.getElement(12345).then(function(response) {
				expect(response._modified).toEqual( 'never' );
			}); //$httpBackend.flush();
        }));
    });
		
		describe('ElementService.getIdInfo() method', function () {
        var element = getJSONFixture('UtilsService/getIdInfo.json'); //TODO move json to ElementService mock data
        it('should generate a new element with holdingBin, projectId, siteId, and projectName', inject(function () {
            var result = ElementService.getIdInfo(element, "MERP");
            expect(result).toBeDefined();

            var baseline = {
                holdingBinId: null,
                projectId   : 'test-site_no_project',
                siteId      : 'test-site',
                projectName : null
            };
            expect(JSON.stringify(baseline)).toMatch(JSON.stringify(result["$$state"]["value"]));
        }));
    });
});
