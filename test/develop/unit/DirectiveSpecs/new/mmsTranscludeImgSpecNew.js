'use strict';

describe('mmsTranscludeImg Directive', function () {
    var scope; //scope when directive is called
    var element; //dom element mms-transclude-name
    var $rootScope, $compile, CacheService, UtilsService, $httpBackend, requestHandler, VizService;

    beforeEach(function () {
        module('mms.directives');
        inject(function ($injector) {
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            CacheService = $injector.get('CacheService');
            UtilsService = $injector.get('UtilsService');
            VizService   = $injector.get('VizService');
            scope        = $rootScope.$new();
            scope.element = {
                id      : "MMS_1472590814846_dcdac26c-e4c5-4b7d-8d3a-77387ecf2214",
                _projectId  : "projectId",
                _refId   : "refId",
                _commitId    : "master",
                name         : "Merpity Merp Merp",
                ownerId        : "HH_14_DD_30_MM_7_YY_2016_dank-testing_no_project",
                documentation: "<p><img src=\"/alfresco/service/api/node/content/workspace/SpacesStore/7ba7cd9b-f78f-4357-bc0c-6240d194da85/img_1472590831071.png\"/><\/p>\n"
            };

            var cacheKey = UtilsService.makeElementKey(scope.element);
            CacheService.put(cacheKey, scope.element);

            element = angular.element('<mms-transclude-img mms-eid="{{element.id}}" mms-project-id="{{element._projectId}}" mms-ref-id="{{element._refId}}" mms-commit-id="{{element._commitId}}"></mms-transclude-img>');
            $compile(element)(scope);
            scope.$digest();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsTranscludeImg should transclude a image within the element', inject(function () {
        var imageString = '<img class="mms-svg"><img class="mms-png">';
        expect(element.html()).toContain(imageString);
    }));

});
