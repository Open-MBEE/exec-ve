'use strict';

describe('Service: ApplicationService', function () {
    beforeEach(module('mms'));

    var ApplicationServiceObj;
    var mockURLService, mockQ, mockHttp;
    var $httpBackend, $rootScope;
    var root = '/alfresco/service';

    // beforeEach(function () {
    //     module(function ($provide) {
    //         $provide.service('URLService', function () {
    //             this.getMmsVersionURL = jasmine.createSpy('getMmsVersionURL');
    //         });
    //         $provide.service('$q', function () {
    //             this.defer = jasmine.createSpy('defer');
    //         });
    //     });
    // });

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
            mockURLService        = $injector.get('URLService');
            mockQ                 = $injector.get('$q');
            $httpBackend          = $injector.get('$httpBackend');
            $rootScope            = $injector.get('$rootScope');
            var mmsV = { mmsVersion: "3.0.0-rc4" };

            $httpBackend.when('GET',root + '/mmsversion').respond(
            function(method, url, data) {
                return [200, mmsV];
            });
        }));
        afterEach(function () {
            $httpBackend.verifyNoOutstandingRequest();
        });

       
        it('should retrieve the mmsVersion from the application', inject(function () {
            var mmsVersion;
            var mmsVersionData = "3.0.0-rc4";
            ApplicationServiceObj.getMmsVersion().then(function (data) {
                mmsVersion = data;
                // console.log('inside success',data);
            }, function (reason) {
                mmsVersion = "Could not retrieve due to failure: " + reason.message;
                // console.log('inside success',mmsVersion);
            });
            $httpBackend.flush(); 
            expect(mmsVersion).toEqual(mmsVersionData);
        }));
    });
});