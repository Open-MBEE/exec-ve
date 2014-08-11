'use strict';

// !-- NOTE: if more than one artifact is received then it will only accept 
// the first one --!
// !-- NOTE: timestamp-ing is done incorrectly --!
// VizService - done,, 1 method, expect 1 to fail
describe('VizService', function() {
	beforeEach(module('mms'));

	var forceFail, forceEmpty;
	var VizService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		VizService = $injector.get('VizService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

		forceFail = false;
		forceEmpty = false;

		$httpBackend.whenGET('/alfresco/service/workspaces/master/artifacts/artifactId').respond(function(method, url, data) {
			if (forceFail) { return [500, 'Internal Server Error']; }
			else {
				var artifacts = { artifacts: [ { id: 'imageId1', url: '/image/url/path/image.png' } ] };
				return [200, artifacts];
			}
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/artifacts/artifactId2').respond(function(method, url, data) {
			if (forceEmpty) { return [200, { artifacts: [ ] } ]; }
			else {
				var artifacts = { artifacts: [ { id: 'imageId2', url: '/image/url/path/image.gif' } ] };
				return [200, artifacts];
			}
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/artifacts/artifactId3').respond(function(method, url, data) {
			if (forceEmpty) { return [200, { artifacts: [ ] } ]; }
			else {
				var artifacts = { artifacts: [ { id: 'imageId3', url: '/image/url/path/image.jpg' },
				{ id: 'imageId4', url: '/image/url/path/image.svg' } ] };
				return [200, artifacts];
			}
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/artifacts/artifactId4?timestamp=01-01-2014').respond(function(method, url, data) {
			if (forceFail) { return [500, 'Internal Server Error']; }
			else {
				var artifacts = { artifacts: [ { id: 'imageId1', url: '/image/url/path/image.png' } ] };
				return [200, artifacts];
			}
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/artifacts/artifactId5?timestamp=01-01-2014').respond(function(method, url, data) {
			if (forceEmpty) { return [200, { artifacts: [ ] } ]; }
			else {
				var artifacts = { artifacts: [ { id: 'imageId2', url: '/image/url/path/image.gif' } ] };
				return [200, artifacts];
			}
		});

		$httpBackend.whenGET('/alfresco/service/workspaces/master/artifacts/artifactId6?timestamp=01-01-2014').respond(function(method, url, data) {
			if (forceEmpty) { return [200, { artifacts: [ ] } ]; }
			else {
				var artifacts = { artifacts: [ { id: 'imageId4', url: '/image/url/path/image.svg' } ] };
				return [200, artifacts];
			}
		});


		$httpBackend.whenGET('/alfresco/service/workspaces/master/artifacts/artifactId7/versions/version1').respond(function(method, url, data) {
			if (forceFail) { return [500, 'Internal Server Error']; }
			else {
				var artifacts = { artifacts: [ { id: 'imageId1', url: '/image/url/path/image.png' } ] };
				return [200, artifacts];
			}
		});

	}));

	it('can get an instance of the VizService and methods are valid', inject(function() {
		expect(VizService).toBeDefined();

		expect(VizService.getImageURL).not.toBe(null);
	}));

	// !-- NOTE: if more than one artifact is received then it will only accept 
	// the first one --!
	// !-- NOTE: timestamp-ing is done incorrectly --!
	// done, expect to fail
	it('getImageURL', inject(function() {

		// !(urls.hasOwnProperty(id)), !(URLService.isTimestamp(version)), $http.get -- fail
		forceFail = true;
		VizService.getImageURL('artifactId', undefined, undefined, 'latest').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
				expect(failMessage.message).toEqual('Server Error');
			});
		$httpBackend.flush();
		forceFail = false;
		// urls['artifactId'] now exists

		// !(urls.hasOwnProperty(id)), !(URLService.isTimestamp(version)), $http.get -- pass, !(data.artifacts.length > 0)
		forceEmpty = true;
		VizService.getImageURL('artifactId2', undefined, undefined, 'latest').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();
		forceEmpty = false;
		// urls['artifactId2'] now exists

		// !(urls.hasOwnProperty(id)), !(URLService.isTimestamp(version)), $http.get -- pass, (data.artifacts.length > 0)
		VizService.getImageURL('artifactId3', undefined, undefined, 'latest').then(function(response) {
			expect(response).toEqual('/alfresco/image/url/path/image.jpg');
		}); $httpBackend.flush();
		// urls['artifactId3']['latest'] now exists

		// !(urls.hasOwnProperty(id)), (URLService.isTimestamp(version)), $http.get -- fail
		forceFail = true;
		VizService.getImageURL('artifactId4', undefined, undefined, '01-01-2014').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
				expect(failMessage.message).toEqual('Server Error');
			});
		$httpBackend.flush();
		forceFail = false;
		// urls['artifactId4'] now exists

		// !(urls.hasOwnProperty(id)), (URLService.isTimestamp(version)), $http.get -- pass, !(data.artifacts.length > 0)
		forceEmpty = true;
		VizService.getImageURL('artifactId5', undefined, undefined, '01-01-2014').then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();
		forceEmpty = false;
		// urls['artifactId5'] now exists

		// !(urls.hasOwnProperty(id)), (URLService.isTimestamp(version)), $http.get -- pass, (data.artifacts.length > 0)
		VizService.getImageURL('artifactId6', undefined, undefined, '01-01-2014').then(function(response) {
			expect(response).toEqual('/alfresco/image/url/path/image.svg');
		}); $httpBackend.flush();
		// urls['artifactId6']['01-01-2014'] now exists

		//	Only need to have one with !(urls[id].hasOwnProperty(ver)) to show that it has no effect.
		//		(urls.hasOwnProperty(id)), !(urls[id].hasOwnProperty(ver)), !(URLService.isTimestamp(version)),
		//		$http.get -- pass, (data.artifacts.length > 0)
		VizService.getImageURL('artifactId7', undefined, undefined, 'version1').then(function(response) {
			expect(response).toEqual( '/alfresco/image/url/path/image.png' );
		}); $httpBackend.flush();
		// urls['artifactId7']['version1'] now exists


		//	Only need to have one with !(version !== 'latest' || !update) to show that it has no effect.
		//		(urls.hasOwnProperty(id)), (urls[id].hasOwnProperty(ver)), !(version !== 'latest' || !update),
		//		!(URLService.isTimestamp(version)), $http.get -- pass, (data.artifacts.length > 0)
		VizService.getImageURL('artifactId3', true, undefined, 'latest').then(function(response) {
			expect(response).toEqual('/alfresco/image/url/path/image.jpg');
		}); $httpBackend.flush();

			
		//	(urls.hasOwnProperty(id)), (urls[id].hasOwnProperty(ver)), (version !== 'latest' || !update)
		VizService.getImageURL('artifactId6', false, undefined, '01-01-2014').then(function(response) {
			expect(response).toEqual('/alfresco/image/url/path/image.svg');
		}); $rootScope.$apply();
	}));
});