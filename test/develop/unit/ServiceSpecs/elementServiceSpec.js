'use strict';

describe('Service: ElementService', function() {
	
	var root = '/alfresco/service';
	var $httpBackend;
	var mockURLService, mockUtilsService, mockCacheService, mockHttpService, mockApplicationService, urlService;
	var ElementServiceObj;
	var projects = {};
	var ref = {};
	var refs = {};
	var elements = {};
	var result = {};
	var elementHistory;

    // need to put this into different beforeEach block. If not jasmine will intermittently fail.
	beforeEach(module('mmsApp'));
	beforeEach(function() {
		inject(function($injector) {
			$httpBackend 			= $injector.get('$httpBackend');
			mockURLService			= $injector.get('URLService');
			mockUtilsService		= $injector.get('UtilsService');
			mockCacheService		= $injector.get('CacheService');
			mockHttpService			= $injector.get('HttpService');
			mockApplicationService	= $injector.get('ApplicationService');
			ElementServiceObj		= $injector.get('ElementService');
            urlService = $injector.get('URLService');
            urlService.setTicket(null);
		});

        $httpBackend.whenGET(function(url) {
        	return url.indexOf('/alfresco/service/mms/login/ticket/') !== -1;
		} ).respond(200, {username: 'fakeUser'});
        $httpBackend.whenGET(function(url) {
            return url.indexOf('/alfresco/service/orgs?alf_ticket') !== -1;
        } ).respond(200, {orgs: ['org1']});

		projects = {
			projects: [
				{
					_created	: "2017-04-18T14:56:57.635-0700",
					_creator	: "gandalf",
					_elasticId	: "elasticId",
					_modified	: "2017-04-18T14:56:57.635-0700",
					_modifier	: "gandalf",
					_mounts		: [],
					_projectId	: "projectId",
					_refId		: "master",
					categoryId	: "",
					id 			: "hereisanid",
					name		: "youshallnotpass",
					orgId 		: "minesofmoria",
					twcId 		: "",
					type 		: "Project",
					uri 		: "file:/Users/gandalf/Documents/youshallnotpass.mdzip"
				},
				{
					_created 	: "2017-04-19T11:31:07.968-0700",
					_creator	: "admin",
					_elasticId	: "elasticId2",
					_modified	: "2017-04-19T11:31:07.968-0700",
					_modifier	: "admin",
					_mounts		: [],
					_projectId	: "projectId2",
					_refId 		: "master",
					categoryId 	: "",
					id 			: "hereisanotherid",
					name 		: "thelonelymountain",
					orgId 		: "Erebor",
					twcId 		: "",
					type 		: "Project",
					uri 		: "file:/Users/admin/Downloads/thelonelymountain.mdzip"
				}
			]
		};

		$httpBackend.when('GET', '/alfresco/service/projects').respond(200, projects);

		ref = [{
			_elasticId: "refelastic3",
			id: "thirdref",
			name: "thirdref"
		}];

		refs = {
			refs: [
				{
					_elasticId: "refelastic1",
					id: "master",
					name: "master"
				},
				{
					_elasticId: "refelastic2",
					id: "secondref",
					name: "secondref"
				}
			]
		};

		$httpBackend.when('GET', '/alfresco/service/projects/projectId/refs').respond(200, refs);

		elements = {
			elements: [
				{
					// _allowedElements			: [],
					_modifier					: "admin",
					powertypeExtentIds			: [],
					representationId			: null,
					mdExtensionsIds				: [],
					templateBindingIds			: [],
					appliedStereotypeInstanceId	: "applid",
					templateParameterId			: null,
					isActive					: false,
					ownerId 					: "ownerid",
					type 						: "Class",
					isLeaf 						: false,
					clientDependencyIds 		: [],
					_displayedElements 			: ["diselements"],
					useCaseIds 					: [],
					syncElementId 				: null,
					classifierBehaviorId 		: null,
					interfaceRealizationIds 	: [],
					id 							: "heyanelement",
					_elasticId 					: "elasticid",
					_refId 						: "master",
					supplierDependencyIds		: [],
					_modified					: "2017-05-03T10:51:50.270-0700",
					_appliedStereotypeIds		: ["stereotypeids"],
					nameExpression				: null,
					ownedAttributeIds			: ["ownedattr1","ownedattr2","ownedattr3","ownedattr4","ownedattr5"],
					packageImportIds			: [],
					visibility					: null,
					substitutionIds				: [],
					documentation				: "",
					redefinedClassifierIds		: [],
					_editable					: true,
					isAbstract					: false,
					_contents:
						{
							type: "Expression",
							operand: [
								{
									instanceId: "instanceid",
									type: "InstanceValue"
								}
							]
						},
					_commitId: "commitid",
					_childViews: [
						{
							aggregation: "composite",
							id: "child1"
						},
						{
							aggregation: "composite",
							id: "child2"
						},
						{
							aggregation: "composite",
							id: "child3"
						},
						{
							aggregation: "composite",
							id: "child4"
						},
						{
							aggregation: "composite",
							id: "child5"
						}
					],
					generalizationIds: [],
					_creator: "admin",
					ownedOperationIds: [],
					_created: "2017-05-01T13:43:19.571-0700",
					name: "Krabby Patties",
					elementImportIds: [],
					collaborationUseIds: [],
					isFinalSpecialization: false,
					_projectId: "heyaproject"
				}
			]
		};

		$httpBackend.when('GET', '/alfresco/service/projects/projectId/refs/master/elements').respond(200, elements);

		result = {
			_modifier					: "admin",
			powertypeExtentIds			: [],
			representationId			: null,
			mdExtensionsIds				: [],
			templateBindingIds			: [],
			appliedStereotypeInstanceId	: "applid",
			templateParameterId			: null,
			isActive					: false,
			ownerId 					: "ownerid",
			type 						: "Class",
			isLeaf 						: false,
			clientDependencyIds 		: [],
			_displayedElements 			: ["diselements"],
			useCaseIds 					: [],
			syncElementId 				: null,
			classifierBehaviorId 		: null,
			interfaceRealizationIds 	: [],
			id 							: "heyanelement",
			_elasticId 					: "elasticid",
			_refId 						: "master",
			supplierDependencyIds 		: [],
			_modified 					: "2017-05-03T10:51:50.270-0700",
			_appliedStereotypeIds 		: ["stereotypeids"],
			nameExpression 				: null,
			ownedAttributeIds 			: ["ownedattr1","ownedattr2","ownedattr3","ownedattr4","ownedattr5"],
			packageImportIds 			: [],
			visibility 					: null,
			substitutionIds 			: [],
			documentation 				: "",
			redefinedClassifierIds 		: [],
			_editable 					: true,
			isAbstract 					: false,
			_contents:
				{
					type: "Expression",
					operand: [
						{
							instanceId: "instanceid",
							type: "InstanceValue"
						}
					]
				},
			_commitId 					: "commitid",
			_childViews: [
				{
					aggregation: "composite",
					id: "child1"
				},
				{
					aggregation: "composite",
					id: "child2"
				},
				{
					aggregation: "composite",
					id: "child3"
				},
				{
					aggregation: "composite",
					id: "child4"
				},
				{
					aggregation: "composite",
					id: "child5"
				}
			],
			generalizationIds 			: [],
			_creator 					: "admin",
			ownedOperationIds 			: [],
			_created 					: "2017-05-01T13:43:19.571-0700",
			name 						: "Krabby Patties",
			elementImportIds 			: [],
			collaborationUseIds 		: [],
			isFinalSpecialization 		: false,
			_projectId 					: "heyaproject"
		};

		// //GETELEMENTHISTORY:
		// elementHistory = {
		// 	commits: [
		// 	    {
		// 	        _created: "2017-04-27T16:23:44.357-0700",
		// 	        _creator: "admin",
		// 	        id: "someid1"
		// 	    },
		// 	    {
		// 	        _created: "2017-04-27T16:23:26.081-0700",
		// 	        _creator: "admin",
		// 	        id: "someid2"
		// 	    },
		// 	    {
		// 	        _created: "2017-04-27T16:23:06.540-0700",
		// 	        _creator: "admin",
		// 	        id: "someid3"
		// 	    }
		// 	]
		// }

		// $httpBackend.when('GET', 'alfresco/service/projects/someprojectid/refs/master/elements/getelementhistory/history').respond(200, elementHistory);
	});

	describe('updateElements', function() {
        it('should respond with the appropriately formatted response when updating elements that do not have the' +
			' required fields (id, _refId, _projectId)', function() {
            var elementObs = [
                {
                    _projectId: "heyaproject",
                    _refId: 'master'
                },
                {
                    id: 2,
                    _projectId: "heyaproject"
                }
            ];
            ElementServiceObj.updateElements(elementObs).then(function() {
                fail("Promise should not be resolved because elementObs do not have id, _projectId, _refId");
            }, function(response) {
                // Assert to make sure that the response is formatted correctly, because users of this method expect this
                var failedRequests = response.failedRequests[0];
                expect(response.successfulRequests.length).toEqual(0);
                expect(response.failedRequests.length).toEqual(1);
                expect(failedRequests.message).toEqual('Some of the elements do not have id, _projectId, _refId');
                expect(failedRequests.status).toEqual(400);
                expect(failedRequests.data).toEqual(elementObs);
            });
            $httpBackend.flush();
            $httpBackend.flush();
        });

        it('should respond with the appropriately formatted response when updating elements that have all the' +
			' required fields and the request is successful', function() {
            var elementObs = [
                {
                    id: 1,
                    _projectId: "heyaproject",
                    _refId: 'master',
                    _commitId: 'latest',
                    name: '1'
                },
                {
                    id: 2,
                    _projectId: "heyaproject",
                    _refId: 'master',
                    _commitId: 'latest',
                    name: '2'
                }
            ];

            var mockedData = {
                elements: elementObs
            };

            // Ensure that the success handler is triggered correctly
            $httpBackend.when('POST','/alfresco/service/projects/heyaproject/refs/master/elements').respond(200, mockedData);
            ElementServiceObj.updateElements(elementObs).then(function(responses) {
                expect(responses.length).toEqual(2);
            }, function() {
                fail("Promise should be resolved successfully");
            });
            $httpBackend.flush();
            $httpBackend.flush();
        });

        it('should respond with the appropriately formatted response when updating elements that have all the required fields' +
			' and the request fails', function() {
            var elementObs = [
                {
                    id: 1,
                    _projectId: "heyaproject",
                    _refId: 'master',
                    _commitId: 'latest',
                    name: '1'
                },
                {
                    id: 2,
                    _projectId: "heyaproject",
                    _refId: 'master',
                    _commitId: 'latest',
                    name: '2'
                }
            ];

            var mockedData = {
                elements: elementObs
            };
            // Ensure that the error handler is triggered correctly
            $httpBackend.when('POST', '/alfresco/service/projects/heyaproject/refs/master/elements').respond(500, mockedData);
            ElementServiceObj.updateElements(elementObs).then(function() {
                fail("Promise should not be resolved successfully");
            }, function(response) {
                expect(response.failedRequests[0].status).toEqual(500);
                expect(response.failedRequests[0].data).toEqual(elementObs);
            });
            $httpBackend.flush();
            $httpBackend.flush();
		});

        it('should respond with the appropriately formatted response when updating elements where some of them share' +
			' the same _refId and _projectId and some do not', function() {
            var element1 = {
                id: 1,
                _projectId: "heyaproject",
                _refId: 'ref1',
                _commitId: 'latest',
                name: '1'
            };
            var element2 = {
                id: 2,
                _projectId: "heyaproject",
                _refId: 'ref2',
                _commitId: 'latest',
                name: '2'
            };
            var element3 = {
                id: 3,
                _projectId: "heyaproject",
                _refId: 'ref2',
                _commitId: 'latest',
                name: '3'
            };
            var elementObs = [ element1, element2, element3 ];

            var mockedData1 = {
                elements: [element1]
            };

            var mockedData2 = {
                elements: [element2, element3]
            };

            // There should be two different post requests because element2 and element3 have same _refId and _projectId
            // while element1 has different _refId from the other two
            $httpBackend.expectPOST('/alfresco/service/projects/heyaproject/refs/ref1/elements').respond(200, mockedData1);
            $httpBackend.expectPOST('/alfresco/service/projects/heyaproject/refs/ref2/elements').respond(200, mockedData2);

            // updateElements however will wait for both requests and consolidate the result
            ElementServiceObj.updateElements(elementObs).then(function(responses) {
                expect(responses.length).toEqual(3);
                expect(responses).toEqual(elementObs);
            }, function() {
                fail("Promise should be resolved successfully");
            });
            $httpBackend.flush();
            $httpBackend.flush();
        });

        it('should respond with the appropriately formatted response when updating elements where some of them share' +
			' the same _refId and _projectId and some do not and when one of the requests fails', function() {
            var element1 = {
                id: 1,
                _projectId: "heyaproject",
                _refId: 'ref1',
                _commitId: 'latest',
                name: '1'
            };
            var element2 = {
                id: 2,
                _projectId: "heyaproject",
                _refId: 'ref2',
                _commitId: 'latest',
                name: '2'
            };
            var element3 = {
                id: 3,
                _projectId: "heyaproject",
                _refId: 'ref2',
                _commitId: 'latest',
                name: '3'
            };

            // There should be two different post requests because element2 and element3 have the same _refId and _projectId
            // while element1 has different _refId from the other two. Fail one of the requests
            $httpBackend.expectPOST('/alfresco/service/projects/heyaproject/refs/ref1/elements').respond(500, { elements: [element1]});
            $httpBackend.expectPOST('/alfresco/service/projects/heyaproject/refs/ref2/elements').respond(200, { elements: [element2, element3]});

            // updateElements however will wait for both requests and consolidate the result
            ElementServiceObj.updateElements([ element1, element2, element3 ]).then(function(responses) {
                fail("Promise should be resolved successfully because 1 of the requests failed with status code 500");
            }, function(response) {
                // one failed request
                expect(response.failedRequests.length).toEqual(1);
                expect(response.failedRequests[0].data).toEqual([element1]);
                // one successful requests with two element in it
                expect(response.successfulRequests.length).toEqual(2);
                expect(response.successfulRequests).toEqual([element2, element3]);
            });
            $httpBackend.flush();
            $httpBackend.flush();
        });
    });

	afterEach(function () {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	describe('getElement', function() {
		it('should get an element that is not in the cache', function() {
			var elemOb;
			var testElem = {
				projectId: "heyaproject",
				elementId: "heyanelement",
				refId: 'master',
				commitId: 'latest'
			};
			var result = {
					_modifier					: "admin",
					powertypeExtentIds			: [],
					representationId			: null,
					mdExtensionsIds				: [],
					templateBindingIds			: [],
					appliedStereotypeInstanceId	: "applid",
					templateParameterId			: null,
					isActive					: false,
					ownerId 					: "ownerid",
					type 						: "Class",
					isLeaf 						: false,
					clientDependencyIds 		: [],
					_displayedElements 			: ["diselements"],
					useCaseIds 					: [],
					syncElementId 				: null,
					classifierBehaviorId 		: null,
					interfaceRealizationIds 	: [],
					id 							: "heyanelement",
					_elasticId 					: "elasticid",
					_refId 						: "master",
					supplierDependencyIds 		: [],
					_modified 					: "2017-05-03T10:51:50.270-0700",
					_appliedStereotypeIds 		: ["stereotypeids"],
					nameExpression 				: null,
					ownedAttributeIds 			: ["ownedattr1","ownedattr2","ownedattr3","ownedattr4","ownedattr5"],
					packageImportIds 			: [],
					visibility 					: null,
					substitutionIds 			: [],
					documentation 				: "",
					redefinedClassifierIds 		: [],
					_editable 					: true,
					isAbstract 					: false,
					_contents:
						{
							type: "Expression",
							operand: [
								{
									instanceId: "instanceid",
									type: "InstanceValue"
								}
							]
						},
					_commitId 					: "commitid",
					_childViews: [
						{
							aggregation: "composite",
							id: "child1"
						},
						{
							aggregation: "composite",
							id: "child2"
						},
						{
							aggregation: "composite",
							id: "child3"
						},
						{
							aggregation: "composite",
							id: "child4"
						},
						{
							aggregation: "composite",
							id: "child5"
						}
					],
					generalizationIds 			: [],
					_creator 					: "admin",
					ownedOperationIds 			: [],
					_created 					: "2017-05-01T13:43:19.571-0700",
					name 						: "Krabby Patties",
					elementImportIds 			: [],
					collaborationUseIds 		: [],
					isFinalSpecialization 		: false,
					_projectId 					: "heyaproject"
			};
			$httpBackend.when('GET', root + '/projects/heyaproject/refs/master/elements/heyanelement').respond(
				function(method, url, data) {
					return [200, elements];
				});
			ElementServiceObj.getElement(testElem).then(function(data) {
				elemOb = data;
			}, function(reason) {
				elemOb = reason.message;
			});
			$httpBackend.flush();
            $httpBackend.flush();
			expect(elemOb).toEqual(result);
		});

		it('should include a recent version of the element when its latest version is not deleted given that the reqOb enables includeRecentVersionElement', function() {
            var mockedData = {};

            var reqOb = {
                projectId: "heyaproject",
                elementId: "heyanelement",
                refId: 'master',
                commitId: 'latest',
                includeRecentVersionElement: true
            };

            var mockedCommits = {
				commits: [{id: 1}, {id: 2}]
			};

            var mockedElementWithCommitId2 = {
                elements: [{name: 'docName', _commitId: 2}]
			};

            urlService.setTicket(null);

            $httpBackend.whenGET('/alfresco/service/projects/heyaproject/refs/master/elements/heyanelement').respond(410, mockedData);
            $httpBackend.whenGET(function(url) {
                return url.indexOf('/alfresco/service/projects/heyaproject/refs/master/elements/heyanelement/commits') !== -1;
            } ).respond(200, mockedCommits);
            $httpBackend.whenGET(function(url) {
                return url.indexOf('/alfresco/service/projects/heyaproject/refs/master/elements/heyanelement?commitId=2') !== -1;
            } ).respond(200, mockedElementWithCommitId2);
            ElementServiceObj.getElement(reqOb).then(function() {
            	fail('Since this is element is deleted, this method should reject with a latest version' +
					' of the element in the history instead.');
            }, function(response) {
            	expect(response.data.recentVersionOfElement).toEqual(mockedElementWithCommitId2.elements[0]);
            });

            $httpBackend.flush();
            $httpBackend.flush();
            $httpBackend.flush();
		});
	});

	describe('getElements', function() {
		it('should get elements not in the cache', function() {
			var elemsOb;
			var testElem = {
				projectId: "heyaproject",
				elementId: "heyanelement",
				refId: 'master',
				commitId: 'latest'
			};
			$httpBackend.when('GET', root + '/projects/heyaproject/refs/master/elements/heyanelement').respond(
				function(method, url, data) {
					return [200, elements];
				});
			ElementServiceObj.getElement(testElem).then(function(data) {
				elemsOb = data;
			}, function(reason) {
				elemsOb = reason.message;
			});
			$httpBackend.flush();
            $httpBackend.flush();
			expect(elemsOb).toEqual(result);
		});
	});

	xdescribe('cacheElement', function() { //redundant test?
		// it('should cache an element', function() {
		// 	var elemOb;
		// 	var testElem = {
		// 		projectId: "heyaproject",
		// 		elementId: "heyanelement",
		// 		refId: 'master',
		// 		commitId: 'latest'
		// 	};
		// 	ElementServiceObj.cacheElement(testElem).then(function(data) {

		// 	}, function(reason) {
		// 		elemOb = reason.message;
		// 	});
		// 	httpBackend.flush();
		// 	expect().toEqual();
		// });
	});

	describe('getElementForEdit', function() {
		it('should get an edit element from cache', function() {
			var elemOb;
			var reqOb = {
				projectId: "heyaproject",
				elementId: "heyanelement",
				refId: 'master',
				commitId: 'latest'
			};
			// var elemReturned = {};
			// elemReturned.elements = [reqOb];
			// $httpBackend.when('GET', root + '/projects/heyaproject/refs/master/elements/heyanelement').respond(200, elements);

			var key = mockUtilsService.makeElementKey({
				_projectId: reqOb.projectId,
				id: reqOb.elementId,
				_commitId: reqOb.commitId,
				_refId: reqOb.refId
			}, true);
			var val = mockCacheService.put(key, reqOb);

			ElementServiceObj.getElementForEdit(reqOb).then(function(data) {
				elemOb = data;
				expect(elemOb).toEqual(val);
			});
			$httpBackend.flush();
            $httpBackend.flush();
		});
	});

//TODO either test getownedelements or getgenericelements
	xdescribe('getOwnedElements', function() {
		it('should get an elements owned element objects', function() {
		});
	});
	xdescribe('getGenericElements', function() {
		// it('should get an element', function() {
		// 	var result;
		// 	var url = '/alfresco/service/projects/heyaproject/refs/master/elements';
		// 	var elemOb = {
		// 		projectId: "heyaproject",
		// 		elementId: "heyanelement",
		// 		refId: 'master',
		// 		commitId: 'latest'
		// 	};
		// 	var jsonKey = 'elements';
		// 	$httpBackend.when('GET', url).respond(200, elements.elements);

		// 	result = ElementServiceObj.getGenericElements(url, elemOb, jsonKey);
		// 	console.log("result : " + result);
		// 	$httpBackend.flush();
		// 	expect(result).toEqual(elements.elements)

		// });
	});

	describe('updateElement', function() {
		it('it should save an element to MMS and update the cache if successful', function() {
			var elemObReturned;
			var testElem = {
				_projectId: "heyaproject",
				id: "heyanelement",
				_refId: 'master',
				_commitId: 'latest',
				name: ''
			};
			var elemOb = {};
			elemOb.elements = [testElem];
			elemOb.source = mockApplicationService.getSource();

			var key = mockUtilsService.makeElementKey(testElem);
			mockCacheService.put(key, testElem);
			$httpBackend.when('POST', '/alfresco/service/projects/heyaproject/refs/master/elements').respond(201, elemOb);
			ElementServiceObj.updateElement(testElem).then(function(data) {
				elemObReturned = data;
			});
			$httpBackend.flush();
            $httpBackend.flush();
			expect(elemObReturned).toEqual(testElem);
			expect(mockCacheService.get(key)).toEqual(testElem);
		});
	});

	describe('createElement', function() {
		it('should get new element and add to cache', function() {
			var elemOb = {};
			var toCreate = {
				id: 'mmsid',
				ownerid: "holding_bin_heyaproject",
				name: "New Element",
				documentation: "Here is some text",
				type: "Class"
			};

			var newElem = {
				projectId: "heyaproject",
				element: "heyanelement",
				refId: 'master',
				commitId: 'latest'
			};

			var reqOb = {
				element: toCreate,
				projectId: newElem.projectId,
				refId: newElem.refId
			};

			var key = mockUtilsService.makeElementKey({
				_projectId: newElem.projectId,
				id: toCreate.id,
				_commitId: newElem.commitId,
				_refId: newElem.refId
			});
			var responseOb = {};
			responseOb.elements = [toCreate];
			responseOb.source = mockApplicationService.getSource();
			$httpBackend.expectPOST('/alfresco/service/projects/heyaproject/refs/master/elements', responseOb).respond(201, responseOb);
			var result = ElementServiceObj.createElement(reqOb).then(function(data) {
				elemOb = data;
			}, function(reason) {
				elemOb = reason.message;
			});
			$httpBackend.flush();
            $httpBackend.flush();
			expect(elemOb).toEqual(toCreate);
			expect(mockCacheService.get(key)).toEqual(toCreate);
		});
	});

	describe('search', function() {
		it('should return an element that matches query', function() {
			var searchText = 'krabby patties';
			var q = {
				id: searchText
			};
			var q2 = {
				query: searchText,
				fields: ["defaultValue.value", "value.value", "specification.value", "name", "documentation"]
			};
			var allQuery = {
				multi_match: q2
			};
			var idQuery = {
				term: q
			};
			var mainQuery = {
				"bool": {
					"should": [
						idQuery,
						allQuery
					]
				}
			};
			var q3 = {
				_projectId: ["heyaproject"]
			}
			var projectTermsOb = {
				terms: q3
			}
			var mainBoolQuery =[];
			mainBoolQuery.push(mainQuery, projectTermsOb);
			var queryOb = { //assuming searchType is 'all'
				"sort" : [
					"_score",
					{ "_modified" : {"order" : "desc"}}
				],
				"query": {
					"bool": {
						"must": mainBoolQuery
					}
				},
				"from": 21,
				"size": 20
			};
			var testElem = {
				_projectId: "heyaproject",
				_refId: 'master'
			};
			var resultElem = {
				_projectId: "heyaproject",
				id: "heyanelement",
				_refId: 'master',
				_commitId: 'latest'
			};
			$httpBackend.expectPUT('/alfresco/service/projects/heyaproject/refs/master/search?checkType=true&extended=true', queryOb).respond(201, {elements: resultElem});
			var reqOb = {
				projectId: "heyaproject",
				elementId: "heyanelement",
				refId: 'master',
				commitId: 'latest'
			};
			var elemOb = null;
			ElementServiceObj.search(reqOb, queryOb, null, null, null).then(function(data) {
				elemOb = data;
			});
			$httpBackend.flush();
            $httpBackend.flush();
			expect(elemOb).toEqual(resultElem);
		});
	});

	describe('getElementHistory', function() { //elementHistory returns a promise, how to test?
		it('should get an element', function() {
			var commitHistory = {
				commits: [
					{
						_created: "2017-04-27T16:23:44.357-0700",
						_creator: "admin",
						id: "someid1"
					},
					{
						_created: "2017-04-27T16:23:26.081-0700",
						_creator: "admin",
						id: "someid2"
					},
					{
						_created: "2017-04-27T16:23:06.540-0700",
						_creator: "admin",
						id: "someid3"
					}
				]
			};
			$httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/master/elements/getelementhistory/commits').respond(200, commitHistory);
			var elemOb = {
				projectId: "someprojectid",
				elementId: "getelementhistory",
				refId: "master",
				commitId: "latest"
			};

			var elemHistory = ElementServiceObj.getElementHistory(elemOb);
			$httpBackend.flush();
            $httpBackend.flush();
		});
	});
});
