'use strict';

describe('mmsTranscludeDoc Directive', function() {
    var scope; //scope when directive is called
    var element; //dom element mms-transclude-name

    beforeEach(module('mms.directives'));
    beforeEach(inject(function($rootScope, $compile, $injector, UtilsService, CacheService) {
        scope = $rootScope.$new();
        var testElement = {
            id: 'viewId',
            name: 'blah',
            documentation: 'documentation and <mms-transclude-name mms-eid="viewId"></mms-transclude-name>',
            type: 'Class'
        };
        var cacheKey = UtilsService.makeElementKey(testElement);
        CacheService.put(cacheKey, testElement);
        scope.view = testElement;
        element = angular.element('<mms-transclude-doc data-mms-eid="{{view.id}}"></mms-transclude-doc>');
        $compile(element)(scope);
        scope.$digest();
    }));

    it('mmsTranscludeDoc.nominal()', inject(function() {
        expect(element.html()).toContain('documentation');
        expect(element.html()).toContain('blah'); //test recursive compilation
    }));
});