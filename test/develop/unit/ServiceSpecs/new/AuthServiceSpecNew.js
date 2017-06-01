'use strict';

describe('Service: Authorization Service', function() {
	beforeEach(module('mms'));

	var AuthServiceObj;
	var $httpBackend, authRequestHandler;
	var credentialsJSON, ticket;
	var root = '/alfresco/service';

	beforeEach(inject(function($injector) {
		AuthServiceObj 		= $injector.get('AuthService');
		$httpBackend		= $injector.get('$httpBackend');
		credentialsJSON = {
			"username": "someone",
			"password": "jksdlfkl3923432"
		};
		var mockTicket = {data:{ticket: "TICKET_123456789"}};
		// backend definition common for all tests
		authRequestHandler = $httpBackend.whenPOST(root + '/api/login', credentialsJSON)
			.respond(function(method, url, data) {
					return [201, mockTicket];
			});
	}));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
     	$httpBackend.verifyNoOutstandingRequest();
    });

	describe('Method: getAuthorized', function() {
		it('should get credentials', function() {
			AuthServiceObj.getAuthorized(credentialsJSON).then(function(data) {
				ticket = data;
			}, function(reason) {
				ticket = reason.message;
			});
			$httpBackend.flush();
			expect(ticket).toEqual(AuthServiceObj.getTicket());
		});


		it('should fail authentication', function() {
			// Notice how you can change the response even after it was set
			authRequestHandler.respond(401, '');
			AuthServiceObj.getAuthorized(credentialsJSON).then(function(data) {
				ticket = data;
			}, function(reason) {
				ticket = reason.message;
			});
			$httpBackend.flush();
			expect(ticket).toBe('Permission Error');
		});
	});

});
