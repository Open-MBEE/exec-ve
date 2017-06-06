'use strict';

describe('Service: ElementService', function() {
	
	var root = '/alfresco/service';
	var $httpBackend;
	var mockURLService, mockUtilsService, mockCacheService, mockHttpService, mockApplicationService;
	var ElementServiceObj;
	var projects = {};
	var ref = {};
	var refs = {};
	var elements = {};
	var result = {};
	var elementHistory;

	beforeEach(module('mms'));
	beforeEach(function() {
		inject(function($injector) {
			$httpBackend 			= $injector.get('$httpBackend');
			mockURLService			= $injector.get('URLService');
			mockUtilsService		= $injector.get('UtilsService');
			mockCacheService		= $injector.get('CacheService');
			mockHttpService			= $injector.get('HttpService');
			mockApplicationService	= $injector.get('ApplicationService');
			ElementServiceObj		= $injector.get('ElementService');
		});

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
		}

		$httpBackend.when('GET', '/alfresco/service/projects').respond(200, projects);

		ref = [{
			_elasticId: "refelastic3",
			id: "thirdref",
			name: "thirdref"
		}]


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
		}

		$httpBackend.when('GET', '/alfresco/service/projects/projectId/refs').respond(200, refs);

		elements = {
			elements: [
				{
					_allowedElements			: [],
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
		}

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
		}

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
			expect(elemOb).toEqual(result);
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

	describe('getElementForEdit', function() { //getElementForEdit returns a promise, how to test?
		it('should get an element', function() {
			var elemOb;
			var testElem = {
				projectId: "heyaproject",
				elementId: "heyanelement",
				refId: 'master',
				commitId: 'latest'
			};
			$httpBackend.when('GET', root + '/projects/heyaproject/refs/master/elements/heyanelement').respond(200, testElem);
			
			var key = mockUtilsService.makeElementKey(testElem);
			var val = mockCacheService.put(key, testElem);

			var result = ElementServiceObj.getElementForEdit(testElem);
			$httpBackend.flush();
		});
	});

	xdescribe('getOwnedElements', function() {
		it('should get an elements owned element objects', function() {

		});
	});

	describe('getGenericElements', function() {
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

	xdescribe('fillInElement', function() {
		it('should get an element', function() {

		});
	});

	xdescribe('updateElement', function() {
		it('it should save an element to MMS and update the cache if successful', function() {
			var elemOb;
			var testElem = {
				_projectId: "heyaproject",
				id: "heyanelement",
				_refId: 'master',
				_commitId: 'latest'
			};
			var key = mockUtilsService.makeElementKey(testElem);
			mockCacheService.put(key, testElem);
			$httpBackend.when('GET', '/alfresco/service/projects/heyaproject/refs/master/elements/heyanelement').respond(200, testElem);

			$httpBackend.when('POST', '/alfresco/service/projects/heyaproject/refs/master/elements', elements.elements).respond(501, elements.elements);

			ElementServiceObj.updateElement(testElem).then(function(data) {
				elemOb = data;
			}, function(reason) {
				elemOb = reason.message;
			});
			$httpBackend.flush();
			expect(elemOb).toEqual();
		});
	});

	xdescribe('updateElements', function() {
		it('should get an element', function() {

		});
	});

	xdescribe('createElement', function() {
		it('should get an element', function() {
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

			$httpBackend.when('POST', '/alfresco/service/projects/heyaproject/refs/master/elements', elements.elements).respond(201, elements.elements);

			var result = ElementServiceObj.createElement(reqOb);		
			console.log("result: " + result);
		});
	});

	xdescribe('createElements', function() {
		it('should get an element', function() {

		});
	});

	describe('isCacheOutdated: do not need to test', function() {
	});

	xdescribe('search', function() {
		it('should get an element', function() {
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
			$httpBackend.when('POST', '/alfresco/service/projects/heyaproject/refs/master?search=' + searchText).respond(201, resultElem);
			var reqOb = {
				projectId: "heyaproject",
				elementId: "heyanelement",
				refId: 'master',
				commitId: 'latest'
			};
			var elemOb = null;
			ElementServiceObj.search(reqOb, queryOb, null, null, null).then(function(data) {
				elemOb = data;
			}, function(reason) {
				elemOb = reason.message;
			});
			expect(elemOb).toEqual(resultElem);
			$httpBackend.flush();
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

			$httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/master/elements/getelementhistory/history').respond(200, commitHistory);

			var elemOb = {
				projectId: "someprojectid",
				elementId: "getelementhistory",
				refId: "master",
				commitId: "latest"
			};

			var elemHistory = ElementServiceObj.getElementHistory(elemOb);
			$httpBackend.flush();
		});
	});

	describe('reset: do not need to test', function() {
	});
})