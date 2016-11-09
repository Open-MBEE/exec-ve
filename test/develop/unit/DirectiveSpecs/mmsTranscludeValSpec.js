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
                sysmlId: "_18_0_5_407019f_1468188892970_158569_14563"
            };

            var cacheKey = UtilsService.makeElementKey(responseTestElement.sysmlId, 'master', 'latest', false);
            CacheService.put(cacheKey, responseTestElement);
//TODO these values are very messed up
            scope.values = [{
                type   : 'LiteralString',
                value : '431413',
                operand: [{
                    "valueExpression": null,
                    "type"           : "InstanceValue",
                    "instanceId"       : "_18_0_5_407019f_1468188892965_490446_14539"
                }]
            }, {
                type   : 'LiteralInteger',
                value  : 431413,
                operand: [{
                    "valueExpression": null,
                    "type"           : "InstanceValue",
                    "instanceId"       : "_18_0_5_407019f_1468188892965_490446_14539",
                }]
            }];
            scope.version    = "latest";
            scope.editValues = [43, 42, 55, 2532];
            scope.view       = {sysmlId: 'valueViewId', name: 'merpity', values: [43221, 5432]};
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsTranscludeVal should transclude a LiteralInteger', inject(function () {
        var testElement = {
            sysmlId       : 'valueViewId',
            name          : 'merpity',
            type : 'Slot',
            value: [{type: 'LiteralInteger', value: 34314}]
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlId}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(34314);
        expect(element.html()).toContain('ng-switch-when="LiteralInteger"');
    }));

    it('mmsTranscludeVal should transclude a LiteralBoolean', inject(function () {
        var testElement = {
            sysmlId       : 'valueViewId',
            name          : 'merpity',
            type : 'Slot',
            value: [{type: 'LiteralBoolean', value: true}]
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlId}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(true);
        expect(element.html()).toContain('ng-switch-when="LiteralBoolean"');
    }));

    it('mmsTranscludeVal should transclude a LiteralReal', inject(function () {
        var testElement = {
            sysmlId       : 'valueViewId',
            name          : 'merpity',
            type : 'Slot',
            value: [{type: 'LiteralReal', value: 433, valueExpression: null}]
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlId}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(433);
        expect(element.html()).toContain('ng-switch-when="LiteralReal"');
    }));

    it('mmsTranscludeVal should transclude a LiteralUnlimitedNatural', inject(function () {
        var testElement = {
            sysmlId       : 'valueViewId',
            name          : 'merpity',
            type : 'Slot',
            value: [{type: 'LiteralUnlimitedNatural', value: 433, valueExpression: null}]
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlId}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(433);
        expect(element.html()).toContain('ng-switch-when="LiteralUnlimitedNatural"');
    }));

    it('mmsTranscludeVal should transclude an ElementValue', inject(function () {
        // ElementValue will check to see if there is another element nested within itself. If it finds one, it will
        //  perform a transclude name on the sysmlid
        var testElement = {
            sysmlId       : 'valueViewId',
            name          : 'merpity',
            type : 'Slot',
            value: [{type: 'ElementValue', elementId: "otherElement", valueExpression: null}]
            
        };

        var anotherElement = {
            sysmlId       : 'otherElement',
            name          : 'Other Element',
            type : 'Slot',
            value: [{type: 'ElementValue', elementId: "Id_of_element", valueExpression: null}]
            
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        cacheKey = UtilsService.makeElementKey(anotherElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, anotherElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlId}}"></mms-transclude-val>');
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
            type : 'Slot',
            value: [{type: 'InstanceValue', instanceId: "_18_0_5_407019f_1468188892970_158569_14563"}]
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlId}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain("_18_0_5_407019f_1468188892970_158569_14563");
        expect(element.html()).toContain('ng-switch-when="InstanceValue"');
        expect(element.html()).toContain('responseTestElement');
    }));

    it('mmsTranscludeVal should transclude an OpaqueExpression', inject(function () {
        scope.testElement = {
            documentation : "",
            sysmlId       : "notInThePast",
            name          : "notInThePast",
            ownerId         : "PROJECT-123456",
            type         : "Constraint",
            specification: {
                type          : "OpaqueExpression",
                body: ["foo8"]
            }
        };

        var cacheKey = UtilsService.makeElementKey(scope.testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, scope.testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{testElement.sysmlId}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain("foo8");
        expect(element.html()).toContain('ng-switch-when="OpaqueExpression"');
    }));
});