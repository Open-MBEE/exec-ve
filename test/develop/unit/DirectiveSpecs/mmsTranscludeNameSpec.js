'use strict';

describe('mmsTranscludeName directive', function() {
    var scope, element, CacheService;

    beforeEach(module('mms.directives'));
    beforeEach(module('mms.directives.tpls'));


    beforeEach(inject(function($rootScope, $compile, $injector) {
        CacheService = $injector.get('CacheService');
        scope = $rootScope.$new();
        CacheService.put(['elements', 'master', 'viewId', 'latest'], {specialization: {type: 'Element'}, sysmlid: 'viewId', name: 'blah'});
        scope.view = { sysmlid: 'viewId', name: 'blah' };
        element = angular.element('<mms-transclude-name data-mms-eid="{{view.sysmlid}}"></mms-transclude-name>');
        element = $compile(element)(scope);
        scope.$digest();
    }));

    fit('mmsTranscludeName.nominal()', inject(function( ) {
        expect(scope.view).toEqual({sysmlid: 'viewId', name: 'blah'});
        expect(element.html()).toContain('blah');
    }));

});