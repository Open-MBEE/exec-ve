
// !-- NOTE: currently expecting a total of 22 to fail --!

'use strict';

/* jasmine specs for services go here */

describe('service', function() {
  beforeEach(module('myApp.services'));

  var displayError = function() { console.log('This should not be displayed') };


  describe('version', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});


// CommentService - done, [4 empty]
describe('CommentService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the CommentService', inject(function() {
		expect(CommentService).toBeDefined();

		expect(CommentService.addComment).not.toBe(null);
		expect(CommentService.getComments).not.toBe(null);
		expect(CommentService.updateComment).not.toBe(null);
		expect(CommentService.deleteComment).not.toBe(null);
	}));

	it('addComment', inject(function() {}));

	it('getComments', inject(function() {}));

	it('updateComment', inject(function() {}));

	it('deleteComment', inject(function() {}));
});



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
        		var products = { elements: [ { sysmlid: 'commentId', documentation: 'this is a comment', specialization: { type: 'Comment' } } ] };
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
			expect(response).toEqual( { created: '08-01-2014', id: 'configId1', snapshots: [ ], products: [] } );
		}); $rootScope.$apply();
	}));

	// !-- NOTE: RAML states that the expected response should be an object with property 'elements'
	// which is an array of element objects.  Function is looking for property 'products'.  --!
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
			var config = response.configurations[0];
			expect(config.created).toEqual('08-02-2014');
			expect(config.description).toEqual('this config will be updated');
			expect(config.id).toEqual('configName');
			expect(config.modified).toEqual('08-02-2014');
			expect(config.name).toEqual('configName');
			expect(config.timestamp).toEqual('08-02-2014');
			expect(config.products).toEqual( [] );
			expect(config.snapshots).toEqual( [] );
		}); $httpBackend.flush();

		// !(config.hasOwnProperty('id')), $http.post -- pass, (siteConfigs.hasOwnProperty(site))
		config.modified = '08-03-2014';
		config.name = 'configName2';
		ConfigService.getSiteConfigs('ems', 'master'); $httpBackend.flush();
		// sites['ems'] now exists along with configs now includes 'configId1' and 'configId2'
		// create with id that does not already exist
		ConfigService.createConfig( config, 'ems', undefined).then(function(response) {
			var config = response.configurations[0];
			expect(config.created).toEqual('08-02-2014');
			expect(config.description).toEqual('this config will be updated');
			expect(config.id).toEqual('configName2');
			expect(config.modified).toEqual('08-03-2014');
			expect(config.name).toEqual('configName2');
			expect(config.timestamp).toEqual('08-02-2014');
			expect(config.products).toEqual( [] );
			expect(config.snapshots).toEqual( [] );
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



// NotificationService - done, 3 methods, [3 empty]
describe('NotificationService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the NotificationService and methods are valid', inject(function() {
		expect(NotificationService).toBeDefined();

		expect(NotificationService.getFollowing).not.toBe(null);
		expect(NotificationService.follow).not.toBe(null);
		expect(NotificationService.unfollow).not.toBe(null);
	}));

	it('getFollowing', inject(function() {

	}));

	it('follow', inject(function() {

	}));

	it('unfollow', inject(function() {

	}));
});


// ProjectService - done, [empty]
describe('ProjectService', function() {
	beforeEach(module('mms'));

	it('can get an instance of the ProjectService', inject(function() {
		expect(ProjectService).toBeDefined();
		expect(ProjectService()).toEqual({});
	}))
});

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


