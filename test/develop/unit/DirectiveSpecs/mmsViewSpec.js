'use strict';

describe('mmsTranscludeVal directive', function () {
    var scope; //scope when directive is called
    jasmine.getFixtures().fixturesPath = 'base/test/mock-data/UtilsService';
    jasmine.getJSONFixtures().fixturesPath = 'base/test/mock-data/UtilsService';
    var element; //dom element mms-transclude-name
    var $rootScope,
        $compile,
        CacheService,
        UtilsService,
        $httpBackend;

    beforeEach(function () {
        module('mms.directives');
        module('mms');
        inject(function ($injector) {
            $rootScope = $injector.get('$rootScope');
            $compile = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            CacheService = $injector.get('CacheService');
            UtilsService = $injector.get('UtilsService');
            scope = $rootScope.$new();
            var tableJson = getJSONFixture('UtilsService/makeHtmlTable.json');

            // This is regular view that contains a single element as a document
            var testElement = {
                elements: [{
                    name: "Test Element",
                    sysmlid: "8008",
                    modified: "2016-05-25T12:16:06.856-0700",
                    modifier: "catTester",
                    documentation: '<mms-transclude-doc mms-eid="301"></mms-transclude-doc>',
                    specialization: {
                        type: "View",
                        contents: {
                            valueExpression: null,
                            operand: [{
                                valueExpression: null,
                                type: "InstanceValue",
                                instance: "301"
                            }],
                            type: "Expression"
                        },
                        view2view: [{childrenViews: [], id: "301"}],
                        childViews: [{
                            childrenViews: [],
                            id: "301"
                        }]
                    }
                }]
            };

            // This element reference another document
            var element301 = {
                elements: [{
                    name: "301 Element",
                    sysmlid: "301",
                    documentation: '<mms-transclude-doc data-mms-eid="302"></mms-transclude-doc>',
                    specialization: {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            string: "{\"sourceProperty\":\"documentation\",\"source\":\"302\",\"type\":\"Paragraph\"}",
                            type: "LiteralString"
                        },
                        classifier: ["Classify this!"],
                        type: "InstanceSpecification"
                    },
                    isMetatype: false
                }]
            };

            var element302 = {
                elements: [{
                    name: "302 Element",
                    sysmlid: "302",
                    documentation: 'Omg I have this working\!\!\!\!',
                    appliedMetatypes: ["How Meta...."],
                    specialization: {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            string: "{\"sourceProperty\":\"documentation\",\"source\":\"302\",\"type\":\"Paragraph\"}",
                            type: "LiteralString"
                        },
                        classifier: ["Too Classy for you"],
                        type: "InstanceSpecification"
                    },
                    isMetatype: false
                }]
            };

            var sectionView = {
                elements: [{
                    name: "Section View Element",
                    sysmlid: "sectionView",
                    modified: "2016-05-25T12:16:06.856-0700",
                    modifier: "catTester",
                    documentation: '<mms-tansclude-doc mms-eid="sectionElement"></mms-tansclude-doc>',
                    specialization: {
                        type: "View",
                        contents: {
                            valueExpression: null,
                            operand: [{
                                valueExpression: null,
                                type: "InstanceValue",
                                instance: "sectionElement"
                            }],
                            type: "Expression"
                        }
                    }
                }]
            };

            var sectionElement = {
                elements: [{
                    name: "Section Element",
                    sysmlid: "sectionElement",
                    documentation: 'Super Sleezy Secular Section',
                    appliedMetatypes: ["How Meta...."],
                    specialization: {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            type: "Expression",
                            operand: [{
                                valueExpression: null,
                                type: "InstanceValue",
                                instance: "tableElement"
                            }]
                        },
                        classifier: ["_17_0_5_1_407019f_1430628211976_255218_12002"],
                        type: "InstanceSpecification"
                    },
                    isMetatype: false
                }]
            };

            var tableElement = {
                elements: [{
                    name: "Table Element",
                    sysmlid: "tableElement",
                    documentation: 'This is a table element\!',
                    appliedMetatypes: ["How Meta...."],
                    specialization: {
                        instanceSpecificationSpecification: {
                            // string: tableJson,
                            string: JSON.stringify(tableJson),
                            type: "LiteralString"
                        },
                        slots:[],
                        classifier: ["_17_0_5_1_407019f_1430628178633_708586_11903"],
                        type: "InstanceSpecification"
                    },
                    isMetatype: false
                }]
            };


            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/8008/).respond(200, testElement);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/301/).respond(200, element301);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/302/).respond(200, element302);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/sectionView/).respond(200, sectionView);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/sectionElement/).respond(200, sectionElement);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/tableElement/).respond(200, tableElement);

            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/views\/8008\/elements/).respond(200,
                {elements: [element301.elements[0]]}
            );

            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/views\/sectionView\/elements/).respond(200,
                {elements: [sectionElement.elements[0], tableElement.elements[0]]}
            );

            var cacheKey = UtilsService.makeElementKey(testElement.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, testElement.elements[0]);

            cacheKey = UtilsService.makeElementKey(element301.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, element301.elements[0]);

            cacheKey = UtilsService.makeElementKey(element302.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, element302.elements[0]);

            cacheKey = UtilsService.makeElementKey(sectionView.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, sectionView.elements[0]);

            cacheKey = UtilsService.makeElementKey(sectionElement.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, sectionElement.elements[0]);

            cacheKey = UtilsService.makeElementKey(tableElement.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, tableElement.elements[0]);

        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsView should transclude a basic view', inject(function () {
        scope.view = {
            sysmlid: "8008",
            sectionNumber: "3241",
            ws: "master",
            version: "latest"
        };

        element = angular.element('<mms-view mms-vid="{{view.sysmlid}}" data-mms-section="{{view.sectionNumber}}" mms-version="{{view.version}}" mms-ws="{{view.ws}}" ></mms-view>');
        $compile(element)(scope);

        scope.$apply();
        $httpBackend.flush();
        expect(element.html()).toContain('data-mms-eid="8008"');
        expect(element.html()).toContain(">Test Element<");
        expect(element.html()).toContain("Last Modified");
        expect(element.html()).toContain("by catTester");
        expect(element.html()).toContain("5/25/16 12:16");
        // console.log(element.html());
    }));

    it('mmsView should transclude an view section with a table within it', inject(function () {
        scope.view = {
            sysmlid: "sectionView",
            sectionNumber: "666",
            ws: "master",
            version: "latest"
        };

        element = angular.element('<mms-view mms-vid="{{view.sysmlid}}" mms-version="{{view.version}}" mms-ws="{{view.ws}}" ></mms-view>');
        $compile(element)(scope);

        scope.$apply();
        $httpBackend.flush();
        // console.log(element.html());
        expect(element.html()).toContain('<mms-transclude-name data-mms-eid=\"sectionView\"');
        expect(element.html()).toContain(">Section View Element<");
        expect(element.html()).toContain("<mms-view-section data-mms-section=\"presentationElem\"");
        expect(element.html()).toContain("<div id=\"tableElement\" ng-if=\"\!presentationElemLoading\"");
        expect(element.html()).toContain("<mms-view-table data-mms-table=\"presentationElem\"");
    }));
});