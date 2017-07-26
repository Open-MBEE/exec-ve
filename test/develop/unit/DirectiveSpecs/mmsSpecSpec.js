'use strict';

describe('Directive: mmsSpec', function() {

	var element,
		elementOne,
		elementTwo,
		spec,
		specDir,
		scope;
	var $httpBackend;
	var $compile,
		$rootScope;

	beforeEach(module('mms'));
	beforeEach(module('mms.directives'));

	beforeEach(function() {
		inject(function($injector) {
			$rootScope = $injector.get('$rootScope');
			$compile = $injector.get('$compile');
			$httpBackend = $injector.get('$httpBackend');
			scope = $rootScope.$new();
		});

		elementOne = {
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
			_commitId: "latest",
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

		};

		elementTwo = {
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
			_modified					: "2017-05-04T10:51:50.270-0700",
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
			_commitId: "latest",
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
			name: "Big Mac",
			elementImportIds: [],
			collaborationUseIds: [],
			isFinalSpecialization: false,
			_projectId: "heyaproject"

		};

		$httpBackend.when('GET', '/alfresco/service/projects/heyaproject/refs/master/elements/heyanelement?extended=true').respond(200, elementTwo);

		scope.element = {
			mmsElementId: 'heyanelement',
			mmsProjectId: 'heyaproject',
			mmsRefId: 'master',
			mmsCommitId: 'latest'
		};
		specDir = angular.element('<mms-spec mms-element-id="{{element.mmsElementId}}" mms-project-id="{{element.mmsProjectId}}" mms-ref-id="{{element.mmsRefId}}" mms-commit-id="{{element.mmsCommitId}}" no-edit="true"></mms-spec>');
		$compile(specDir)(scope);
		scope.$apply();
	});

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should change an element in the spec with changeElement()', function() {
		specDir.isolateScope().changeElement(elementTwo.id, elementOne.id);
		expect(specDir.isolateScope().editable).toBe(true);
		$httpBackend.flush();
	});
});