// !-- NOTE: need to test handleHttpStatus --!
// URLService - done, 16 methods, [16 normal], expect 3 to fail
describe('URLService', function() {
	beforeEach(module('mms'));

	var URLService, $rootScope, $q;
	var expectedReturn;

	beforeEach(inject(function($injector) {
		URLService = $injector.get('URLService');
		$rootScope = $injector.get('$rootScope');
		$q = $injector.get('$q');

		expectedReturn = '';
	}));

	var root = '/alfresco/service';

	it('can get an instance of URLService', inject(function() {
		//URLService function exists
		expect(URLService).toBeDefined();

		//URLService returns object that has all these attributes
		expect(URLService.getSiteDashboardURL).toBeDefined();
		expect(URLService.getElementURL).toBeDefined();
		expect(URLService.getElementVersionsURL).toBeDefined();
		expect(URLService.getPostElementsURL).toBeDefined();
		expect(URLService.handleHttpStatus).toBeDefined();
		expect(URLService.getSitesURL).toBeDefined();
		expect(URLService.getElementSearchURL).toBeDefined();
		expect(URLService.getImageURL).toBeDefined();
		expect(URLService.getProductSnapshotsURL).toBeDefined();
		expect(URLService.getConfigSnapshotsURL).toBeDefined();
		expect(URLService.getSiteProductsURL).toBeDefined();
		expect(URLService.getConfigURL).toBeDefined();
		expect(URLService.getSiteConfigsURL).toBeDefined();
		expect(URLService.getConfigProductsURL).toBeDefined();
		expect(URLService.getDocumentViewsURL).toBeDefined();
		expect(URLService.getViewElementsURL).toBeDefined();
	}));

	it('getConfigSnapshotsURL', inject(function() {

		expectedReturn = root + '/workspaces/master/sites/ems/configurations/configId/snapshots';
		expect(URLService.getConfigSnapshotsURL('configId', 'ems', 'master')).toEqual(expectedReturn);
	}));

	it('getProductSnapshotsURL', inject(function() {
		expectedReturn = root + '/workspaces/master/sites/ems/products/productId/snapshots';
		expect(URLService.getProductSnapshotsURL('productId', 'ems', 'master')).toEqual(expectedReturn)
	}));

	it('getSiteConfigsURL', inject(function() {
		expectedReturn = root + '/workspaces/master/sites/ems/configurations';
		expect(URLService.getSiteConfigsURL('ems', 'master')).toEqual(expectedReturn);
	}));

	it('getConfigProductsURL', inject(function() {
		expectedReturn = root + '/workspaces/master/sites/ems/configurations/configId/products';
		expect(URLService.getConfigProductsURL('configId', 'ems', 'master')).toEqual(expectedReturn);
	}));

	it('getConfigURL', inject(function() {
		expectedReturn = root + '/workspaces/master/sites/ems/configurations/configId';
		expect(URLService.getConfigURL('configId', 'ems', 'master')).toEqual(expectedReturn);
	}));

	it('getSiteProductsURL', inject(function() {
		expectedReturn = root + '/workspaces/master/sites/ems/products';
		expect(URLService.getSiteProductsURL('ems', 'master')).toEqual(expectedReturn);
	}));

	it('getImageURL', inject(function() {
		expectedReturn = root + '/workspaces/master/artifacts/artifactId';

		// latest
		expect(URLService.getImageURL('artifactId', 'master', 'latest')).toEqual(expectedReturn);

		// timestamp
		expectedReturn += '?timestamp=01-01-2014';
		expect(URLService.getImageURL('artifactId', 'master', '01-01-2014')).toEqual(expectedReturn);
		
		// version
		expectedReturn = root + '/workspaces/master/artifacts/artifactId/versions/versionId';
		expect(URLService.getImageURL('artifactId', 'master', 'versionId')).toEqual(expectedReturn);
	}));

	it('getSiteDashboardURL', inject(function() {
		expectedReturn = '/share/page/site/ems/dashboard';
		expect(URLService.getSiteDashboardURL('ems')).toBe(expectedReturn);
	}));

	it('getElementURL', inject(function() {

		expectedReturn = root + '/workspaces/master/elements/elementId';
		
		// latest
		expect(URLService.getElementURL('elementId', 'master', 'latest')).toBe(expectedReturn);

		// timestamp
		expectedReturn += '?timestamp=01-01-2014';
		expect(URLService.getElementURL('elementId', 'master', '01-01-2014')).toBe(expectedReturn);

		// version
		expectedReturn = root + '/workspaces/master/elements/elementId/versions/versionId';
		expect(URLService.getElementURL('elementId', 'master', 'versionId')).toBe(expectedReturn);
	}));

	// !-- NOTE: this function uses old API web services --!
	// !-- NOTE: this function does not add version function --!
	it('getDocumentViewsURL', inject(function() {
		expectedReturn = root + '/workspaces/master/sites/ems/products/productId/views';

		// latest
		expect(URLService.getDocumentViewsURL('productId', 'master', 'latest')).toEqual(expectedReturn);

		// timestamp
		expectedReturn += '?timestamp=01-01-2014';
		expect(URLService.getDocumentViewsURL('productId', 'master', '01-01-2014')).toEqual(expectedReturn);

		// version
		expectedReturn = root + '/workspaces/master/sites/ems/products/productId/views/versions/versionId';
		expect(URLService.getDocumentViewsURL('productId', 'master', 'versionId')).toEqual(expectedReturn);
	}));

	// !-- NOTE: this function uses old API web services --!
	// !-- NOTE: his function takes versionId as a parameter, however,
	// the urls it is calling on do not exist --!
	it('getViewElementsURL', inject(function() {
		expectedReturn = root + '/workspaces/master/views/viewId/elements';

		// latest
		expect(URLService.getViewElementsURL('viewId', 'master', 'latest')).toEqual(expectedReturn);

		// timestamp
		expectedReturn += '?timestamp=01-01-2014';
		expect(URLService.getViewElementsURL('viewId', 'master', '01-01-2014')).toEqual(expectedReturn);

		// version
		expectedReturn = root + '/workspaces/master/views/viewId/versions/versionId';
		expect(URLService.getViewElementsURL('viewId', 'master', 'versionId')).toEqual(expectedReturn);
	}));

	// !-- NOTE: this function uses old API web services --!
	it('getElementVersionsURL', inject(function() {
		expectedReturn = root + '/workspaces/master/elements/elementId/versions';

		expect(URLService.getElementVersionsURL('elementId', 'master')).toEqual(expectedReturn);
	}));

	it('getPostElementsURL', inject(function() {
		var expectedReturn = root + '/workspaces/master/elements';
		expect(URLService.getPostElementsURL('master')).toEqual(expectedReturn);
	}));

	it('handleHttpStatus', inject(function() {

		// 404
		var deferred = $q.defer();
		URLService.handleHttpStatus( {}, 404, undefined, undefined, deferred );
		deferred.promise.then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(404);
				expect(failMessage.data).toEqual( {} );
				expect(failMessage.message).toEqual('Not Found');
			});
		$rootScope.$apply();

		// 500
		deferred = $q.defer();
		URLService.handleHttpStatus( {}, 500, undefined, undefined, deferred );
		deferred.promise.then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual( {} );
				expect(failMessage.message).toEqual('Server Error');
			});
		$rootScope.$apply();

		// 401 || 403
		deferred = $q.defer();
		URLService.handleHttpStatus( {}, 401, undefined, undefined, deferred );
		deferred.promise.then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(401);
				expect(failMessage.data).toEqual( {} );
				expect(failMessage.message).toEqual('Permission Error');
			});
		$rootScope.$apply();

		deferred = $q.defer();
		URLService.handleHttpStatus( {}, 403, undefined, undefined, deferred );
		deferred.promise.then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(403);
				expect(failMessage.data).toEqual( {} );
				expect(failMessage.message).toEqual('Permission Error');
			});
		$rootScope.$apply();

		// 409
		deferred = $q.defer();
		URLService.handleHttpStatus( {}, 409, undefined, undefined, deferred );
		deferred.promise.then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(409);
				expect(failMessage.data).toEqual( {} );
				expect(failMessage.message).toEqual('Conflict');
			});
		$rootScope.$apply();

		// else
		deferred = $q.defer();
		URLService.handleHttpStatus( {}, 600, undefined, undefined, deferred );
		deferred.promise.then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual(600);
				expect(failMessage.data).toEqual( {} );
				expect(failMessage.message).toEqual('Failed');
			});
		$rootScope.$apply();

		deferred = $q.defer();
		URLService.handleHttpStatus( {}, 'string', undefined, undefined, deferred );
		deferred.promise.then(function(response) { displayError(); }, 
			function(failMessage) {
				expect(failMessage.status).toEqual('string');
				expect(failMessage.data).toEqual( {} );
				expect(failMessage.message).toEqual('Failed');
			});
		$rootScope.$apply();
	}));

	it('getSitesURL', inject(function() {
		var expectedReturn = root + '/rest/sites';
		expect(URLService.getSitesURL()).toEqual(expectedReturn);
	}));

	// !-- NOTE: this function uses old API web services --!
	// !-- NOTE: this function may be removed --!
	it('getElementSearchURL', inject(function() {
		var query = 'queryKeyword';
		expectedReturn = root + '/javawebscripts/element/search?keyword=muschek';
		expect(URLService.getElementSearchURL('muschek', 'master')).toBe(expectedReturn);
	}));
	
	// Private methods: isTimestamp, addVersion, handleHttpStatus
	// Not tested
});


