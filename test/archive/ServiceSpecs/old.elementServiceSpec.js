'use strict';

// ElementService - done, 12 methods, [10 done, 1 empty, 1 untested], expect 4 to fail
describe('ElementService', function() {
	beforeEach(module('mms'));

	var myElementService, $httpBackend, $rootScope;

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

		// UpdateElement response
		$httpBackend.whenPOST(root + '/workspaces/master/elements').respond(function(method, url, data) {
			if (forceEmpty) {
				return [200, { elements: [] } ];
			}

			var json = JSON.parse(data);
			if (json.elements[0].sysmlid === 'badId') {
				return [500, 'Internal Server Error'];
			} else {
				if (json.elements[0].specialization) {
					if (json.elements[0].specialization.type  === 'Pop-Up') {
						return [400, 'Invalid element type'];
					}
				}
				if (!json.elements[0].sysmlid) {
					json.elements[0].sysmlid = json.elements[0].name;
				}
				return [200, json];
			} });

		$httpBackend.whenGET(root + '/workspaces/master/elements?search=muschek').respond(function(method, url, data) {
			if (forceFail) { return [500, 'Internal Server Error']; }
			else {
				var elements = { elements: [ { sysmlid: 'commentId', author: 'muschek', specialization: { type: 'muschek' } }, 
				{ sysmlid: 'packageId', author: 'muschek', specialization: { type: 'muschek' } }, 
				{ sysmlid: 'paramId', description: 'Chris Muschek want to use this parameter for blah, blah, blah...', specialization: 
				{ type: 'Parameter', direction: 'one', parameterType: 'band name', defaultValue: undefined } } ] };

				if (modElements) {
					elements.push( { sysmlid: 'imageId', specialization: { type: 'Image', sysmlid: 'imageSpecId' }, name: 'muschek\'s image' } );
				}

				return [200, elements];
			}
		})
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

		
		//	Cannot exist because the 'elements' cache does not change between the two checks.
		// 		!(inProgress.hasOwnProperty(key)), (ver === 'latest'), !(elements.hasOwnProperty(id)),
		//		$http.get - pass, (data.elements.length > 0), (elements.hasOwnProperty(id))
		

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

		
		//	Cannot exist because the 'elements' cache does not change between the two checks.
		//		!(inProgress.hasOwnProperty(key)), (ver === 'latest'), (elements.hasOwnProperty(id)),
		//		!(!update), $http.get - pass, (data.elements.length > 0), !(elements.hasOwnProperty(id))
		

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

		
		//	!(edits.hasOwnProperty(id) && !update), getElement - fail
		//		a. (edits.hasOwnProperty(id) && update)
		//		b. (!edits.hasOwnProperty(id) && !update)
		
		ElementService.getElementForEdit('badId', true, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(404);
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();

		
		//	!(edits.hasOwnProperty(id) && !update), getElement - pass, !(edits.hasOwnProperty(id)), 
		//	!(edit.hasOwnProperty('specialization'))
		
		ElementService.getElementForEdit('noSpecialization', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('noSpecialization');
			expect(response.documentation).toEqual('has no specialization');
			expect(response.specialization).toEqual(undefined);
		}); $httpBackend.flush();
		// edits[noSpecialization] now exists

		
		//	!(edits.hasOwnProperty(id) && !update), getElement - pass, !(edits.hasOwnProperty(id)), 
		//	(edit.hasOwnProperty('specialization')), !(edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		ElementService.getElementForEdit('operationId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization.type).toEqual('Operation');
			expect(response.specialization.parameters.length).toEqual(2);
			expect(response.specialization.expresion).toEqual('expressionId');
		}); $httpBackend.flush();
		// edits[operationId] now exists

		
		//	!(edits.hasOwnProperty(id) && !update), getElement - pass, !(edits.hasOwnProperty(id)), 
		//	(edit.hasOwnProperty('specialization')), (edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		ElementService.getElementForEdit('productId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('productId');
			expect(response.specialization.type).toEqual('Product');
			expect(response.specialization.noSections).toEqual( [] );
			expect(response.specialization.view2view).toEqual( undefined );
		}); $httpBackend.flush();
		// edits[productId] now exists

		
		//	!(edits.hasOwnProperty(id) && !update), getElement - pass, (edits.hasOwnProperty(id)), 
		//	!(edit.hasOwnProperty('specialization'))
		
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

		
		//	!(edits.hasOwnProperty(id) && !update), getElement - pass, (edits.hasOwnProperty(id)), 
		//	(edit.hasOwnProperty('specialization')), !(edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		ElementService.getElementForEdit('operationId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization.type).toEqual('Operation');
			expect(response.specialization.parameters.length).toEqual(2);
			expect(response.specialization.expresion).toEqual('expressionId');

			// now add documentation, to show for a change
			response.documentation = 'operations do not have non-editable properties';
		}); $httpBackend.flush();

		 
		// !-- NOTE: I'm not sure if the element for edit that has been updated from the server,
		// ought to have the documentation property if it did not already exist, but currently,
		// it does. -- !
		
		//After an edit has been made.
		ElementService.getElementForEdit('operationId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization.type).toEqual('Operation');
			expect(response.specialization.parameters.length).toEqual(2);
			expect(response.specialization.expresion).toEqual('expressionId');
			expect(response.documentation).toEqual('operations do not have non-editable properties');
		}); $httpBackend.flush();

		
		//	!(edits.hasOwnProperty(id) && !update), getElement - pass, (edits.hasOwnProperty(id)), 
		//	(edit.hasOwnProperty('specialization')), (edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		ElementService.getElementForEdit('productId', true, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('productId');
			expect(response.specialization.type).toEqual('Product');
			expect(response.specialization.noSections).toEqual( [] );
			expect(response.specialization.view2view).toEqual( undefined );

			// make an edit
			response.documentation = 'products have non-editable properties';
		}); $httpBackend.flush();

		 
		// !-- NOTE: I'm not sure if the element for edit that has been updated from the server,
		// ought to have the documentation property if it did not already exist, but currently,
		// it does. -- !
		
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

	// !-- NOTE: when trying to remove attributes from the specialization that should
	// not be editable function actually removes nothing. --!
	// done - 2 expected to fail
	it('updateElement', inject(function() {

		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - fail
		
		var elem = { sysmlid: 'badId', specialization: { type: 'Package' } }
		ElementService.updateElement(elem, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();

		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	!(elements.hasOwnProperty(elem.sysmlid)), !(edits.hasOwnProperty(elem.sysmlid))
		
		elem = { sysmlid: '1', specialization: { type: 'Project', version: 'v1' } };
		ElementService.updateElement(elem, undefined).then(function(response) {
			expect(response).toEqual(elem);
		}); $httpBackend.flush();
		// elements[1] now exists

		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	!(elements.hasOwnProperty(elem.sysmlid)), (edits.hasOwnProperty(elem.sysmlid)),
		//	!(edit.hasOwnProperty('specialization'))
		
		var elem2;
		ElementService.getElementForEdit('noSpecialization', true, 'master').then( function(response) {
			expect(response.sysmlid).toEqual('noSpecialization');
			expect(response.owner).toEqual(undefined);
			expect(response.specialization).toEqual(undefined);
			expect(response.name).toEqual(undefined);
			elem2 = response;
		}); $httpBackend.flush();
		// edits[noSpecialization] now exists

		elem = { sysmlid: 'noSpecialization', documentation: 'has no specialization', name: 'noSpecialization' };
		ElementService.updateElement(elem, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('noSpecialization');
			expect(response.documentation).toEqual('has no specialization');
			expect(response.name).toEqual('noSpecialization');

			// Element checked out for editing, was updated when updateElement was called.
			expect(elem2).toEqual(response);
			expect(elem2.name).toEqual('noSpecialization');
		}); $httpBackend.flush();
		// elements[noSpecialization] now exists


		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	!(elements.hasOwnProperty(elem.sysmlid)), (edits.hasOwnProperty(elem.sysmlid)),
		//	(edit.hasOwnProperty('specialization')), !(edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		ElementService.getElementForEdit('operationId', true, 'master').then( function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization).not.toEqual(undefined);
			// Operation elements do not have non-editable properties
			expect(response.specialization.type).toEqual('Operation');
			expect(response.name).toEqual(undefined);
			elem2 = response;
		}); $httpBackend.flush();
		// edits[operationId] now exists

		elem = { sysmlid: 'operationId', name: 'operationElement', specialization: { type: 'Operation', 
			parameters: [ 'paramId', 'paramId2' ], expresion: 'expressionId' } };
		ElementService.updateElement(elem, undefined).then( function(response) {
			expect(response.sysmlid).toEqual('operationId');
			expect(response.specialization.type).toEqual('Operation');
			expect(response.specialization.parameters).toEqual( [ 'paramId', 'paramId2' ] );
			expect(response.specialization.expresion).toEqual('expressionId');
			expect(response.name).toEqual('operationElement');

			expect(elem2.name).toEqual(response.name);
		}); $httpBackend.flush();
		// elements[operationId] now exists
		

		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	!(elements.hasOwnProperty(elem.sysmlid)), (edits.hasOwnProperty(elem.sysmlid)),
		//	(edit.hasOwnProperty('specialization')), (edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		ElementService.getElementForEdit('productId', true, 'master').then( function(response) {
			expect(response.sysmlid).toEqual('productId');
			expect(response.specialization).not.toEqual(undefined);
			// Product elements have non-editable properties
			expect(response.specialization.type).toEqual('Product');
			expect(response.name).toEqual(undefined);
			expect(response.specialization.view2view).toEqual(undefined);
			elem2 = response;
		}); $httpBackend.flush();
		// edits[productId] now exists

		elem = { sysmlid: 'productId', name: 'productElement', specialization: { type: 'Product', 
			view2view: [ { sysmlid: 'viewId', childrenViews:[] }, { sysmlid: 'viewId2', childrenViews: [] } ],
			noSections: [] } };
		ElementService.updateElement(elem, undefined).then( function(response) {
			expect(response.sysmlid).toEqual('productId');
			expect(response.specialization.type).toEqual('Product');
			expect(response.specialization.view2view).toEqual( undefined );
			expect(response.name).toEqual('productElement');

			// Element checked out for edits was updated.
			expect(elem2.name).toEqual(response.name);
		}); $httpBackend.flush();
		// elements[productId] now exists

		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	(elements.hasOwnProperty(elem.sysmlid)), !(edits.hasOwnProperty(elem.sysmlid))
		
		elem = { name: '2', specialization: { type: 'Project', version: 'v2' } };
		ElementService.createElement(elem, 'master').then( function(response) {
			expect(response.sysmlid).toBeDefined();
			expect(response.name).toEqual('2');
			expect(response.specialization.type).toEqual('Project');
			expect(response.specialization.version).toEqual('v2');
			elem = response;
		}); $httpBackend.flush();
		// elements[2] now exists

		elem2 = { sysmlid: '2', name: '2', documentation: 'Second project element',
			specialization: { type: 'Project', version: 'v2' } };
		ElementService.updateElement(elem2, undefined).then( function(response) {
			expect(response.sysmlid).toEqual('2');
			expect(response.name).toEqual('2');
			expect(response.specialization.type).toEqual('Project');
			expect(response.specialization.version).toEqual('v2');
			expect(response.documentation).toEqual('Second project element');

			// Updates elements that are not even checked out for edit.
			expect(elem.documentation).toEqual('Second project element');
			elem2 = response;
		}); $httpBackend.flush();
		// edits[2] now exists

		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	(elements.hasOwnProperty(elem.sysmlid)), (edits.hasOwnProperty(elem.sysmlid)),
		//	!(edit.hasOwnProperty('specialization'))
		
		elem = { name: 'noSpec2' };
		ElementService.createElement(elem, 'master').then(function(response) {
			expect(elem.sysmlid).not.toBeDefined();
			expect(response.sysmlid).toEqual('noSpec2');
			expect(response.name).toEqual('noSpec2');
			elem = response;
		}); $httpBackend.flush();
		// elements[noSpec2] now exists

		ElementService.getElementForEdit('noSpec2', false, 'master').then(function(response) {
			expect(response).toEqual(elem);
			elem2 = response;
		}); $rootScope.$apply();
		// edits[noSpec2] now exists

		var elem3 = { sysmlid: 'noSpec2', name: 'noSpec2', author: 'muschek' };
		// Edit the element checked out for editing
		elem2.documentation = 'Another element without a specialization';
		ElementService.updateElement(elem3, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('noSpec2');
			expect(response.name).toEqual('noSpec2');
			expect(response.author).toEqual('muschek');
			expect(response.documentation).not.toBeDefined();

			// Expect the element checked out for editing to be updated and maintain it's own properties.
			expect(elem2.author).toEqual('muschek');
			expect(elem2.documentation).toEqual('Another element without a specialization');

			// Expect element not checked for editing to still be updated.
			expect(elem.author).toEqual('muschek');
			expect(elem.documentation).not.toBeDefined();
		}); $httpBackend.flush();


		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	(elements.hasOwnProperty(elem.sysmlid)), (edits.hasOwnProperty(elem.sysmlid)),
		//	(edit.hasOwnProperty('specialization')), !(edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		elem = { name: 'package2', specialization: { type: 'Package' } };
		ElementService.createElement(elem, 'master').then(function(response) {
			expect(elem.sysmlid).not.toBeDefined();
			expect(response.sysmlid).toEqual('package2');
			expect(response.name).toEqual('package2');
			expect(response.specialization.type).toEqual('Package');
			elem = response;
		}); $httpBackend.flush();
		// elements[package2] now exists

		ElementService.getElementForEdit('package2', false, 'master').then(function(response) {
			expect(response).toEqual(elem);
			elem2 = response;
		}); $rootScope.$apply();
		// edits[noSpec2] now exists

		elem3 = { sysmlid: 'package2', name: 'package2', author: 'muschek' };
		// Edit the element checked out for editing
		elem2.documentation = 'Another package element';
		ElementService.updateElement(elem3, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('package2');
			expect(response.name).toEqual('package2');
			expect(response.author).toEqual('muschek');
			expect(response.documentation).not.toBeDefined();

			// Expect the element checked out for editing to be updated and maintain it's own properties.
			expect(elem2.author).toEqual('muschek');
			expect(elem2.documentation).toEqual('Another package element');

			// Expect element not checked for editing to still be updated.
			expect(elem.author).toEqual('muschek');
			expect(elem.documentation).not.toBeDefined();
		}); $httpBackend.flush();

		
		//	!(!elem.hasOwnProperty('sysmlid')), !(elem.hasOwnProperty('owner')), $http.post - pass,
		//	(elements.hasOwnProperty(elem.sysmlid)), (edits.hasOwnProperty(elem.sysmlid)),
		//	(edit.hasOwnProperty('specialization')), (edit.specialization.hasOwnProperty(nonEditKeys[i]))
		
		elem = { name: 'view', specialization: { type: 'View', contains: [], displayedElements: [], allowedElements: [],
			childrenViews: [] } };
		ElementService.createElement(elem, 'master').then(function(response) {
			expect(elem.sysmlid).not.toBeDefined();
			expect(response.sysmlid).toEqual('view');
			expect(response.name).toEqual('view');
			expect(response.specialization.type).toEqual('View');
			expect(response.contains).not.toBeDefined();
			expect(response.displayedElements).not.toBeDefined();
			expect(response.allowedElements).not.toBeDefined();
			expect(response.childrenViews).not.toBeDefined();
			elem = response;
		}); $httpBackend.flush();
		// elements[package2] now exists

		ElementService.getElementForEdit('view', false, 'master').then(function(response) {
			expect(response).toEqual(elem);
			elem2 = response;
		}); $rootScope.$apply();
		// edits[noSpec2] now exists

		elem3 = { sysmlid: 'view', name: 'view', author: 'muschek', 
			specialization: { type: 'View', contains: [ 'table', 'list' ],  displayedElements: [], allowedElements: [],
			childrenViews: [] } };
		// Edit the element checked out for editing
		elem2.documentation = 'View element';
		ElementService.updateElement(elem3, undefined).then(function(response) {
			expect(response.sysmlid).toEqual('view');
			expect(response.name).toEqual('view');
			expect(response.author).toEqual('muschek');
			expect(response.documentation).not.toBeDefined();

			// Expect the element checked out for editing to be updated and maintain it's own properties.
			expect(elem2.author).toEqual('muschek');
			expect(elem2.documentation).toEqual('View element');

			// Expect element not checked for editing to still be updated.
			expect(elem.author).toEqual('muschek');
			expect(elem.documentation).not.toBeDefined();
		}); $httpBackend.flush();

		//	Only one test case is necessary for the owner property.
		//		!(!elem.hasOwnProperty('sysmlid')), (elem.hasOwnProperty('owner')), $http.post - pass,
		//		!(elements.hasOwnProperty(elem.sysmlid)), !(edits.hasOwnProperty(elem.sysmlid))
		
		elem = { sysmlid: 'commentElement', owner: 'anotherElement',  specialization: { type: 'Comment' } };

		ElementService.updateElement(elem, undefined).then(function(response) {
			expect(elem.owner).not.toBeDefined();
			expect(response.owner).not.toBeDefined();

			expect(response).toEqual(elem);
		}); $httpBackend.flush();

		
		//	(!elem.hasOwnProperty('sysmlid'))
		elem = { documentation: 'element without sysmlid' };
		ElementService.updateElement(elem, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage).toEqual('Element id not found, create element first!');
			});
		$rootScope.$apply();
	}));

	// done
	it('updateElements', inject(function() {

		// Empty elements
		var elems = [];
		ElementService.updateElements(elems, undefined).then(function(response) {
			expect(response).toEqual( [] );
		}); $rootScope.$apply();

		// One valid element
		elems = [ { sysmlid: 'validId', documentation: 'this is a valid element', specialization: { type: 'Comment' } } ];
		ElementService.updateElements(elems, undefined).then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].sysmlid).toEqual('validId');
			expect(response[0].specialization).toEqual( { type: 'Comment' } );
			expect(response[0].documentation).toEqual( 'this is a valid element' );
		}); $httpBackend.flush();
		// elements[validId] now exists

		// Couple valid elements
		elems[0].documentation = 'first valid element';
		elems.push( { sysmlid: 'validId2', documentation: 'another valid element', specialization: { type: 'Package' } } );
		ElementService.updateElements(elems, undefined).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0].sysmlid).toEqual('validId');
			expect(response[0].specialization).toEqual( { type: 'Comment' } );
			expect(response[0].documentation).toEqual( 'first valid element' );

			expect(response[1].sysmlid).toEqual('validId2');
			expect(response[1].specialization).toEqual( { type: 'Package' } );
			expect(response[1].documentation).toEqual('another valid element');
		}); $httpBackend.flush();
		// elements[12346] now exists

		// Invalid id
		elems = [ { documentation: 'invalid element', specialization: { type: 'Comment' } } ];
		ElementService.updateElements(elems, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage).toEqual('Element id not found, create element first!');
			}); 
		$rootScope.$apply();

		// Mixed (valid and invalid) ids
		elems.push( { sysmlid: 'valid3', specialization: { type: 'Comment' } } );
		ElementService.updateElements(elems, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage).toEqual('Element id not found, create element first!');
			});
		$httpBackend.flush();

		elems = [ { sysmlid: 'validId4', specialization: { type: 'Comment' } } ];
		elems.push( { name: 'invalid', specialization: { type: 'Package' } } );
		ElementService.updateElements(elems, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage).toEqual('Element id not found, create element first!');
			});
		$httpBackend.flush();
	}));

	// !-- NOTE: I'm not sure if the createElement function ought to add an owner property if 
	// one does not already exist. --!
	// !-- NOTE: When creating an element and receiving an empty array back, the promise ought to 
	// be rejected. --!
	// done - expects 1-2 to fail
	it('createElement', inject(function() {

		
		//	!(!elem.hasOwnProperty('owner')), !(elem.hasOwnProperty('sysmlid')), $http.post - fail
		
		var elem = { name: 'badElement', specialization: { type: 'Pop-Up' },
			documentation: 'Element with non-existant type', owner: 'ownerId' };
		ElementService.createElement(elem, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(400);
				expect(failMessage.data).toEqual('Invalid element type');
			}); $httpBackend.flush();


		// !-- NOTE: This ought to be rejected. --!
		
		//	!(!elem.hasOwnProperty('owner')), !(elem.hasOwnProperty('sysmlid')), $http.post - pass,
		//	!(data.elements.length > 0)
		forceEmpty = true;
		elem = { };
		ElementService.createElement(elem, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage);
			});
		forceEmpty = false;

		
		//	!(!elem.hasOwnProperty('owner')), !(elem.hasOwnProperty('sysmlid')), $http.post - pass,
		//	(data.elements.length > 0)
		
		// With clean element
		elem = { name: 'viewPoint', specialization: { type: 'ViewPoint', method: 'methodId' }, owner: 'ownerId' };
		ElementService.createElement(elem, undefined).then(function(response) {
			expect(response.owner).toEqual('ownerId');
			expect(response.sysmlid).toEqual(elem.name);
			expect(response.specialization.type).toEqual('ViewPoint');
			expect(response.specialization.method).toEqual('methodId');
		}); $httpBackend.flush();
		// elements[viewPoint] now exists

		// With dirty element
		elem = { name: 'propertyId', specialization: { type: 'Property', isDerived: false, isSlot: false, 
			propertyType: 'propertyTypeId', value: 'not an array' }, owner: 'ownerId' };
		ElementService.createElement(elem, undefined).then(function(response) {
			expect(response.owner).toEqual('ownerId');
			expect(response.sysmlid).toEqual(elem.name);
			expect(response.specialization.type).toEqual('Property');

			// Changed after being cleaned
			expect(response.specialization.value).toEqual( [] );
			expect(elem.specialization.value).toEqual('not an array');
		}); $httpBackend.flush();
		// elements[propertyId] now exists

		
		//	!(!elem.hasOwnProperty('owner')), (elem.hasOwnProperty('sysmlid'))
		
		elem = { name: 'alreadyWithId', sysmlid: 'alreadyWithId', owner: 'ownerId' };
		ElementService.createElement(elem, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Element create cannot have id');
			});
		$rootScope.$apply();

			
		//	(!elem.hasOwnProperty('owner')), !(elem.hasOwnProperty('sysmlid')), $http.post - fail
		
		elem = { name: 'badElement', specialization: { type: 'Pop-Up' },
			documentation: 'Element with non-existant type' };
		ElementService.createElement(elem, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(400);
				expect(failMessage.data).toEqual('Invalid element type');
			}); $httpBackend.flush();

		expect(elem.owner).not.toBeDefined();

		
		//	(!elem.hasOwnProperty('owner')), !(elem.hasOwnProperty('sysmlid')), $http.post - pass,
		//	(data.elements.length > 0)
		elem = { name: 'project', specialization: { type: 'Project', version: 'v1' } };
		ElementService.createElement(elem, undefined).then(function(response) { 
			expect(response.name).toEqual('project');
			expect(response.specialization.type).toEqual('Project');
			expect(response.specialization.version).toEqual('v1');
			expect(response.owner).toEqual('PROJECT-21bbdceb-a188-45d9-a585-b30bba346175');
			expect(elem.owner).toEqual('PROJECT-21bbdceb-a188-45d9-a585-b30bba346175');
		}); $httpBackend.flush();
	}));

	// done - unless redundant testing is required
	it('createElements', inject(function() {

		// Empty elements
		ElementService.createElements([]).then(function(elements) {
			expect(elements).toEqual([]);
		}); $rootScope.$apply();

		// One valid element
		var elements = [ { name: 'element1', specialization: { type: 'Comment' }, owner: 'ownerId' } ];
		ElementService.createElements(elements, undefined).then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].sysmlid).toEqual('element1');
			expect(response[0].owner).toEqual('ownerId');
		}); $httpBackend.flush();

		// Couple valid elements
		delete elements[0].sysmlid;
		elements.push( { name: 'element2', specialization: { type: 'Package' }, owner: 'ownerId' } );
		ElementService.createElements(elements, undefined).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0].sysmlid).toEqual('element1');
			expect(response[1].sysmlid).toEqual('element2');

			expect(response[0].specialization.type).toEqual('Comment');
			expect(response[1].specialization.type).toEqual('Package');
		}); $httpBackend.flush();

		// One invalid element
		elements = [ { sysmlid: 'badElement', documentation:'This should cause an issue' } ];
		ElementService.createElements(elements, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Element create cannot have id');
			});
		$rootScope.$apply();

		// Mixed valid and invalid elements
		// [invalid, valid]
		elements.push( { name: 'goodElement' } );
		ElementService.createElements(elements, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Element create cannot have id');
			});
		$httpBackend.flush();

		// [valid, invalid]
		elements = [ { name: 'goodElement' }, { sysmlid: 'badElement', 
			documentation:'This should cause an issue' } ];
		ElementService.createElements(elements, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Element create cannot have id');
			});
		$httpBackend.flush();
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

		
		//	!(!edits.hasOwnProperty(id)), !(_.isEqual(elements[id], edits[id]))
		
		var edit;
		ElementService.getElementForEdit('productId', true, 'master').then(function(response) {
			edit = response;
		}); $httpBackend.flush();
		// edits[productId] and elements[productId] now exist

		edit.documentation = 'documentation has now been edited';
		expect(ElementService.isDirty( 'productId' )).toEqual(true);

		
		//	!(!edits.hasOwnProperty(id)), (_.isEqual(elements[id], edits[id]))
		
		ElementService.getElementForEdit('operationId', true, 'master'); $httpBackend.flush();
		// edits[operationId] and elements[operationId] now exist
		expect(ElementService.isDirty( 'operationId' )).toEqual(false);


		// (!edits.hasOwnProperty(id))
		expect(ElementService.isDirty('12345')).toEqual(false);
	}));

	// !-- NOTE: uses old API and is therefore, expected to fail. --!
	// done, uncertain which web service it ought to be calling on.
	it('search', inject(function() {

		//	$http.get - fail
		forceFail = true;
		ElementService.search('muschek', undefined, undefined).then(function (response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;
		
		//	$http.get - pass, !(elements.hasOwnProperty(element.sysmlid))
		ElementService.search('muschek', undefined, undefined).then(function(response) {
			expect(response.length).toEqual(3);

			expect(response[0]).toEqual( { sysmlid: 'commentId', author: 'muschek', specialization: { type: 'muschek' } } );
			expect(response[1]).toEqual( { sysmlid: 'packageId', author: 'muschek', specialization: { type: 'muschek' } } );
			expect(response[2]).toEqual( { sysmlid: 'paramId', description: 'Chris Muschek want to use this parameter for blah, blah, blah...',
			specialization: { type: 'Parameter', direction: 'one', parameterType: 'band name', defaultValue: undefined } } );
		}); $httpBackend.flush();
		
		//	$http.get - pass, (elements.hasOwnProperty(element.sysmlid)), !(update)
		ElementService.search('muschek', false, undefined).then(function(response) {
			expect(response.length).toEqual(3);

			expect(response[0]).toEqual( { sysmlid: 'commentId', author: 'muschek', specialization: { type: 'muschek' } } );
			expect(response[1]).toEqual( { sysmlid: 'packageId', author: 'muschek', specialization: { type: 'muschek' } } );
			expect(response[2]).toEqual( { sysmlid: 'paramId', description: 'Chris Muschek want to use this parameter for blah, blah, blah...',
			specialization: { type: 'Parameter', direction: 'one', parameterType: 'band name', defaultValue: undefined } } );
		}); $rootScope.$apply();
		
		//	$http.get - pass, (elements.hasOwnProperty(element.sysmlid)), (update)
		ElementService.search('muschek', true, undefined).then(function(response) {
			expect(response.length).toEqual(4);

			expect(response[0]).toEqual( { sysmlid: 'commentId', author: 'muschek', specialization: { type: 'muschek' } } );
			expect(response[1]).toEqual( { sysmlid: 'packageId', author: 'muschek', specialization: { type: 'muschek' } } );
			expect(response[2]).toEqual( { sysmlid: 'paramId', description: 'Chris Muschek want to use this parameter for blah, blah, blah...',
			specialization: { type: 'Parameter', direction: 'one', parameterType: 'band name', defaultValue: undefined } } );
			expect(response[3]).toEqual( { sysmlid: 'imageId', specialization: { type: 'Image', sysmlid: 'imageSpecId' },
				name: 'muschek\'s image' } );
		}); $httpBackend.flush();
	}));
});