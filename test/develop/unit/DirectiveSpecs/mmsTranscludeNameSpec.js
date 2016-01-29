'use strict';

describe('mmsTranscludeName directive', function() {
    var scope; //scope when directive is called
    var element; //dom element mms-transclude-name

    beforeEach(module('mms.directives'));

    beforeEach(inject(function($rootScope, $compile, $injector, UtilsService, CacheService) {
        //CacheService = $injector.get('CacheService');
        scope = $rootScope.$new();
        var testElement = {
            sysmlid: 'viewId',
            name: 'blah',
            specialization: {
                type: 'Element'
            }
        };
        var cacheKey = UtilsService.makeElementKey(testElement.sysmlid, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);
        scope.view = { sysmlid: 'viewId', name: 'blah' };
        element = angular.element('<mms-transclude-name data-mms-eid="{{view.sysmlid}}"></mms-transclude-name>');
        $compile(element)(scope);
        scope.$digest();
    }));

    it('mmsTranscludeName.nominal()', inject(function() {
        expect(element.html()).toContain('blah');
    }));

});