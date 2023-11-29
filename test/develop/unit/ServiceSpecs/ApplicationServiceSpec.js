'use strict';

describe('Service: ApplicationService', function () {
    beforeEach(module('mms'));

    var ApplicationServiceObj;
    var $httpBackend, $rootScope;
    var root = '/alfresco/service';

    beforeEach(inject(function ($injector) {
        ApplicationServiceObj = $injector.get('ApplicationService');
    }));

    describe('Method: createUniqueId', function () {
        it('should create a unique id by retrieving the source object from ApplicationService', function () {
            var source = ApplicationServiceObj.getSource();
            expect(source).toBeDefined();
            expect(source[14]).toMatch("4");
        });
    });

    describe('Method: getMmsVersion', function () {
        beforeEach(inject(function ($injector) {
            ApplicationServiceObj = $injector.get('ApplicationService');
            $httpBackend          = $injector.get('$httpBackend');
            var mmsV = { mmsVersion: "3.0.0-rc4" };

            $httpBackend.whenGET(root + '/mmsversion').respond(
            function(method, url, data) {
                return [200, mmsV];
            });
        }));

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
     	    $httpBackend.verifyNoOutstandingRequest();
        });

        it('should retrieve the mmsVersion from the application', inject(function () {
            var mmsVersion;
            var mmsVersionData = "3.0.0-rc4";
            ApplicationServiceObj.getMmsVersion().then(function (data) {
                mmsVersion = data;
                // console.log('inside success',data);
            }, function (reason) {
                //TODOTEST Should have a test with failure response
                mmsVersion = "Could not retrieve due to failure: " + reason.message;
                // console.log('inside success',mmsVersion);
            });
            $httpBackend.flush(); 
            expect(mmsVersion).toEqual(mmsVersionData);
        }));
    });
});