// !-- NOTE: ask Doris how to test the hasCircularReference function --!
// UtilsService - incomplete, 2 methods, [1 normal, 1 other]
describe('UtilsService', function() {
	beforeEach(module('mms'));

	var UtilsService;

	beforeEach(inject(function($injector) {
		UtilsService = $injector.get('UtilsService');
	}));

	it('can get an instance of the UtilsService and methods are valid', inject(function() {
		expect(UtilsService).toBeDefined();

		expect(UtilsService.hasCircularReference).not.toBe(null);
		expect(UtilsService.cleanElement).not.toBe(null);
	}));

	// will need to come up with way to test this
	it('hasCircularReference', inject(function() {

	}));

	// done
	it('cleanElement', inject(function() {

		// !hasProperty('specialization')
		var nonDirtyElement = {author:'muschek', sysmlid:12348, name:'nonDirtyElement', owner:'otherElement'};
		UtilsService.cleanElement(nonDirtyElement);
		expect(nonDirtyElement.author).toEqual('muschek');
		expect(nonDirtyElement.sysmlid).toEqual(12348);
		expect(nonDirtyElement.name).toEqual('nonDirtyElement');
		expect(nonDirtyElement.owner).toEqual('otherElement');

		// !-- NOTE: this path does nothing --!
		// hasProperty('specialization'), !(elem.specialization.type === 'Property'), !(elem.specialization.type === 'View')
		var nonDirtyElement2 = {author:'muschek', sysmlid:12349, name:'nonDirtyElement2', owner:'otherElement',
		specialization: { type:'Comment' } };
		UtilsService.cleanElement(nonDirtyElement2);
		expect(nonDirtyElement2).toEqual(
			{author:'muschek', sysmlid:12349, name:'nonDirtyElement2', owner:'otherElement', specialization: { type:'Comment' } });

		// !-- NOTE: this path does nothing --!
		// hasProperty('specialization'), !(elem.specialization.type === 'Property'), (elem.specialization.type === 'View')
		var dirtyElement3 = {author:'muschek', sysmlid:12347, name:'dirtyElement3', owner:'otherElement',
		specialization: {type:'View', contains:[{type:'Paragraph', sourceType:'text', text:'insert paragraph'}],
		displayedElements:['displayedElementID', 'displayedElementID2'], 
		allowedElements:['allowedElementID', 'allowedElementID2'], childrenViews:[]}};
		UtilsService.cleanElement(dirtyElement3);
		expect(dirtyElement3.specialization.displayedElements).toBeDefined();
		expect(dirtyElement3.specialization.allowedElements).toBeDefined();


		// !-- NOTE: under new API will not get a value that contains a specialization --!
		// hasProperty('specialization'), (elem.specialization.type === 'Property'), !(!_.isArray(spec.value))
		var dirtyElement2 = {author:'muschek', sysmlid:12346, name:'dirtyElement2', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID',
			value:[{type:'ValueWithSpec', specialization:{type:'Unknown'}}, 
			{type:'ValueWithSpec', specialization:{type:'Unknown'}}]}};
		UtilsService.cleanElement(dirtyElement2);
		expect(dirtyElement2.specialization.value[0].specialization).not.toBeDefined();
		expect(dirtyElement2.specialization.value[1].specialization).not.toBeDefined();

		// hasProperty('specialization'), (elem.specialization.type === 'Property'), (!_.isArray(spec.value))
		var dirtyElement = {author:'muschek', sysmlid:12345, name:'dirtyElement', owner:'otherElement', 
			specialization: {type:'Property', isDerived:false, isSlot:false, propertyType:'anotherElementID', 
			value: 'not an array'}};
		UtilsService.cleanElement(dirtyElement);
		expect(dirtyElement.specialization.value).toEqual([]);
	}));
});


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
});


