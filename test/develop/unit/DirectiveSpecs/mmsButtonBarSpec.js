/**
 * Created by dank on 8/29/16.
 */

'use strict';

// TODO: Check with Doris to see if this directive is actually being tested
xdescribe('mmsButtonBarSpec directive', function () {
    var $rootScope, $compile, $scope;

    beforeEach(function () {
        // Load the module
        module('mms.directives');

        // Inject the scopes required
        inject(function (_$rootScope_, _$compile_, $injector, UtilsService, CacheService) {
            jasmine.getFixtures().fixturesPath = 'base/src/directives/templates';
            // jasmine.getJSONFixtures().fixturesPath = 'base/test/mock-data/UtilsService';
            //CacheService = $injector.get('CacheService');
            $rootScope = _$rootScope_;
            $scope     = _$rootScope_.$new();
            $compile   = _$compile_;
        })
    });

    it('should test the mmsButtonBarCtrl', inject(function () {
        var $scope               = $rootScope.mms_bbApi;
        var mmsButtonBarTemplate = jasmine.getFixtures().read('mmsButtonBar.html');
        var buttonBar            = $compile(mmsButtonBarTemplate)($rootScope);
        $rootScope.$digest();

        // console.log("MMS BUTTON BAR TEMPLATE " + JSON.stringify(buttonBar));
        // console.log("Contents " + JSON.stringify(contents));
    }));
});
