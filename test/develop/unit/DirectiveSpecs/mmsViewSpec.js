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

            scope.view = {
                sysmlid       : "301",
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

            };


            var cacheKey   = UtilsService.makeElementKey(scope.view.sysmlid, 'master', 'latest', false);
            CacheService.put(cacheKey, scope.view);


            element = angular.element('<mms-view data-mms-eid="{{view.sysmlid}}"></mms-view>');
            $compile(element)(scope);
            scope.$digest();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    // TODO: NEEDS TO BE FINISHED
    it('mmsView should transclude a basic view', inject(function () {
        // console.log(element);
        // console.log(element.find('mms-transclude-name').first());
        console.log(element.html());
    }));
});