/**
 * Created by dank on 8/30/16.
 */




describe('mmsTranscludeCImg directive', function () {
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

            scope.version = "latest";
            var testElement = {
                sysmlId      : "MMS_1472590814846_dcdac26c-e4c5-4b7d-8d3a-77387ecf2214",
                name         : "Merpity Merp Merp",
                ownerId        : "HH_14_DD_30_MM_7_YY_2016_dank-testing_no_project",
                documentation: "<p><img src=\"/alfresco/service/api/node/content/workspace/SpacesStore/7ba7cd9b-f78f-4357-bc0c-6240d194da85/img_1472590831071.png\"/><\/p>\n"
            };

            // $httpBackend.when('GET', '/\/alfresco\/service\/workspaces\/master\/*/').respond(function () {
            //     "use strict";
            //     return {artifacts: [{url: "merpity"}]};
            // });

            var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
            CacheService.put(cacheKey, testElement);

            element = angular.element('<mms-transclude-img mms-eid="{{testElement.sysmlId}}"></mms-transclude-img>');
            $compile(element)(scope);
            scope.$digest();
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsTranscludeImg should translude a image within the element', inject(function () {

        //TODO: FIX THIS TEST
        // var merpString  = '<img class="mms-svg" ng-src="{{svgImgUrl}}"></img><img class="mms-png" ng-src="{{pngImgUrl}}"></img>';
        var imageString = '<img class="mms-svg"><img class="mms-png">';

        expect(element.html()).toContain(imageString);
        // expect(element.html()).toContain(merpString);
    }));

});
