'use strict';

describe('mmsTranscludeName directive', function () {
    var scope; //scope when directive is called
    var element; //dom element mms-transclude-name
    var $rootScope, $compile, CacheService, UtilsService;

    beforeEach(function () {
        module('mms.directives');
        inject(function ($injector) {
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            CacheService = $injector.get('CacheService');
            UtilsService = $injector.get('UtilsService');
            scope        = $rootScope.$new();

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
            scope.view = {sysmlid: 'valueViewId', name: 'merpity', values: [43221, 5432]};
        })
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
                value: [{type: 'LiteralReal', double: 433, valueExpression:null}]
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
                value: [{type: 'LiteralUnlimitedNatural', double: 433, valueExpression:null}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(433);
        expect(element.html()).toContain('ng-switch-when="LiteralUnlimitedNatural"');
        console.log("ELEMENT " + element.html());
    }));

    it('mmsTranscludeVal should transclude a ElementValue', inject(function () {
        var testElement = {
            sysmlid       : 'valueViewId',
            name          : 'merpity',
            specialization: {
                type : 'Element',
                value: [{type: 'ElementValue', double: 433, valueExpression:null}]
            }
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-val data-mms-eid="{{view.sysmlid}}"></mms-transclude-val>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain(433);
        expect(element.html()).toContain('ng-switch-when="ElementValue"');
        console.log("ELEMENT " + element.html());
    }));

});