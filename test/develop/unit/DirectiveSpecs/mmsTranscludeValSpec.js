'use strict';

describe('mmsTranscludeVal directive', function () {
    var scope; //scope when directive is called
    var element; //dom element mms-transclude-name
    var $rootScope, $compile, CacheService, UtilsService, $httpBackend, requestHandler;

    beforeEach(function () {
        module('mms.directives');
        inject(function ($injector) {
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            CacheService = $injector.get('CacheService');
            UtilsService = $injector.get('UtilsService');
            scope        = $rootScope.$new();

            // requestHandler = $httpBackend
            //     .when('GET', '/alfresco/service/workspaces/master/elements/_18_0_5_407019f_1468188892970_158569_14563')
            //     .respond();

            var responseTestElement = {
                name   : "responseTestElement",
                sysmlid: "_18_0_5_407019f_1468188892970_158569_14563"
            };

            var cacheKey = UtilsService.makeElementKey(responseTestElement.sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, responseTestElement);

            scope.values = [{
                type   : 'LiteralString',
                string : '431413',
                operand: [{
                    "valueExpression": null,
                    "type"           : "InstanceValue",
                    "instance"       : "_18_0_5_407019f_1468188892965_490446_14539"
                }]
            }, {
                type   : 'LiteralInteger',
                value  : 431413,
                operand: [{
                    "valueExpression": null,
                    "type"           : "InstanceValue",
                    "instance"       : "_18_0_5_407019f_1468188892965_490446_14539",
                    "string"         : "RestrictedValue"
                }]
            }];

            scope.version    = "latest";
            scope.editValues = [43, 42, 55, 2532];
            scope.view       = {sysmlid: 'valueViewId', name: 'merpity', values: [43221, 5432]};

        });

    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsTranscludeVal should transclude a LiteralInteger', inject(function () {
        var testElement = {
            sysmlid       : 'valueViewId',
            name          : 'merpity',
            specialization: {
                type : 'Element',
                value: [{type: 'LiteralInteger', integer: 34314}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(34314);
        expect(element.html()).toContain('ng-switch-when="LiteralInteger"');
    }));

    it('mmsTranscludeVal should transclude a LiteralBoolean', inject(function () {
        var testElement = {
            sysmlid       : 'valueViewId',
            name          : 'merpity',
            specialization: {
                type : 'Element',
                value: [{type: 'LiteralBoolean', boolean: true}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(true);
        expect(element.html()).toContain('ng-switch-when="LiteralBoolean"');
    }));

    it('mmsTranscludeVal should transclude a LiteralReal', inject(function () {
        var testElement = {
            sysmlid       : 'valueViewId',
            name          : 'merpity',
            specialization: {
                type : 'Element',
                value: [{type: 'LiteralReal', double: 433, valueExpression: null}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(433);
        expect(element.html()).toContain('ng-switch-when="LiteralReal"');
    }));

    it('mmsTranscludeVal should transclude a LiteralUnlimitedNatural', inject(function () {
        var testElement = {
            sysmlid       : 'valueViewId',
            name          : 'merpity',
            specialization: {
                type : 'Element',
                value: [{type: 'LiteralUnlimitedNatural', naturalValue: 433, valueExpression: null}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(433);
        expect(element.html()).toContain('ng-switch-when="LiteralUnlimitedNatural"');
    }));

    it('mmsTranscludeVal should transclude an ElementValue', inject(function () {
        // ElementValue will check to see if there is another element nested within itself. If it finds one, it will
        //  perform a transclude name on the sysmlid
        var testElement = {
            sysmlid       : 'valueViewId',
            name          : 'merpity',
            specialization: {
                type : 'Element',
                value: [{type: 'ElementValue', element: "otherElement", valueExpression: null}]
            }
        };

        var anotherElement = {
            sysmlid       : 'otherElement',
            name          : 'Other Element',
            specialization: {
                type : 'Element',
                value: [{type: 'ElementValue', element: "Id_of_element", valueExpression: null}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        cacheKey = UtilsService.makeElementKey(anotherElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, anotherElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain("otherElement");
        expect(element.html()).toContain('ng-switch-when="ElementValue"');
        expect(element.html()).toContain('mms-transclude-name');
    }));

    it('mmsTranscludeVal should transclude an InstanceValue', inject(function () {
        var testElement = {
            sysmlid       : 'valueViewId',
            name          : 'merpity',
            specialization: {
                type : 'Element',
                value: [{type: 'InstanceValue', instance: "_18_0_5_407019f_1468188892970_158569_14563"}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain("_18_0_5_407019f_1468188892970_158569_14563");
        expect(element.html()).toContain('ng-switch-when="InstanceValue"');
        expect(element.html()).toContain('responseTestElement');
    }));

    it('mmsTranscludeVal should transclude an OpaqueExpression', inject(function () {
        scope.testElement = {
            documentation : "",
            sysmlid       : "notInThePast",
            name          : "notInThePast",
            owner         : "PROJECT-123456",
            specialization: {
                type         : "Constraint",
                specification: {
                    type          : "OpaqueExpression",
                    expressionBody: ["foo8"]
                }
            }
        };

        var cacheKey = UtilsService.makeElementKey(scope.testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, scope.testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{testElement.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain("foo8");
        expect(element.html()).toContain('ng-switch-when="OpaqueExpression"');
    }));
});