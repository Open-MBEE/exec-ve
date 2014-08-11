'use strict';

/*
// !-- NOTE: VersionService incorrectly adds the version timestamp --!
// VersionService - done, 4 methods, [4 $http], expect 3 to fail
describe('VersionService', function() {
	beforeEach(module('mms'));

	var basicFormat = '2014-07-21T15:04:46.336-0700';
	var forceFail;
	var VersionService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		VersionService = $injector.get('VersionService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

		forceFail = false;

		$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/badId\?timestamp+/)
		.respond(function(method, url) {
			var errorMessage = '[ERROR]: Element with id, badId not found\n[WARNING]: No elements found';
			return [404, errorMessage];
		});

		$httpBackend.whenGET(/\/alfresco\/service\/workspaces\/master\/elements\/emptyId+/)
		.respond({elements:[]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345?timestamp=01-01-2014').respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'01-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345?timestamp=02-01-2014').respond(
			{elements: [{author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'02-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12346?timestamp=01-01-2014').respond(
			{elements: [{author:'muschek', name:'anoterBasicElement', sysmlid:12346, lastModified: '01-01-2014'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12345/versions').respond(
			{versions: [{sysmlid:12345, timestamp:'01-01-2014', versionLabel:'14.1'}, 
			{sysmlid:12345, timestamp:'02-01-2014', versionLabel:'14.2'}]});
			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements/12346/versions').respond(
			{versions: [{sysmlid:12346, timestamp:'01-01-2014', versionLabel:'14.1'}]});

			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements?timestamp=01-01-2014').respond( function(method, url, data) {
				if (forceFail) { return [500, 'Internal Server Error']; }
				else {
					var elements = { elements: [ { sysmlid:'commentId', specialization: { type: 'Comment' } }, { sysmlid:'packageId',
						specialization: { type: 'Package' } } ] };
					return [200, elements];
				}
			});
			$httpBackend.whenGET('/alfresco/service/workspaces/master/elements?timestamp=02-01-2014').respond( function(method, url, data) {
				if (forceFail) { return [500, 'Internal Server Error']; }
				else {
					var elements = { elements: [ { sysmlid:'commentId', specialization: { type: 'Comment' }, documentation: 'this is a comment'},
					{ sysmlid:'packageId', specialization: { type: 'Package' } } ] };
					return [200, elements];
				}
			});

			// Version testing will be kept to timestamps for the time being
	}));


	it('can get an instance of VersionService', inject(function() {
		expect(VersionService).toBeDefined();

		expect(VersionService.getElement).toBeDefined();
		expect(VersionService.getElements).toBeDefined();
		expect(VersionService.getElementVersions).toBeDefined();
		expect(VersionService.getGenericElements).toBeDefined();
	}));

	// done
	it('getElement', inject(function() {
		
		// !(inProgress.hasProperty(key)), !(elements.hasProperty(id)), $http.get -- fail
		VersionService.getElement('badId', '01-01-2014', 'master').then(function(response){ displayError(); },
			function(failMes) {
				expect(failMes.status).toEqual(404);
				expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
				expect(failMes.message).toEqual('Not Found');
			});
		$httpBackend.flush();
		// badId now exist in elements

		// !(inProgress.hasProperty(key)), !(elements.hasProperty(id)), $http.get -- pass, !(data.elements.length > 0)
		VersionService.getElement('emptyId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.data).toEqual({elements:[]});
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();
		// emptyId now exists in elements

		// !(inProgress.hasProperty(key)), !(elements.hasProperty(id)), $http.get -- pass, (data.elements.length > 0)
		VersionService.getElement('12345', '01-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('01-01-2014');
		}); $httpBackend.flush();
		// 12345 now exists in elements, and 01-01-2014 version exists in cache

		// !(inProgress.hasProperty(key)), (elements.hasProperty(id)), !(elements[id].hasProperty(version)), $http.get -- fail
		VersionService.getElement('badId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();

		
		// !(inProgress.hasProperty(key)), (elements.hasProperty(id)), $http.get -- pass, !(data.elements.length > 0)
		VersionService.getElement('emptyId', '01-01-2014', 'master').then(function(response){
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
			expect(failMes.data).toEqual({elements:[]});
			expect(failMes.message).toEqual('Not Found');
		}); $httpBackend.flush();

		
		// !(inProgress.hasProperty(key)), (elements.hasProperty(id)), !(elements[id].hasProperty(version)),
		// $http.get -- pass, !(data.elements.length > 0)
		// ..., elements.hasProperty(id), !, success, elements.length > 0
		VersionService.getElement('12345', '02-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('02-01-2014');
		}); $httpBackend.flush();
		// 02-01-2014 version now exists in cache

		// !(inProgress.hasProperty(key)), (elements.hasProperty(id)), (elements[id].hasProperty(version)),
		VersionService.getElement('12345', '01-01-2014', 'master').then(function(response) {
			expect(response.author).toEqual('muschek');
			expect(response.name).toEqual('basicElement');
			expect(response.sysmlid).toEqual(12345);
			expect(response.lastModified).toEqual('01-01-2014');
		}); $rootScope.$apply();

		// (inProgress.hasProperty(key))
		var firstPromise = VersionService.getElement('12346', '01-01-2014');
		var secondPromise = VersionService.getElement('12346', '01-01-2014');
		var thirdPromise = VersionService.getElement('12346', '02-01-2014');
		var fourthPromise = VersionService.getElement('12346', '01-01-2014', 'otherWorkspace'); 
		expect(secondPromise).toEqual(firstPromise);
		expect(thirdPromise).not.toEqual(firstPromise);
		expect(fourthPromise).not.toEqual(firstPromise);
	}));

	// done
	it('getElements', inject(function() {
		var ids = [];

		// Empty array of ids
		VersionService.getElements(ids, '01-01-2014', 'master').then(function(response) {
			expect(response).toEqual( {} );
		}); $rootScope.$apply();

		// One valid id
		ids = ['12345'];
		VersionService.getElements(ids, '01-01-2014', 'master').then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0]).toEqual( {author:'muschek', name:'basicElement', sysmlid:12345, lastModified:'01-01-2014'} );
		}); $httpBackend.flush();

		// Couple valid ids
		ids = ['12345', '12346'];
		VersionService.getElements(ids, '01-01-2014', 'master').then(function(response) {
			var element1 = response[0];
			var element2 = response[1];

			expect(element1.name).toEqual('basicElement');
			expect(element2.name).toEqual('anotherBasicElement');
		}); $httpBackend.flush();

		// One invalid id
		ids = [ 'badId' ];
		VersionService.getElements(ids, '01-01-2014', 'master').then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(404);
				expect(failMessage.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();

		// Mix of valid and invalid ids
		ids = ['12345', 'badId'];
		VersionService.getElements(ids, '01-01-2014', 'master').then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(404);
				expect(failMessage.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();
	}));

	// !-- NOTE: is using old API --!
	// done, however, all will fail
	it('getElementVersions', inject(function() {

		// (!versions.hasProperty(id) && !update), error
		VersionService.getElementVersions('badId', false, 'master').then(function(response) {
			console.log('this should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.message).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
		}); $httpBackend.flush();

		// (!versions.hasProperty(id) && !update), success
		VersionService.getElementVersions('12345', false, 'master').then(function(response) {
			expect(response.length).toEqual(2);
			var version1 = response[0];
			var version2 = response[1];
			expect(version1.versionLabel).toEqual('14.1');
			expect(version2.versionLabel).toEqual('14.2');
		}); $httpBackend.flush();
		// versions now contains 12345's versions

		// (!versions.hasProperty(id) && update), success
		VersionService.getElementVersions('12346', true, 'master').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].versionLabel).toEqual('14.1');
		}); $httpBackend.flush();
		// versions now contains 12346's versions

		// (versions.hasProperty(id) && !update)
		VersionService.getElementVersions('12346', false, 'master').then(function(response) {
			// modify the version's data as to check if it modifies
			response[0].versionLabel = '14.7';
		}); $rootScope.$apply();

		VersionService.getElementVersions('12346', false, 'master').then(function(response) {
			expect(response[0].sysmlid).toEqual('12346');
			expect(response[0].versionLabel).toEqual('14.7');
		}); $rootScope.$apply();

		// (versions.hasProperty(id) && update), success
		VersionService.getElementVersions('12346', true, 'master').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0].sysmlid).toEqual('12346');
			expect(response[0].versionLabel).toEqual('14.1');
		}); $httpBackend.flush();
	}));

	// done
	it('getGenericElements', inject(function() {

		// !(inProgress.hasOwnProperty(progress)), $http.get -- fail
		var url = '/alfresco/service/workspaces/master/elements';
		forceFail = true;
		VersionService.getGenericElements(url, 'elements', '01-01-2014', 'master').then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(inProgress.hasOwnProperty(progress)), $http.get -- pass, !(elements.hasOwnProperty(element.sysmlid))
		VersionService.getGenericElements(url, 'elements', '01-01-2014', 'master').then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0]).toEqual( { sysmlid:'commentId', specialization: { type: 'Comment' } } );
			expect(response[1]).toEqual( { sysmlid:'packageId', specialization: { type: 'Package' } } );
		}); $httpBackend.flush();
		// elements['commentId']['01-01-2014'] and elements['packageId']['01-01-2014'] now exist

		// !(inProgress.hasOwnProperty(progress)), $http.get -- pass, (elements.hasOwnProperty(element.sysmlid)), 
		// !(elements[element.sysmlid].hasOwnProperty(version))
		VersionService.getGenericElements(url, 'elements', '02-01-2014', 'master').then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0]).toEqual( { sysmlid:'commentId', specialization: { type: 'Comment' }, documentation: 'this is a comment' } );
			expect(response[1]).toEqual( { sysmlid:'packageId', specialization: { type: 'Package' } } );
		}); $httpBackend.flush();

		// !(inProgress.hasOwnProperty(progress)), $http.get -- pass, (elements.hasOwnProperty(element.sysmlid)), 
		// (elements[element.sysmlid].hasOwnProperty(version))
		VersionService.getGenericElements(url, 'elements', '01-01-2014', 'master').then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0]).toEqual( { sysmlid:'commentId', specialization: { type: 'Comment' } } );
			expect(response[1]).toEqual( { sysmlid:'packageId', specialization: { type: 'Package' } } );
		}); $rootScope.$apply();

		// (inProgress.hasOwnProperty(progress))
		var firstPromise = VersionService.getGenericElements(url, 'elements', '01-01-2014', 'master');
		var secondPromise = VersionService.getGenericElements(url, 'elements', '01-01-2014', undefined);
		expect(secondPromise).toEqual(firstPromise);
	}));
}); */