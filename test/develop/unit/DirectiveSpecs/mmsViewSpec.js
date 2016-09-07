'use strict';

describe('mmsTranscludeVal directive', function () {
    var scope; //scope when directive is called
    jasmine.getFixtures().fixturesPath     = 'base/test/mock-data/UtilsService';
    jasmine.getJSONFixtures().fixturesPath = 'base/test/mock-data/UtilsService';
    var element; //dom element mms-transclude-name
    var $rootScope,
        $compile,
        CacheService,
        UtilsService,
        $httpBackend,
        ViewService,
        URLService,
        httpService,
        $http;

    beforeEach(function () {
        module('mms.directives');
        module('mms');
        inject(function ($injector) {
            $rootScope    = $injector.get('$rootScope');
            $compile      = $injector.get('$compile');
            $httpBackend  = $injector.get('$httpBackend');
            CacheService  = $injector.get('CacheService');
            UtilsService  = $injector.get('UtilsService');
            ViewService   = $injector.get('ViewService');
            URLService    = $injector.get('URLService');
            httpService   = $injector.get('HttpService');
            $http         = $injector.get('$http');
            scope         = $rootScope.$new();
            var tableJson = jasmine.getFixtures().read('html/baselineMakeHtmlTable.html');

            var testElement = {
                elements: [{
                    name          : "Test Element",
                    sysmlid       : "8008",
                    modified      : "2016-05-25T12:16:06.856-0700",
                    modifier      : "catTester",
                    documentation : '<mms-transclude-doc mms-eid="301"></mms-transclude-doc>',
                    specialization: {
                        type    : "View",
                        displayedElements : ['301'],
                        // contains         : [],
                        contents: {
                            valueExpression: null,
                            operand        : [{
                                valueExpression: null,
                                type           : "InstanceValue",
                                instance       : "301"
                            }],
                            type           : "Expression"
                        },

                        view2view : [
                            {childrenViews: [], id: "301"}
                        ],
                        childViews: [{
                            childrenViews: [],
                            id           : "301"
                        }]
                    }
                }]
            };

            var element301 = {
                elements: [{
                    name          : "301 Element",
                    sysmlid       : "301",
                    documentation : '<mms-transclude-doc data-mms-eid="302"></mms-transclude-doc>',
                    specialization: {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            string         : "{\"sourceProperty\":\"documentation\",\"source\":\"302\",\"type\":\"Paragraph\"}",
                            type           : "LiteralString"
                        },
                        classifier                        : ["Classify this!"],
                        type                              : "InstanceSpecification"
                    },
                    isMetatype    : false
                }]
            };

            var element302 = {
                elements: [{
                    name            : "302 Element",
                    sysmlid         : "302",
                    documentation   : 'Omg I have this working\!\!\!\!',
                    appliedMetatypes: ["How Meta...."
                    ],
                    specialization  : {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            string         : "{\"sourceProperty\":\"documentation\",\"source\":\"302\",\"type\":\"Paragraph\"}",
                            type           : "LiteralString"
                        },
                        classifier                        : ["Too Classy for you"],
                        type                              : "InstanceSpecification"
                    },
                    isMetatype      : false
                }]
            };

            var sectionElement = {
                elements: [{
                    name            : "Section Element",
                    sysmlid         : "sectionElement",
                    documentation   : 'This is a section element\!',
                    appliedMetatypes: ["How Meta...."],
                    specialization  : {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            type           : "Expression",
                            operand        : [{
                                valueExpression: null,
                                type           : "InstanceValue",
                                instance       : "tableElement"
                            }]
                        },
                        classifier                        : ["_17_0_5_1_407019f_1431903758416_800749_12055"],
                        type                              : "InstanceSpecification"
                    },
                    isMetatype      : false
                }]
            };

            var tableElement = {
                elements: [{
                    name            : "Table ELement",
                    sysmlid         : "tableElement",
                    documentation   : 'Omg I have this working\!\!\!\!',
                    appliedMetatypes: ["How Meta...."],
                    specialization  : {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            string         : JSON.stringify(tableJson),
                            type           : "LiteralString"
                        },
                        type                              : "InstanceSpecification"
                    },
                    isMetatype      : false
                }]
            };

            var tableDocument = {
                elements: [{
                    name          : "Table Document",
                    sysmlid       : "tableDocument",
                    documentation : 'Merp Table Doc',
                    specialization: {
                        instanceSpecificationSpecification: {
                            valueExpression: null,
                            string         : "{\"sourceProperty\":\"documentation\",\"source\":\"302\",\"type\":\"Paragraph\"}",
                            type           : "LiteralString"
                        },
                        classifier                        : ["Classify this!"],
                        type                              : "InstanceSpecification"
                    },
                    isMetatype    : false
                }]
            };

            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/8008/).respond(200, testElement);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/301/).respond(200, element301);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/302/).respond(200, element302);

            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/sectionElement/).respond(200, sectionElement);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/tableElement/).respond(200, tableElement);
            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/views\/8008\/elements/).respond(200,
                {elements: [element301.elements[0], sectionElement.elements[0], tableElement.elements[0]]}
            );

            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/tableDocument/).respond(200, tableDocument);

            var cacheKey = UtilsService.makeElementKey(testElement.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, testElement.elements[0]);

            cacheKey = UtilsService.makeElementKey(element301.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, element301.elements[0]);

            cacheKey = UtilsService.makeElementKey(element302.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, element302.elements[0]);

            cacheKey = UtilsService.makeElementKey(sectionElement.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, sectionElement.elements[0]);

            cacheKey = UtilsService.makeElementKey(tableElement.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, tableElement.elements[0]);

            cacheKey = UtilsService.makeElementKey(tableDocument.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, tableDocument.elements[0]);
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    // TODO: NEEDS TO BE FINISHED
    it('mmsView should transclude a basic view', inject(function () {
        scope.view = {
            sysmlid      : "8008",
            sectionNumber: "3241",
            ws           : "master",
            version      : "latest"
        };

        element = angular.element('<mms-view mms-vid="{{view.sysmlid}}" data-mms-section="{{view.sectionNumber}}" mms-version="{{view.version}}" mms-ws="{{view.ws}}" ></mms-view>');
        $compile(element)(scope);

        scope.$apply();
        console.log(element.html());

        expect(element.html()).toContain('data-mms-eid="8008"');
        expect(element.html()).toContain(">Test Element<");
        expect(element.html()).toContain("Last Modified");
        expect(element.html()).toContain("by catTester");
        expect(element.html()).toContain("5/25/16 12:16");

        $httpBackend.flush();
    }));
});