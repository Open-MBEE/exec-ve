'use strict';

xdescribe('mmsTranscludeCom directive', function () {
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

            scope.element       = {
                id      : "_hidden_MMS_1472586299682_1122c2aa-9cab-41a9-b0b4-4a1fd9a9882f_pei",
                _editable     : true,
                _creator      : "mmsadmin",
                name         : "merp",
                documentation: "<p>Putting some text in here!!!<\/p>\n",
                _projectId : "projectId",
                _refId: "master"
            };
            scope.panelType  = "Comment";
        });
    });

    it('mmsTranscludeCom should translude a comment within the element', inject(function () {
        var cacheKey = UtilsService.makeElementKey(scope.element);
        CacheService.put(cacheKey, scope.element);

        element = angular.element('<mms-transclude-com data-mms-eid="{{element.id}}" mms-project-id="{{element._projectId}}"></mms-transclude-com>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain("Putting some text in here!!!");
        expect(element.html()).toContain("- mmsadmin");
    }));
});

//DONE