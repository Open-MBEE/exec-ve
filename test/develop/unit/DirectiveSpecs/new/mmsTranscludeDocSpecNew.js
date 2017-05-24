'use strict';

describe('mmsTranscludeDoc Directive', function() {
    var scope,
        element; 
    var $httpBackend;
    var $rootScope,
        $compile;
    // var mockUtilsService,
    //     mockCacheService;

    beforeEach(module('mms'));
    beforeEach(module('mms.directives'));
    beforeEach(function() {
        inject(function($injector) {
            $httpBackend = $injector.get('$httpBackend');
            $rootScope = $injector.get('$rootScope');
            $compile = $injector.get('$compile');
            // mockCacheService = $injector.get('CacheService');
            // mockUtilsService = $injector.get('UtilsService');
            scope = $rootScope.$new();

            var testElement = {
                id: 'viewId',
                name: 'blah',
                documentation: 'documentation and <mms-transclude-name mms-eid="viewId"></mms-transclude-name>',
                type: 'Class'
            };
            // var cacheKey = mockUtilsService.makeElementKey(testElement);
            // mockCacheService.put(cacheKey, testElement);
        });
    });

    it('should, given an element id, put in the element\'s documentation binding', function() {
        scope.view = {
            mmsEid: "fifthelementid",
            mmsRefId: "branchfive",
            mmsCommitId: "latest",
            mmsProjectId: "yetanotherprojectid"       
        };
        element = angular.element('<mms-transclude-doc data-mms-eid="{{view.mmsEid}}" mms-project-id="{{view.mmsProjectId}}" mms-ref-id="{{view.mmsRefId}} mms-commit-id="{{view.mmsCommitId}}"></mms-transclude-doc>');
        $compile(element)(scope);
        scope.$apply();
    });

    // it('mmsTranscludeDoc.nominal()', inject(function() {
    //     expect(element.html()).toContain('documentation');
    //     expect(element.html()).toContain('blah'); //test recursive compilation
    // }));
});