'use strict';

// ConfigService - done, 10 methods, [4 $http tested, 1 unknown, 5 $http untested], expects 4 to fail
describe('ConfigService', function() {
	beforeEach(module('mms'));

	var forceFail, update;
	var root = '/alfresco/service';
	var ConfigService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
        ConfigService = $injector.get('ConfigService');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');

        forceFail = false;
        update = false;

        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/configurations').respond(function(method, url, data) {
        	if (forceFail) {
        		return [500, 'Internal Server Error'];
        	} else {
        		var configurations = { configurations: [ { created: '08-01-2014', id: 'configId1', snapshots: [], products: [] },
        			{ created: '08-01-2014', id: 'configId2', snapshots: [], products: [] } ] };
        		return [200, configurations];
        	}
        });
        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/configurations/badId').respond(function(method, url, data) {
        	return [404, 'ERROR: Configuration with id \'badId\' does not exist'];
        });
        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/configurations/configId1').respond(
        	{ configurations: [ { created: '08-01-2014', id: 'configId1', snapshots: [], products: [ 'commentId' ] } ] } );
        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/configurations/configId2').respond(
        	{ configurations: [ { created: '08-01-2014', id: 'configId2', snapshots: [ 'snapshotId' ], products: [] } ] } );

        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/configurations/configId1/products').respond(function(method, url, data) {
        	if (forceFail) {
        		return [500, 'Internal Server Error'];
        	} else {
        		var products = { products: [ { sysmlid: 'commentId', documentation: 'this is a comment', specialization: { type: 'Comment' } } ] };
        		return [200, products];
        	}});

        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/configurations/configId2/snapshots').respond(function(method, url, data) {
        	if (forceFail) {
        		return [500, 'Internal Server Error'];
        	} else {
        		var snapshots = { snapshots: [ { created: '08-01-2014', creator: 'muschek', id: 'snapshotId', sysmlid: 'snapshotSysmlid', 
        		sysmlname: 'snapshotSysmlName', configuration: [] } ] };
        		return [200, snapshots];
        	}
        });

        $httpBackend.whenGET(root + '/workspaces/master/sites/ems/products/commentId/snapshots').respond(function(method, url, data) {
        	if (forceFail) { return [500, 'Internal Server Error']; }
        	else {
        		var snapshots = { snapshots: [ { created: '08-02-2014', creator:'muschek', id: 'snapshotId1', sysmlid: 'snapshotId1', 
        		sysmlname: 'docName', configurations: [] } ] };
        		if (update) {
        			snapshots.snapshots.push( { created: '08-03-2014', creator:'muschek', id: 'snapshotId2', sysmlid: 'snapshotId2',
        			sysmlname: 'docName', configurations: [] } );
        		}
        		return [200, snapshots];
        	}
        });

        $httpBackend.whenPOST(root + '/workspaces/master/sites/ems/configurations').respond(function(method, url, data) {
        	if (forceFail) { return [500, 'Internal Server Error']; }
        	else {
        		var json = JSON.parse(data);
        		if (!json.configurations[0].id) {
        			json.configurations[0].id = json.configurations[0].name;
        		}
        		return [200, json];
        	}
        });
        $httpBackend.whenPOST(root + '/workspaces/master/sites/ems/configurations/configName/snapshots').respond(function(method, url, data) {
        	if (forceFail) { return [500, 'Internal Server Error']; }
        	else {
        		var json = JSON.parse(data);
        		return [200, json];
        	}
        });
        $httpBackend.whenPOST(root + '/workspaces/master/sites/ems/configurations/configName/products').respond(function(method, url, data) {
        	if (forceFail) { return [500, 'Internal Server Error']; }
        	else {
        		var json = JSON.parse(data);
        		return [200, json];
        	}
        });
        $httpBackend.whenPOST(root + '/workspaces/master/sites/ems/products/productId1/snapshots').respond(function(method, url, data) {
        	if (forceFail) { return [500, 'Internal Server Error']; }
        	else {
        		return [200];
        	}
        });

    }));

	it('can get an instance of the ConfigService', inject(function() {
		expect(ConfigService).toBeDefined();

		expect(ConfigService.getSiteConfigs).not.toBe(null);
		expect(ConfigService.getConfig).not.toBe(null);
		expect(ConfigService.getConfigProducts).not.toBe(null);
		expect(ConfigService.getConfigProducts).not.toBe(null);
		expect(ConfigService.getConfigSnapshots).not.toBe(null);
		expect(ConfigService.updateConfig).not.toBe(null);
		expect(ConfigService.createConfig).not.toBe(null);
		expect(ConfigService.updateConfigSnapshots).not.toBe(null);
		expect(ConfigService.updateConfigProducts).not.toBe(null);
		expect(ConfigService.createSnapshots).not.toBe(null);
	}));

	// !-- NOTE: config objects still use id instead of sysmlid, could be old API --!
	// done
	it('getSiteConfigs', inject(function() {

		// !(siteConfigs.hasOwnProperty(site)), $http.get -- fail
		forceFail = true;
		ConfigService.getSiteConfigs('ems', undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(siteConfigs.hasOwnProperty(site)), $http.get -- pass
		ConfigService.getSiteConfigs('ems', undefined).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0]).toEqual( { created: '08-01-2014', id: 'configId1', snapshots: [], products: [] } );
			expect(response[1]).toEqual( { created: '08-01-2014', id: 'configId2', snapshots: [], products: [] } );
		}); $httpBackend.flush();
		// siteConfigs['configId1'] and siteConfigs['configId2'] now exist

		// (siteConfigs.hasOwnProperty(site))
		ConfigService.getSiteConfigs('ems', undefined).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0]).toEqual( { created: '08-01-2014', id: 'configId1', snapshots: [], products: [] } );
			expect(response[1]).toEqual( { created: '08-01-2014', id: 'configId2', snapshots: [], products: [] } );
		}); $rootScope.$apply();
	}));

	// done
	it('getConfig', inject(function() {

		// !(configs.hasOwnProperty(id)), $http.get -- fail
		ConfigService.getConfig('badId', 'ems', undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(404);
				expect(failMessage.data).toEqual('ERROR: Configuration with id \'badId\' does not exist');
				expect(failMessage.message).toEqual('Not Found');
			});
		$httpBackend.flush();

		// !(configs.hasOwnProperty(id)), $http.get -- pass
		ConfigService.getConfig('configId1', 'ems', undefined).then(function(response) {
			expect(response).toEqual( { created: '08-01-2014', id: 'configId1', snapshots: [], products: [ 'commentId' ] } );
		}); $httpBackend.flush();
		// configs['configId1'] now exists

		// (configs.hasOwnProperty(id))
		ConfigService.getConfig('configId1', 'ems', undefined).then(function(response) {
			expect(response).toEqual( { created: '08-01-2014', id: 'configId1', snapshots: [ ], products: [ 'commentId' ] } );
		}); $rootScope.$apply();
	}));

	// done
	it('getConfigProducts', inject(function() {

		// !(configProducts.hasOwnProperty(id)), $http.get -- fail
		forceFail = true;
		ConfigService.getConfigProducts('configId1', 'ems', undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.message).toEqual('Server Error');
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(configProducts.hasOwnProperty(id)), $http.get -- pass
		ConfigService.getConfigProducts('configId1', 'ems', undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0]).toEqual({ sysmlid: 'commentId', documentation: 'this is a comment', specialization: { type: 'Comment' } });
		}); $httpBackend.flush();

		// (configProducts.hasOwnProperty(id))
		ConfigService.getConfigProducts('configId1', 'ems', undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0]).toEqual({ sysmlid: 'commentId', documentation: 'this is a comment', specialization: { type: 'Comment' } });
		}); $rootScope.$apply();
	}));

	// done
	it('getConfigSnapshots', inject(function() {

		// !(configSnapshots.hasOwnProperty(id)), $http.get -- fail
		forceFail = true;
		ConfigService.getConfigSnapshots('configId2', 'ems', undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(configSnapshots.hasOwnProperty(id)), $http.get -- pass
		ConfigService.getConfigSnapshots('configId2', 'ems', undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0]).toEqual( { created: '08-01-2014', creator: 'muschek', id: 'snapshotId', sysmlid: 'snapshotSysmlid', 
        		sysmlname: 'snapshotSysmlName', configuration: [] } );
		}); $httpBackend.flush();

		// (configSnapshots.hasOwnProperty(id))	
		ConfigService.getConfigSnapshots('configId2', 'ems', undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0]).toEqual( { created: '08-01-2014', creator: 'muschek', id: 'snapshotId', sysmlid: 'snapshotSysmlid', 
        		sysmlname: 'snapshotSysmlName', configuration: [] } );
		}); $rootScope.$apply();
	}));

	// done
	it('getProductSnapshots', inject(function() {

		// !(productSnapshots.hasOwnProperty(id) && !update), $http.get -- fail
		forceFail = true;
		ConfigService.getProductSnapshots('commentId', 'ems', undefined, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(productSnapshots.hasOwnProperty(id) && !update), $http.get -- pass, !(productSnapshots.hasOwnProperty(id))
		ConfigService.getProductSnapshots('commentId', 'ems', undefined, undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0]).toEqual( { created: '08-02-2014', creator:'muschek', id: 'snapshotId1', sysmlid: 'snapshotId1', 
        		sysmlname: 'docName', configurations: [] } );
		}); $httpBackend.flush();
		// productSnapshots['commentId'] now exists


		// !(productSnapshots.hasOwnProperty(id) && !update), $http.get -- pass, (productSnapshots.hasOwnProperty(id))
		update = true;
		ConfigService.getProductSnapshots('commentId', 'ems', undefined, true).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0]).toEqual( { created: '08-02-2014', creator:'muschek', id: 'snapshotId1', sysmlid: 'snapshotId1', 
        		sysmlname: 'docName', configurations: [] } );
			expect(response[1]).toEqual( { created: '08-03-2014', creator:'muschek', id: 'snapshotId2', sysmlid: 'snapshotId2',
        		sysmlname: 'docName', configurations: [] } );
		}); $httpBackend.flush();
		update = false;
		// productSnapshots['commentId'] now updated

		// (productSnapshots.hasOwnProperty(id) && !update)
		ConfigService.getProductSnapshots('commentId', 'ems', undefined, false).then(function(response) {
			expect(response.length).toEqual(2);

			expect(response[0]).toEqual( { created: '08-02-2014', creator:'muschek', id: 'snapshotId1', sysmlid: 'snapshotId1', 
        		sysmlname: 'docName', configurations: [] } );
			expect(response[1]).toEqual( { created: '08-03-2014', creator:'muschek', id: 'snapshotId2', sysmlid: 'snapshotId2',
        		sysmlname: 'docName', configurations: [] } );
		}); $rootScope.$apply();
	}));

	// !-- NOTE: appears to outputing back in the format of { configurations : [...] } as opposed
	// to just the configuration object. Not sure if this is intentional. --!
	// done
	it('updateConfig', inject(function() {

		// !(!config.hasOwnProperty('id')), $http.post -- fail
		forceFail = true;
		ConfigService.updateConfig( { id: 'placeholderId' }, 'ems', undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(!config.hasOwnProperty('id')), $http.post -- pass, !(configs.hasOwnProperty(config.id))
		var config = { created: '08-02-2014', description: 'this config will be updated', id: 'configId1', modified: '08-02-2014', name: 'configName',
			timestamp: '08-02-2014', products: [], snapshots: [] };
		ConfigService.updateConfig(config, 'ems', undefined).then(function(response) {
			expect(response.configurations.length).toEqual(1);

			var config = response.configurations[0];
			expect(config.created).toEqual('08-02-2014');
			expect(config.description).toEqual('this config will be updated');
			expect(config.id).toEqual('configId1');
			expect(config.modified).toEqual('08-02-2014');
			expect(config.name).toEqual('configName');
			expect(config.timestamp).toEqual('08-02-2014');
			expect(config.products).toEqual( [] );
			expect(config.snapshots).toEqual( [] );
		}); $httpBackend.flush();
		// configs['configId1'] now exists

		// !(!config.hasOwnProperty('id')), $http.post -- pass, (configs.hasOwnProperty(config.id))
		config.modified = '08-03-2014';
		config.products = [ 'productId' ];
		ConfigService.updateConfig(config, 'ems', undefined).then(function(response) {
			expect(response.configurations.length).toEqual(1);

			var config = response.configurations[0];
			expect(config.created).toEqual('08-02-2014');
			expect(config.description).toEqual('this config will be updated');
			expect(config.id).toEqual('configId1');
			expect(config.modified).toEqual('08-03-2014');
			expect(config.name).toEqual('configName');
			expect(config.timestamp).toEqual('08-02-2014');
			expect(config.products).toEqual( [ 'productId' ] );
			expect(config.snapshots).toEqual( [] );
		}); $httpBackend.flush();

		// (!config.hasOwnProperty('id'))
		ConfigService.updateConfig( {}, 'ems', undefined).then(function(response) {displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Config id not found, create configuration first!');
			});
		$rootScope.$apply();
	}));

	// !-- NOTE: createConfig does not support the response format of { configurations: [...] } --!
	// done
	it('createConfig', inject(function() {

		// !(config.hasOwnProperty('id')), $http.post -- fail
		forceFail = true;
		ConfigService.createConfig( {}, 'ems', undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(config.hasOwnProperty('id')), $http.post -- pass, !(siteConfigs.hasOwnProperty(site))
		var config = { created: '08-02-2014', description: 'this config will be updated', modified: '08-02-2014', name: 'configName',
			timestamp: '08-02-2014', products: [], snapshots: [] };
		ConfigService.createConfig( config, 'ems', undefined).then(function(response) {
			var respConfig = response;
			expect(respConfig.created).toEqual('08-02-2014');
			expect(respConfig.description).toEqual('this config will be updated');
			expect(respConfig.id).toEqual('configName');
			expect(respConfig.modified).toEqual('08-02-2014');
			expect(respConfig.name).toEqual('configName');
			expect(respConfig.timestamp).toEqual('08-02-2014');
			expect(respConfig.products).toEqual( [] );
			expect(respConfig.snapshots).toEqual( [] );
		}); $httpBackend.flush();

		// !(config.hasOwnProperty('id')), $http.post -- pass, (siteConfigs.hasOwnProperty(site))
		config.modified = '08-03-2014';
		config.name = 'configName2';
		ConfigService.getSiteConfigs('ems', 'master'); $httpBackend.flush();
		// sites['ems'] now exists along with configs now includes 'configId1' and 'configId2'
		// create with id that does not already exist
		ConfigService.createConfig( config, 'ems', undefined).then(function(response) {
			var respConfig = response;
			expect(respConfig.created).toEqual('08-02-2014');
			expect(respConfig.description).toEqual('this config will be updated');
			expect(respConfig.id).toEqual('configName2');
			expect(respConfig.modified).toEqual('08-03-2014');
			expect(respConfig.name).toEqual('configName2');
			expect(respConfig.timestamp).toEqual('08-02-2014');
			expect(respConfig.products).toEqual( [] );
			expect(respConfig.snapshots).toEqual( [] );
		}); $httpBackend.flush();
		// configs now includes 'configName2'
		// confirm that config now exists in siteConfigs
		ConfigService.getSiteConfigs('ems', 'master').then(function(response) {

			expect(response.length).toEqual(3);

			expect(response[0].id).toEqual('configId1');
			expect(response[1].id).toEqual('configId2');
			expect(response[2].id).toEqual('configName2');
		}); $rootScope.$apply();

		// (config.hasOwnProperty('id'))
		ConfigService.createConfig( { id: 'badId' }, 'ems', undefined ).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(200);
				expect(failMessage.message).toEqual('Config create cannot already have id');
			});
		$rootScope.$apply();
	}));

	// done
	it('updateConfigSnapshots', inject(function() {

		// $http.post -- fail
		forceFail = true;
		ConfigService.updateConfigSnapshots('configName', { }, 'ems', undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// $http.post -- pass
		var snapshots = { snapshots: [ { created: '08-03-2014', creator: 'muschek', id: 'snapshotId1', sysmlid:'snapshotId1', 
		sysmlname: 'documentId', configuration: [] }, { created: '08-03-2014', creator: 'muschek', id: 'snapshotId2', sysmlid:'snapshotId2', 
		sysmlname: 'documentId', configuration: [] } ] };
		ConfigService.updateConfigSnapshots('configName', snapshots, 'ems', undefined).then(function(response) {
			var snaps = response.snapshots;

			expect(snaps.length).toEqual(2);
			expect(snaps[0]).toEqual({ created: '08-03-2014', creator: 'muschek', id: 'snapshotId1', sysmlid:'snapshotId1', 
			sysmlname: 'documentId', configuration: [] });
			expect(snaps[1]).toEqual({ created: '08-03-2014', creator: 'muschek', id: 'snapshotId2', sysmlid:'snapshotId2', 
			sysmlname: 'documentId', configuration: [] })
		}); $httpBackend.flush();
	}));

	// !-- NOTE: function is looking for the data's snapshot property which does not exist --!
	// done, expect to fail
	it('updateConfigProducts', inject(function() {

		// $http.post -- fail
		forceFail = true;
		ConfigService.updateConfigProducts('configName', { }, 'ems', undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// $http.post -- pass
		var products = [ { sysmlid: 'productId1', specialization: { type: 'Comment' } }, { sysmlid: 'productId2', specialization: {
			type: 'Package' } } ];
		ConfigService.updateConfigProducts('configName', products, 'ems', undefined).then(function(response) {
			expect(response.elements.lenth).toEqual(2);

			var configProducts = response.elements;
			expect(configProducts[0]).toEqual( { sysmlid: 'productId1', specialization: { type: 'Comment' } } );
			expect(configProducts[1]).toEqual( { sysmlid: 'productId2', specialization: { type: 'Package' } } );
		}); $httpBackend.flush();
	}));

	// done
	it('createSnapshot', inject(function() {

		// $http.post -- fail
		forceFail = true;
		ConfigService.createSnapshot('productId1', 'ems', undefined).then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// $http.post -- pass
		ConfigService.createSnapshot('productId1', 'ems', undefined).then(function(response) {
			expect(response).toEqual('ok');
		}); $httpBackend.flush();
	}));
});