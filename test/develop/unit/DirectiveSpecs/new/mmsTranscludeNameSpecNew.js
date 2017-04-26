'use strict';

describe('mmsTranscludeName Directive', function () {
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

            scope.element = {
                id       : 'viewId',
                name          : 'blah',
                type: 'Class'
            };

            var cacheKey = UtilsService.makeElementKey(scope.element);
            CacheService.put(cacheKey, scope.element);
        })
    });

    // TODO: Why is testing 'nominal()' I don't see a nominal method inside of mmsTranscludeName
    it('mmsTranscludeName', inject(function () {
        element = angular.element('<mms-transclude-name data-mms-eid="{{element.id}}"></mms-transclude-name>');
        $compile(element)(scope);
        scope.$digest();
        expect(element.html()).toContain('blah');
    }));
});