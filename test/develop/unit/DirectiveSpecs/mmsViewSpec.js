'use strict';

describe('mmsTranscludeVal directive', function () {
    var scope; //scope when directive is called
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
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            CacheService = $injector.get('CacheService');
            UtilsService = $injector.get('UtilsService');
            ViewService  = $injector.get('ViewService');
            URLService   = $injector.get('URLService');
            httpService  = $injector.get('HttpService');
            $http        = $injector.get('$http');
            scope        = $rootScope.$new();

            var testElement = {
                    elements: [{
                        sysmlid       : "304",
                        sectionNumber : "3241",
                        version       : "666",
                        workspace     : "master",
                        specialization: {
                            type             : "View",
                            displayedElements: ["301", "302", "303"],
                            allowedElements  : ["301", "302", "303"],
                            childrenViews    : ["304"],
                            contains         : [{
                                type          : "Paragraph",
                                sourceType    : "reference",
                                source        : "301",
                                sourceProperty: "documentation"
                            }]
                        }
                    }]
                };
            $httpBackend.when('GET', /\/alfresco\/(.+)?/)
                .respond(testElement, {'A-Token': 'xxx'});

            var cacheKey = UtilsService.makeElementKey(testElement.elements[0].sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, testElement);
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    // TODO: NEEDS TO BE FINISHED
    it('mmsView should transclude a basic view', inject(function () {
        scope.view = {
            sysmlid      : "304",
            sectionNumber: "3241",
            workspace    : "master"
        };

        // console.log(scope.view);

        element = angular.element('<mms-view mms-vid="{{view.sysmlid}}" mms-version="{{view.version}}" mms-ws="{{view.ws}}" ></mms-view>');

        $compile(element)(scope);

        scope.$apply();
        console.log(element.html());
        $httpBackend.flush();
    }));
});