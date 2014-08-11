'use strict';

// !-- NOTE: this function calls on depricated function 'getRoot' from the URLService --!
// !-- NOTE: this function calls on depricated function 'mergeElements' from the ElementService --!
// SearchService - done, expect to fail [1 done], expect 1 to fail
describe('SearchService', function() {
	beforeEach(module('mms'));

	var SearchService, $httpBackend;

	beforeEach(inject(function($injector) {

		SearchService = $injector.get('SearchService');
		$httpBackend = $injector.get('$httpBackend');

		$httpBackend.whenGET('/alfresco/service/search/fooBar').respond( function(method, url, data) {
			return [500, 'Internal Server Error'];
		});

		$httpBackend.whenGET('/alfresco/service/search/muschek').respond( { elements: [ 
			{ sysmlid:'12345', specialization: { type: 'Comment' }, author:'muschek' }, 
			{ sysmlid:'12346', specialization: { type: 'Package' }, author:'muschek' },
			{ sysmlid:'12347', specialization: { type: 'View', contains:[], displayedElements:[], 
			allowedElements:[], childrenViews:[] }, documentation:'muschek wanted to display this' } ] } );
	}));

	it('can get an instance of the SearchService and methods are valid', inject(function() {
		expect(SearchService).toBeDefined();

		expect(SearchService.searchElements).not.toBe(null);
	}));

	// !-- NOTE: depricated functions being called here --!
	it('searchElements', inject(function() {

		// $http.get -- fail
		SearchService.searchElements('fooBar', undefined, undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.message).toEqual('Error');
				expect(failMessage.data).toEqual('Internal Server Error');
				expect(failMessage.status).toEqual(500);

			});
		$httpBackend.flush();

		// $http.get -- pass
		SearchService.searchElements('muschek', undefined, undefined).then(function(response) {
			expect(response.length).toEqual(3);

			expect(response[0].sysmlid).toEqual('12345');
			expect(response[0].specialization.type).toEqual('Comment');
			expect(response[0].author).toEqual('muschek');

			expect(response[1].sysmlid).toEqual('12346');
			expect(response[1].specialization.type).toEqual('Package');
			expect(response[0].author).toEqual('muschek');

			expect(response[2].sysmlid).toEqual('12347');
			expect(response[2].specialization.type).toEqual('View');
			expect(response[2].specialization.contains).toEqual( [] );
			expect(response[2].documentation).toEqual('muschek wanted to display this');
		}); $httpBackend.flush();

	}));
});