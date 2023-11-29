'use strict';

// !-- NOTE: getSites function needs an update parameter, tested as if one existed --!
// SiteService - done, expects to fail [2 $http, 4 normal, 1 empty], expect 2 to fail
describe('SiteService', function() {
	beforeEach(module('mms'));

	var forceFail, updateSites;
	var SiteService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
		SiteService = $injector.get('SiteService');
		$rootScope = $injector.get('$rootScope');

		forceFail = false;

		$httpBackend.whenGET('/alfresco/service/rest/sites').respond( function(method, url, data) {
			var sites;
			if ( forceFail ) {
				return [ 500, 'Internal Server Error' ];
			}
			if (updateSites) {
				sites = { sites: [ { name: 'europa', title: 'Europa', categories:[ 'v1', 'v2', 'v3' ] },
            	{ name:'ems-support', title:'EMS Support Site', categories: [] },
            	{ name:'mock site', title:'Mock Server Site', categories: [] } ] };
			}
			else {
				sites = { sites: [ { name: 'europa', title: 'Europa', categories:[ 'v1', 'v2', 'v3' ] },
            	{ name:'ems-support', title:'EMS Support Site', categories: [] } ] };
			}
			return [200, sites];
		});
	}));

	it('can get an instance of the SiteService and methods are valid', inject(function() {
		expect(SiteService).toBeDefined();

		expect(SiteService.getCurrentSite).not.toBe(null);
		expect(SiteService.setCurrentSite).not.toBe(null);
		expect(SiteService.getCurrentWorkspace).not.toBe(null);
		expect(SiteService.setCurrentWorkspace).not.toBe(null);
		expect(SiteService.getSites).not.toBe(null);
		expect(SiteService.getSite).not.toBe(null);
		expect(SiteService.getSiteProjects).not.toBe(null);
	}));

	// done
	it('getCurrentSite', inject(function() {
		expect(SiteService.getCurrentSite()).toBe('europa');
	}));

	// done
	it('setCurrentSite', inject(function() {
		SiteService.setCurrentSite('notEuropa');
		expect(SiteService.getCurrentSite()).toBe('notEuropa');
	}));

	// done
	it('getCurrentWorkspace', inject(function() {
		expect(SiteService.getCurrentWorkspace()).toBe('master');
	}));

	// done
	it('setCurrentWorkspace', inject(function() {
		SiteService.setCurrentWorkspace('notMaster');
		expect(SiteService.getCurrentWorkspace()).toBe('notMaster');
	}))

	// !-- NOTE: function does not support new sites format --!
	// done, expects several to fail
	it('getSites', inject(function() {

		// !(inProgress), !(!_.isEmpty(sites)), $http.get -- fail
		forceFail = true;
		SiteService.getSites().then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;
		

		// !(inProgress), !(!_.isEmpty(sites)), $http.get -- pass, (!sites.hasOwnProperty(site.name))
		SiteService.getSites().then(function(response) {
        	expect(response.length).toEqual(2);

        	expect(response[0].name).toEqual('europa');
        	expect(response[0].title).toEqual('Europa');
        	expect(response[0].categories).toEqual( ['v1', 'v2', 'v3'] );

        	expect(response[1].name).toEqual('ems-support');
        	expect(response[1].title).toEqual('EMS Support Site');
        	expect(response[1].categories).toEqual( [] );
        }); $httpBackend.flush();
        // sites['europa'] and sites['ems-support'] now exist

		// !(inProgress), !(!_.isEmpty(sites)), $http.get -- pass, !(!sites.hasOwnProperty(site.name))
		updateSites = true;
		SiteService.getSites().then(function(response) {
			expect(response.length).toEqual(3);

			expect(response[0].name).toEqual('europa');
        	expect(response[0].title).toEqual('Europa');
        	expect(response[0].categories).toEqual( ['v1', 'v2', 'v3'] );

        	expect(response[1].name).toEqual('ems-support');
        	expect(response[1].title).toEqual('EMS Support Site');
        	expect(response[1].categories).toEqual( [] );

			expect(response[2].name).toEqual('mock site');
        	expect(response[2].title).toEqual('Mock Server Site');
        	expect(response[2].categories).toEqual( [] );        	
		}); $httpBackend.flush();
		updateSites = false;
		// sites['mock site'] now exists

		// !(inProgress), (!_.isEmpty(sites))
		// sites have not changed
		SiteService.getSites().then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0].name).toEqual('europa');
        	expect(response[0].title).toEqual('Europa');
        	expect(response[0].categories).toEqual( ['v1', 'v2', 'v3'] );

        	expect(response[1].name).toEqual('ems-support');
        	expect(response[1].title).toEqual('EMS Support Site');
        	expect(response[1].categories).toEqual( [] );
		}); $rootScope.$apply();

		// site have changed
		updateSites = true;
		SiteService.getSites().then(function(response) {
			expect(response.length).toEqual(3);

			expect(response[0].name).toEqual('europa');
        	expect(response[0].title).toEqual('Europa');
        	expect(response[0].categories).toEqual( ['v1', 'v2', 'v3'] );

        	expect(response[1].name).toEqual('ems-support');
        	expect(response[1].title).toEqual('EMS Support Site');
        	expect(response[1].categories).toEqual( [] );

			expect(response[2].name).toEqual('mock site');
        	expect(response[2].title).toEqual('Mock Server Site');
        	expect(response[2].categories).toEqual( [] );        	
		}); $rootScope.$apply();
		updateSites = false;

		// (inProgress)
		var promise1 = SiteService.getSites();
		var promise2 = SiteService.getSites();
		expect(promise2).toEqual(promise1);
	}));

	// !-- NOTE: can only call getSites once so the second test will fail until 
	// an update parameter is established. --!
	// done, expects 2 to fail
	it('getSite', inject(function() {

		// !(sites.hasOwnProperty(site)), !(sites.hasOwnProperty(site))
		SiteService.getSite('not a site').then(function(response) { displayError(); },
			function( failMessage ) {
				expect(failMessage.message).toEqual('Site not found');
			});
		$httpBackend.flush();
		// sites['europa'] and sites['ems-support'] now exist

		// !(sites.hasOwnProperty(site)), (sites.hasOwnProperty(site))
		updateSites = true;
		SiteService.getSite('mock site').then(function(response) { 
			expect(response).toEqual( { name: 'mock site', title: 'Mock Server Site', categories: [] } );
		}); $httpBackend.flush();
		updateSites = false;

		// (sites.hasOwnProperty(site))
		SiteService.getSite('europa').then(function(response) {
			expect(response).toEqual( {name: 'Europa', title: 'Europa', categories: ['v1', 'v2', 'v3'] } );
		}); $rootScope.$apply();
	}));

	// empty function
	it('getSiteProjects', inject(function() {

	}));
});