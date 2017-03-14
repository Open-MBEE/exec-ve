describe('mmsTranscludeCom directive', function () {
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

            scope.version    = "latest";
            scope.editValues = [43, 42, 55, 2532];
            scope.view       = {
                sysmlId: '_hidden_MMS_1472586299682_1122c2aa-9cab-41a9-b0b4-4a1fd9a9882f_pei',
                name   : 'merpity'
            };
            scope.panelType  = "Comment";
        });
    });

    it('mmsTranscludeCom should translude a comment within the element', inject(function () {
        var testElement = {
            sysmlId      : "_hidden_MMS_1472586299682_1122c2aa-9cab-41a9-b0b4-4a1fd9a9882f_pei",
            _editable     : true,
            _creator      : "mmsadmin",
            name         : "merp",
            documentation: "<p>Putting some text in here!!!<\/p>\n"
        };

        var cacheKey = UtilsService.makeElementKey(testElement.sysmlId, 'master', 'latest', false);
        CacheService.put(cacheKey, testElement);

        element = angular.element('<mms-transclude-com data-mms-eid="{{view.sysmlId}}"></mms-transclude-com>');
        $compile(element)(scope);
        scope.$digest();

        expect(element.html()).toContain("Putting some text in here!!!");
        expect(element.html()).toContain("- mmsadmin");
    }));
});