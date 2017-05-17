'use strict';

describe('Service: Authorization Service', function() {
	beforeEach(module('mms'));

	var AuthServiceObj;
	var mockCacheService, mockURLService, mockElementService, mockViewService, mockProjectService, mockHttpService;
	var $httpBackend, $window;
	var credentialsJSON;
	var ticket;
	var root = '/alfresco/service';

	beforeEach(inject(function($injector) {
		AuthServiceObj 		= $injector.get('AuthService');
		mockCacheService	= $injector.get('CacheService');
		mockURLService		= $injector.get('URLService');
		mockElementService	= $injector.get('ElementService');
		mockViewService		= $injector.get('ViewService');
		mockProjectService	= $injector.get('ProjectService');
		mockHttpService		= $injector.get('HttpService');
		$httpBackend		= $injector.get('$httpBackend');
		$window				= $injector.get('$window');

		credentialsJSON = {
			"username": "someone",
			"password": "jksdlfkl3923432"
		}
	}));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingRequest();
    });

	describe('Method: getAuthorized', function() {
		it('should get credentials', function() {
			// var ticketStored;
			// ticket = $window.localStorage.getItem('ticket');
			// $httpBackend.when('POST', root + '/api/login').respond(
			// 	function(method, url, data) {
			// 		return [201, credentialsJSON];
			// });
			// AuthServiceObj.getAuthorized(credentialsJSON).then(function(data) {
			// 	ticketStored = data;
			// }, function(reason) {
			// 	ticketStored = reason.message;
			// });
			// $httpBackend.flush();
			// expect(ticketStored).toEqual(credentialsJSON);

			var requestHandler = $httpBackend.when('POST', root + '/api/login', credentialsJSON).respond(
				function(method, url, data) {
					return [201, credentialsJSON];
			});
			mockURLService.setTicket(requestHandler.data.data.ticket);
			var ticket = requestHandler.data.data.ticket;
			expect(ticket).toEqual(credentialsJSON);
		});
	});

});
