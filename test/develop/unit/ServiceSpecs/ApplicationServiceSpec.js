/**
 * Created by dank on 8/25/16.
 */



describe('ApplicationService', function () {
    beforeEach(module('mms'));

    var ApplicationService;
    var root = '/alfresco/service';

    beforeEach(inject(function ($injector) {
        ApplicationService = $injector.get('ApplicationService');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
        $httpBackend.whenGET(root + '/mmsversion').respond(
            {mmsVersion: "2.3.8"}
        );
    }));

    describe('Method CreateUniqueId', function () {
        it('should create a unique id by retrieving the source object from ApplicationService', function () {
            var source = ApplicationService.getSource();
            // console.log("Source " + source);
            expect(source).toBeDefined();
            expect(source[14]).toMatch("4");
            expect(source[13]).toMatch("-");
            expect(source[18]).toMatch("-");
            expect(source[23]).toMatch("-");
        });
    });

    describe('Method getMmsVersion', function () {
        "use strict";
        var mmsV;
        it('should retrieve the mmsVersion from the application', inject(function () {
            ApplicationService.getMmsVersion().then(function(data) {
                mmsV = data;
            }, function(reason) {
                mmsV = "Could not retrieve due to failure: " + reason.message;
            });
            // console.log("MMS Version " + mmsV);
            // var instance = $uibModal.open({
            //     templateUrl: 'partials/mms/about.html',
            //     scope: scope,
            //     controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
            //         $scope.cancel = function() {
            //             $uibModalInstance.dismiss();
            //         };
            //     }]
            // });
        }));
    });
});