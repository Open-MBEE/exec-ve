'use strict';

describe('Directive: mmsView', function () {
    var scope; //scope when directive is called
    jasmine.getFixtures().fixturesPath = 'base/test/mock-data/UtilsService';
    jasmine.getJSONFixtures().fixturesPath = 'base/test/mock-data/UtilsService';
    var element; //dom element mms-transclude-name
    var $rootScope,
        $compile,
        CacheService,
        UtilsService,
        ElementService,
        ViewService;

    var $httpBackend;

    beforeEach(module('mms.directives'));
    beforeEach(module('mms'));

    beforeEach(function () {
        inject(function ($injector) {
            $rootScope = $injector.get('$rootScope');
            $compile = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            ElementService = $injector.get('ElementService');
            CacheService = $injector.get('CacheService');
            UtilsService = $injector.get('UtilsService');
            ViewService = $injector.get('ViewService');
            scope = $rootScope.$new();
            var tableJson = getJSONFixture('UtilsService/makeHtmlTable.json');

            // This is regular view that contains a single element as a document
            var testElement = 
            {
                elements:[
                {
                    stereotypedElementId: null,
                    _modifier: "merp",
                    mdExtensionsIds: [],
                    _qualifiedId: "/CAE/PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85/view_instances_bin_PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85/_hidden_MMS_1494375137481_ece54831-ddd5-437a-a807-b9dc91a0f33d_pei",
                    appliedStereotypeInstanceId: null,
                    templateParameterId: null,
                    ownerId: "view_instances_bin_PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85",
                    type: "InstanceSpecification",
                    clientDependencyIds: [],
                    slotIds: [],
                    syncElementId: null,
                    id: "someelementid",
                    _elasticId: "e735f893-2bfc-4009-bd01-fde357c1cb34",
                    supplierDependencyIds: [],
                    _modified: "2017-05-19T13:22:31.614-0700",
                    _refId: "master",
                    _appliedStereotypeIds: [],
                    nameExpression: null,
                    classifierIds: ["_17_0_5_1_407019f_1431903758416_800749_12055"],
                    visibility: "public",
                    documentation: "<p>here is some text testing testing one two three testing here is some text<\/p>\n",
                    _qualifiedName: "//OpenCAE/View Instances Bin/View Documentation",
                    specification:
                        {
                            type: "LiteralString",
                            value: "{\"type\":\"Paragraph\",\"sourceType\":\"reference\",\"source\":\"_hidden_MMS_1494375137481_ece54831-ddd5-437a-a807-b9dc91a0f33d_pei\",\"sourceProperty\":\"documentation\"}"
                        },
                    _editable: true,
                    _commitId: "latest",
                    _relatedDocuments:[
                        {
                            name: "viewt",
                            id: "MMS_1494022115465_7a270a66-152c-410e-921d-19de23e9efe9",
                            refId: "master",
                            projectId: "PROJECT-ID_10_15_15_1_41_52_PM_5b84f7be_1506a83819c__6bce_cae_tw_jpl_nasa_gov_128_149_19_85",
                            _parentViews: [
                            {
                                name: "asfsfdf",
                                id: "MMS_1494375137481_e945e66b-f5a3-42ec-931b-751343e4dd70"
                            }
                            ]
                        }
                    ],
                    _creator: "merp",
                    _created: "2017-05-09T17:12:17.165-0700",
                    name: "View Documentation",
                    deploymentIds: [],
                    _projectId: "someprojectid"
                }
            ]};

            // This element reference another document
            var element301 = {
                elements: [{
                    name: "301 Element",
                    id: "301",
                    documentation: '<mms-transclude-doc data-mms-eid="302"></mms-transclude-doc>',
                    specification: {
                        value: "{\"sourceProperty\":\"documentation\",\"source\":\"302\",\"type\":\"Paragraph\"}",
                        type: "LiteralString"
                    },
                    classifierIds: ["Classify this!"],
                    type: "InstanceSpecification"
                }]
            };

            var element302 = {
                elements: [{
                    name: "302 Element",
                    id: "302",
                    documentation: 'Omg I have this working\!\!\!\!',
                    _appliedStereotypeIds: ["How Meta...."],
                    specification: {
                        value: "{\"sourceProperty\":\"documentation\",\"source\":\"302\",\"type\":\"Paragraph\"}",
                        type: "LiteralString"
                    },
                    classifierIds: ["Too Classy for you"],
                    type: "InstanceSpecification"
                }]
            };

            var sectionView = {
                elements: [{
                    name: "Section View Element",
                    id: "sectionView",
                    _modified: "2016-05-25T12:16:06.856-0700",
                    _modifier: "catTester",
                    documentation: '<mms-tansclude-doc mms-eid="sectionElement"></mms-tansclude-doc>',
                    type: "Class",
                    _contents: {
                        valueExpression: null,
                        operand: [{
                            valueExpression: null,
                            type: "InstanceValue",
                            instanceId: "sectionElement"
                        }],
                        type: "Expression"
                    }
                }]
            };

            var sectionElement = {
                elements: [{
                    name: "Section Element",
                    id: "sectionElement",
                    documentation: 'Super Sleezy Secular Section',
                    _appliedStereotypeIds: ["How Meta...."],
                    specification: {
                        valueExpression: null,
                        type: "Expression",
                        operand: [{
                            valueExpression: null,
                            type: "InstanceValue",
                            instanceId: "tableElement"
                        }]
                    },
                    classifierIds: ["_17_0_5_1_407019f_1430628211976_255218_12002"],
                    type: "InstanceSpecification"
                }]
            };

            var tableElement = {
                elements: [{
                    name: "Table Element",
                    id: "tableElement",
                    documentation: 'This is a table element\!',
                    _appliedStereotypeIds: ["How Meta...."],
                    specification: {
                        // string: tableJson,
                        value: JSON.stringify(tableJson),
                        type: "LiteralString"
                    },
                    classifierIds: ["_17_0_5_1_407019f_1430628178633_708586_11903"],
                    type: "InstanceSpecification"
                }]
            };


            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/elements\/someelementid/).respond(200, testElement);
            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/elements\/301/).respond(200, element301);
            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/elements\/302/).respond(200, element302);
            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/elements\/sectionView/).respond(200, sectionView);
            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/elements\/sectionElement/).respond(200, sectionElement);
            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/elements\/tableElement/).respond(200, tableElement);

            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/views\/8008\/elements/).respond(200,
                {elements: [element301.elements[0]]}
            );

            $httpBackend.when('GET', /alfresco\/service\/projects\/someprojectid\/refs\/master\/views\/sectionView\/elements/).respond(200,
                {elements: [sectionElement.elements[0], tableElement.elements[0]]}
            );

            // var cacheKey = UtilsService.makeElementKey(testElement.elements[0].id, 'master', 'latest', false);
            // CacheService.put(cacheKey, testElement.elements[0]);

            // cacheKey = UtilsService.makeElementKey(element301.elements[0].id, 'master', 'latest', false);
            // CacheService.put(cacheKey, element301.elements[0]);

            // cacheKey = UtilsService.makeElementKey(element302.elements[0].id, 'master', 'latest', false);
            // CacheService.put(cacheKey, element302.elements[0]);

            // cacheKey = UtilsService.makeElementKey(sectionView.elements[0].id, 'master', 'latest', false);
            // CacheService.put(cacheKey, sectionView.elements[0]);

            // cacheKey = UtilsService.makeElementKey(sectionElement.elements[0].id, 'master', 'latest', false);
            // CacheService.put(cacheKey, sectionElement.elements[0]);

            // cacheKey = UtilsService.makeElementKey(tableElement.elements[0].id, 'master', 'latest', false);
            // CacheService.put(cacheKey, tableElement.elements[0]);

        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsView should transclude a basic view', inject(function () {
        scope.view = {
            mmsElementId: "someelementid",
            mmsProjectId: "someprojectid",
            mmsRefId: "master",
            mmsCommitId: "latest"
        };
        element = angular.element('<mms-view mms-element-id="{{view.mmsElementId}}" mms-project-id="{{view.mmsProjectId}}" mms-ref-id="{{view.mmsRefId}}" mms-commit-id="{{view.mmsCommitId}}" ></mms-view>');
        $compile(element)(scope);

        scope.$apply();
        $httpBackend.flush();
        expect(element.html()).toContain('div id="someelementid"');
        // console.log(element.html());
    }));

    it('mmsView should transclude an view section with a table within it', inject(function () {
        scope.view = {
            mmsElementId: "sectionView",
            mmsRefId: "master",
            mmsCommitId: "latest",
            mmsProjectId: "someprojectid"
        };

        element = angular.element('<mms-view mms-element-id="{{view.mmsElementId}}" mms-project-id="{{view.mmsProjectId}}" mms-commit-id="{{view.mmsCommitId}}" mms-ref-id="{{view.mmsRefId}}" ></mms-view>');
        $compile(element)(scope);

        scope.$apply();
        $httpBackend.flush();
        // console.log(element.html());
        // expect(element.html()).toContain('<mms-transclude-name data-mms-eid=\"sectionView\"');
        expect(element.html()).toContain('div id="sectionView"');
        expect(element.html()).toContain("<mms-view-section data-mms-section=\"presentationElem\"");
        expect(element.html()).toContain("<div id=\"tableElement\" ng-if=\"\!presentationElemLoading\"");
        expect(element.html()).toContain("<mms-view-table data-mms-table=\"presentationElem\"");
    }));
});