// ViewService - done, 18 methods, [5 ElemeServ, 4 empty, 9 tested], expect 3 to fail
describe('ViewService', function() {
	beforeEach(module('mms'));

	var root = '/alfresco/service';
	var forceFail;
	var ViewService, $httpBackend, $rootScope;

	beforeEach(inject(function($injector) {
		ViewService = $injector.get('ViewService');
		$httpBackend = $injector.get('$httpBackend');
		$rootScope = $injector.get('$rootScope');

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

	it('can get an instance of the ViewService and methods are valid', inject(function() {
		expect(ViewService).toBeDefined();

		expect(ViewService.getView).not.toBe(null);
		expect(ViewService.getViews).not.toBe(null);
		expect(ViewService.getDocument).not.toBe(null);
		expect(ViewService.updateView).not.toBe(null);
		expect(ViewService.updateDocument).not.toBe(null);
		expect(ViewService.getViewElements).not.toBe(null);
		expect(ViewService.getViewComments).not.toBe(null);
		expect(ViewService.addViewComment).not.toBe(null);
		expect(ViewService.deleteViewComment).not.toBe(null);
		expect(ViewService.updateViewElements).not.toBe(null);
		expect(ViewService.createView).not.toBe(null);
		expect(ViewService.addViewToDocument).not.toBe(null);
		expect(ViewService.getDocumentViews).not.toBe(null);
		expect(ViewService.getSiteDocuments).not.toBe(null);
		expect(ViewService.setCurrentViewId).not.toBe(null);
		expect(ViewService.setCurrentDocumentId).not.toBe(null);
		expect(ViewService.getCurrentViewId).not.toBe(null);
		expect(ViewService.getCurrentDocumentId).not.toBe(null);
	}));

	// done, just calls ElementService
	it('getView', inject(function() {
	}));

	// done, just calls ElementService
	it('getViews', inject(function() {
	}));

	// done, just calls ElementService
	it('getDocument', inject(function() {
	}));

	// done, just calls ElementService
	it('updateView', inject(function() {
	}));

	// done, just calls ElementService
	it('updateDocument', inject(function() {
	}));

	// !-- NOTE: uses old web services API --!
	// !-- NOTE: also loses track of version when retrieving from server --!
	// done, expected to fail
	it('getViewElements', inject(function() {
		// (!viewElements.hasOwnProperty(ver) && * && *), fail
		ViewService.getViewElements('badId', false, 'master', '01-01-2014').then(function(response) {
			console.log('This should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
		});
		
		// (!viewElements.hasOwnProperty(ver) && * && *), success, !viewElements.hasOwnProperty(ver)
		ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		}); $httpBackend.flush();
		// viewElements['01-01-2014']['12345'] now exists

		// (viewElements.hasOwnProperty(ver) && !viewElements[ver].hasOwnProperty(id) && *), success, 
		// viewElements.hasOwnProperty(ver)
		ViewService.getViewElements('12345', false, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'07-28-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'07-28-2014'});
		}); $httpBackend.flush();
		// viewElements['latest']['12345'] now exists

		// (viewElements.hasOwnProperty(ver) && viewElements[ver].hasOwnProperty(id) && !update)
		ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		}); $rootScope.$apply();

		// (viewElements.hasOwnProperty(ver) && viewElements[ver].hasOwnProperty(id) && update),
		// success, viewElements.hasOwnProperty(ver)
		ViewService.getViewElements('12345', true, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(2);
			expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'07-28-2014'});
			expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'07-28-2014'});
		});
	}));

	// !-- NOTE: uses old web services API --!
	// !-- NOTE: also uses a function that requires a site but none is given --!
	// done, expected to fail
	it('getDocumentViews', inject(function() {
		// (!productViews.hasOwnProperty(ver) && * && *), fail
		ViewService.getDocumentViews('badId', false, 'master', '01-01-2014').then(function(response) {
			console.log('This should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(200);
		}); $httpBackend.flush();

		// (!productViews.hasOwnProperty(ver) && * && *), success, !productViews.hasOwnProperty(ver)
		ViewService.getDocumentViews(54321, false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'doc view', owner:54321, sysmlid:54322, lastModified:'01-01-2014'});
		}); $httpBackend.flush();

		// (productViews.hasProperty(ver) && !productViews[ver].hasProperty(id) && *), success
		// productViews.hasOwnProperty(ver)
		ViewService.getDocumentViews(65432, false, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'other id view', owner:65432, sysmlid:65433, lastModified:'07-28-2014'});
		}); $httpBackend.flush();

		// (productViews.hasOwnProperty(ver) && productViews[ver].hasOwnProperty(id) && !update)
		ViewService.getDocumentViews(54321, false, 'master', '01-01-2014').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'doc view', owner:54321, sysmlid:54322, lastModified:'01-01-2014'});
		}); $rootScope.$apply();

		// (productViews.hasOwnProperty(ver) && productViews[ver].hasOwnProperty(id) && update)
		// success, productViews.hasOwnProperty(ver)
		ViewService.getDocumentViews(54321, true, 'master', 'latest').then(function(response) {
			expect(response.length).toEqual(1);
			expect(response[0]).toEqual({author:'muschek', name:'other id view', owner:65432, sysmlid:65433, lastModified:'07-28-2014'});
		}); $httpBackend.flush();
	}));

	// done, empty
	it('getViewComments', inject(function() {}));

	// done, empty
	it('addViewComment', inject(function() {}));

	// done, empty
	it('deleteViewComment', inject(function() {}));

	// done, empty
	it('updateViewElements', inject(function() {}));

	// done
	it('addViewToDocument', inject(function() {
		// fail
		ViewService.addViewToDocument('viewId', 'badId', 'parentViewId', 'master').then(function(response) {
			console.log('This should not be displayed');
		}, function(failMes) {
			expect(failMes.status).toEqual(404);
			expect(failMes.data).toEqual('[ERROR]: Element with id, badId not found\n[WARNING]: No elements found');
		}); $httpBackend.flush();

		// success, data.specialization.view2view.length == 0, fail

		// success, data has no specialization
		expect(function() {
			ViewService.addViewToDocument('viewId', 'noSpecDocId', 'parentViewId', 'master');
			$httpBackend.flush();
		}).toThrow(new Error('data.specialization is undefined'));

		// success, data.specialization.view2view.length == 0, success
		ViewService.addViewToDocument('viewId', 'emptyView2ViewDocId', 'parentViewId', 'master')
		.then(function(response) {
			expect(response.sysmlid).toEqual('emptyView2ViewDocId');
			expect(response.specialization.view2view.length).not.toEqual(0);
			expect(response.specialization.view2view[0]).toEqual({id: 'viewId', childrenViews:[]});
		}); $httpBackend.flush();

		// success, data.specialization.view2view.length > 0, fail

		// success, data.specialization.view2view.length > 0, no id match, success
		ViewService.addViewToDocument('viewId', 'noIdMatchDocId', 'parentViewId', 'master')
		.then(function(response) {
			expect(response.sysmlid).toEqual('noIdMatchDocId');
			expect(response.specialization.view2view.length).toEqual(2);
			expect(response.specialization.view2view[0]).toEqual({id:'notMatchingId', childrenViews:[]});
			expect(response.specialization.view2view[1]).toEqual({id: 'viewId', childrenViews:[]});
		}); $httpBackend.flush();

		// success, data.specialization.view2vivew.length > 0, id match, success
		ViewService.addViewToDocument('viewId', 'idMatchDocId', 'parentViewId', 'master')
		.then(function(response) {
			expect(response.sysmlid).toEqual('idMatchDocId');
			expect(response.specialization.view2view.length).toEqual(3);
			expect(response.specialization.view2view[0]).toEqual({id: 'nonMatchId', childrenViews:[]});
			expect(response.specialization.view2view[1]).toEqual({id: 'parentViewId', childrenViews:['viewId']});
			expect(response.specialization.view2view[2]).toEqual({id: 'viewId', childrenViews:[]});
		}); $httpBackend.flush();
	}));

	// !-- NOTE: due to how ElementService.updateElement works the new view's owner property will be deleted --!
	// Test cases assume that ElementService's method both pass correctly
	// done - expect this to fail
	it('createView', inject(function() {

		// createElement - pass, updateElement - pass, !documentId
		ViewService.createView('ownerId', undefined, undefined, 'master').then(function(response) {
			expect(response.owner).toEqual('ownerId');
			expect(response.name).toEqual('Untitled View');
			expect(response.documentation).toEqual('');
			expect(response.specialization.type).toEqual('View');
			expect(response.specialization.contains).toEqual([{type:'Paragraph', sourceType:'reference',
				source: response.sysmlid, sourceProperty:'documentation'}]);
			expect(response.specialization.allowedElements).toEqual([response.sysmlid]);
			expect(response.specialization.displayedElements).toEqual([response.sysmlid]);
			expect(response.specialization.childrenViews).toEqual([]);
		}); $httpBackend.flush();

		// createElement - pass, updateElement - pass, documentId, addViewToDoc - fail

		// createElement - pass, updateElement - pass, documentId, addViewToDoc - pass
		ViewService.createView('ownerId', 'name', 'idMatchDocId', 'master').then(function(response) {
			expect(response.owner).toEqual('ownerId');
			expect(response.name).toEqual('name');
			expect(response.documentation).toEqual('');
			expect(response.specialization.type).toEqual('View');
			expect(response.specialization.contains).toEqual([{type:'Paragraph', sourceType:'reference',
				source: response.sysmlid, sourceProperty:'documentation'}]);
			expect(response.specialization.allowedElements).toEqual([response.sysmlid]);
			expect(response.specialization.displayedElements).toEqual([response.sysmlid]);
			expect(response.specialization.childrenViews).toEqual([]);
		}); $httpBackend.flush();

	}));

	// done
	it('getSiteDocuments', inject(function() {

		// !(siteDocuments.hasOwnProperty(site) && !update), getGenericElements - fail
		forceFail = true;
		ViewService.getSiteDocuments('ems', undefined, undefined).then(function(response) { displayError(); },
			function(failMessage) {
				expect(failMessage.status).toEqual(500);
				expect(failMessage.data).toEqual('Internal Server Error');
			});
		$httpBackend.flush();
		forceFail = false;

		// !(siteDocuments.hasOwnProperty(site) && !update), getGenericElements - pass
		ViewService.getSiteDocuments('ems', undefined, undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0].id).toEqual('productId');
			expect(response[0].name).toEqual('Product Name');

			expect(response[0].snapshots.length).toEqual(1);
			expect(response[0].snapshots[0]).toEqual( { created: '01-01-2014', creator: 'muschek', id: 'snapshotId' } );
		}); $httpBackend.flush();

		// (siteDocuments.hasOwnProperty(site) && !update)
		ViewService.getSiteDocuments('ems', false, undefined).then(function(response) {
			expect(response.length).toEqual(1);

			expect(response[0].id).toEqual('productId');
			expect(response[0].name).toEqual('Product Name');

			expect(response[0].snapshots.length).toEqual(1);
			expect(response[0].snapshots[0]).toEqual( { created: '01-01-2014', creator: 'muschek', id: 'snapshotId' } );
		}); $rootScope.$apply();
	}));

	// done
	it('getCurrentViewId', inject(function() {
		expect(ViewService.getCurrentViewId()).toBe('');

		ViewService.setCurrentViewId('newViewId');
		expect(ViewService.getCurrentViewId()).toBe('newViewId');
	}));

	// done
	it('setCurrentViewId', inject(function() {
		ViewService.setCurrentViewId('newViewId');
		expect(ViewService.getCurrentViewId()).toBe('newViewId');
	}));

	// done
	it('getCurrentDocumentId', inject(function() {
		expect(ViewService.getCurrentDocumentId()).toBe('');

		ViewService.setCurrentDocumentId('newDocumentId');
		expect(ViewService.getCurrentDocumentId()).toBe('newDocumentId');
	}));

	// done
	it('setCurrentDocumentId', inject(function() {
		ViewService.setCurrentDocumentId('newDocumentId');
		expect(ViewService.getCurrentDocumentId()).toBe('newDocumentId');
	}));
});



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
