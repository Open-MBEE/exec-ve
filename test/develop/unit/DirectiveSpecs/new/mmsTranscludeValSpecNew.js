'use strict';

xdescribe('Directive: mmsTranscludeVal', function () {
    var scope,
        element; 
    var $rootScope, 
        $compile;
    var $httpBackend;

    beforeEach(function () {
        module('mms.directives');
        inject(function ($injector) {
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            scope        = $rootScope.$new();
        });

        var testElements = {
            elements: [
                {
                    _modifier: "merp", 
                    id: "firstelementid",
                    _modified: "2017-05-19T13:22:31.614-0700",
                    _refId: "master",
                    documentation: "",
                    _commitId: "latest",
                    _creator: "merp",
                    _created: "2017-05-09T17:12:17.165-0700",
                    name: "First Element",
                    _projectId: "someprojectid",
                    type    : 'LiteralString',
                    value   : '431413',
                    operand : [
                        {
                            "valueExpression": null,
                            "type"           : "InstanceValue",
                            "instanceId"       : "_18_0_5_407019f_1468188892965_490446_14539"
                        }
                    ]
                },
                {
                    _modifier: "merp", //same as element above, but added text in documentation
                    id: "firstelementid",
                    _modified: "2017-05-20T13:22:31.614-0700",
                    _refId: "master",
                    documentation: "<p>This the first element in the array! How exciting!</p>",
                    _commitId: "3042934",
                    _creator: "merp",
                    _created: "2017-05-09T17:12:17.165-0700",
                    name: "First Element",
                    _projectId: "someprojectid" 
                },
                {
                    _modifier: "merp", //same as element above, but deleted text in documentation
                    id: "firstelementid",
                    _modified: "2017-05-21T13:22:31.614-0700",
                    _refId: "master",
                    documentation: "",
                    _commitId: "320940234",
                    _creator: "merp",
                    _created: "2017-05-09T17:12:17.165-0700",
                    name: "First Element",
                    _projectId: "someprojectid" 
                },
                {
                    _modifier: "someperson",
                    id: "secondelementid",
                    _modified: "2017-05-02T13:22:31.614-0700",
                    _refId: "branchtwo",
                    documentation: "<p>This the second element in the array!</p>",
                    _commitId: "93028409850",
                    _creator: "merp",
                    _created: "2017-05-01T17:12:17.165-0700",
                    name: "Second Element",
                    _projectId: "someprojectid" 
                },
                {
                    _modifier: "someperson", //same as above, but different refs
                    id: "secondelementid",
                    _modified: "2017-05-02T13:22:31.614-0700",
                    _refId: "somebranch",
                    documentation: "<p>This the second element in the array!</p>",
                    _commitId: "93028409850",
                    _creator: "merp",
                    _created: "2017-05-01T17:12:17.165-0700",
                    name: "Second Element",
                    _projectId: "someprojectid" 
                },
                {
                    _modifier: "anotherperson",
                    id: "thirdelementid",
                    _modified: "2017-04-01T13:22:31.614-0700",
                    _refId: "branchthree",
                    documentation: "<p>This the third element in the array!</p>",
                    _commitId: "3902839085",
                    _creator: "merp",
                    _created: "2017-03-01T17:12:17.165-0700",
                    name: "Third Element",
                    _projectId: "someprojectid" 
                },
                {
                    _modifier: "anotherperson", //same as above, different commits
                    id: "thirdelementid",
                    _modified: "2017-04-01T13:22:31.614-0700",
                    _refId: "branchthree",
                    documentation: "<p>This the third element in the array!</p>",
                    _commitId: "6895048690",
                    _creator: "merp",
                    _created: "2017-03-01T17:12:17.165-0700",
                    name: "Third Element",
                    _projectId: "someprojectid" 
                },
                {
                    _modifier: "anotherperson",
                    id: "fourthelementid",
                    _modified: "2017-05-21T13:22:31.614-0700",
                    _refId: "branchfour",
                    documentation: "<p>This the fourth element in the array!</p>",
                    _commitId: "93028590959",
                    _creator: "merp",
                    _created: "2017-05-20T17:12:17.165-0700",
                    name: "Fourth Element",
                    _projectId: "anotherprojectid"  
                },
                {
                    _modifier: "anotherperson",
                    id: "fifthelementid",
                    _modified: "2017-04-01T13:22:31.614-0700",
                    _refId: "branchfive",
                    documentation: "<p>This the fifth element in the array!</p>",
                    _commitId: "latest",
                    _creator: "merp",
                    _created: "2017-03-01T17:12:17.165-0700",
                    name: "Fifth Element",
                    _projectId: "yetanotherprojectid"   
                },
                {
                    _modifier: "anotherperson",
                    id: "sixthelementid",
                    _modified: "2017-04-01T13:22:31.614-0700",
                    _refId: "master",
                    documentation: "<p>This the sixth element in the array!</p>",
                    _commitId: "latest",
                    _creator: "merp",
                    _created: "2017-03-01T17:12:17.165-0700",
                    name: "Sixth Element",
                    _projectId: "yetanotherprojectid"   
                },
                {
                    _modifier: "anotherperson",
                    id: "seventhelementid",
                    _modified: "2017-04-01T13:22:31.614-0700",
                    _refId: "master",
                    documentation: "<p>This the seventh element in the array!</p>",
                    _commitId: "latest",
                    _creator: "merp",
                    _created: "2017-03-01T17:12:17.165-0700",
                    name: "Seventh Element",
                    _projectId: "nthprojectid"  
                },
                {
                    _modifier: "anotherperson",
                    id: "eighthelementid",
                    _modified: "2017-04-02T13:22:31.614-0700",
                    _refId: "master",
                    documentation: "<p>This the eighth element in the array!</p>",
                    _commitId: "89798989897",
                    _creator: "merp",
                    _created: "2017-03-01T17:12:17.165-0700",
                    name: "Eighth Element",
                    _projectId: "nthprojectid"  
                },
                {
                    _modifier: "anotherperson",
                    id: "eighthelementid",
                    _modified: "2017-04-03T13:22:31.614-0700",
                    _refId: "master",
                    documentation: "<p>This the eighth element in the array!</p>",
                    _commitId: "latest",
                    _creator: "merp",
                    _created: "2017-03-01T17:12:17.165-0700",
                    name: "Eighth Element",
                    _projectId: "nthprojectid"  
                }
            ]
        };

        var elements = [{
            name    : "responseTestElement",
            id      : "_18_0_5_407019f_1468188892970_158569_14563",
            type    : 'LiteralString',
            value   : '431413',
            operand : [
                {
                "valueExpression": null,
                "type"           : "InstanceValue",
                "instanceId"       : "_18_0_5_407019f_1468188892965_490446_14539"
                }
            ]
        }, {
            type   : 'LiteralInteger',
            value  : 431413,
            operand: [{
                "valueExpression": null,
                "type"           : "InstanceValue",
                "instanceId"       : "_18_0_5_407019f_1468188892965_490446_14539",
            }]
        }];
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsTranscludeVal should transclude a LiteralInteger', function () {
        var testElement = {
            mmsElementId       : 'valueViewId',
            mmsProjectId: 'someprojectid',
            mmsRefId: 'master',
            mmsCommitId: 'latest',
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
    });

    it('mmsTranscludeVal should transclude a LiteralBoolean', function () {
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
    });

    it('mmsTranscludeVal should transclude a LiteralReal', function () {
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
    });

    it('mmsTranscludeVal should transclude a LiteralUnlimitedNatural', function () {
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
    });

    it('mmsTranscludeVal should transclude an ElementValue', function () {
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
    });

    it('mmsTranscludeVal should transclude an InstanceValue', function () {
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
    });

    it('mmsTranscludeVal should transclude an OpaqueExpression', function () {
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
    });
});