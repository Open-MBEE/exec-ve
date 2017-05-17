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
        mockURLService        = $injector.get('URLService');
        mockQ                 = $injector.get('$q');
        $httpBackend          = $injector.get('$httpBackend');
        $rootScope            = $injector.get('$rootScope');

        var mmsV = {mmsVersion: "3.0.0-rc4"};
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Method: createUniqueId', function () {
        it('should create a unique id by retrieving the source object from ApplicationService', function () {
            var source = ApplicationServiceObj.getSource();
            expect(source).toBeDefined();
            expect(source[14]).toMatch("4");
            // expect(source[19]).toMatch("?"); //what's this?
            expect(source[8]).toMatch("-");
            expect(source[13]).toMatch("-");
            expect(source[18]).toMatch("-");
            expect(source[23]).toMatch("-");
        });
    });

    describe('Method: getMmsVersion', function () {
        var mmsVersion;
        var mmsVersionData = "3.0.0-rc4"; 
        $httpBackend.when('GET', root + '/mmsversion').respond(
            function(method, url, data) {
                return [200, mmsV];
            });
        it('should retrieve the mmsVersion from the application', inject(function () {
            ApplicationServiceObj.getMmsVersion().then(function (data) {
                mmsVersion = data.mmsVersion;
            }, function (reason) {
                mmsVersion = "Could not retrieve due to failure: " + reason.message;
            });
            $httpBackend.flush();
            expect(mmsVersion).toEqual(mmsVersionData);
        }));
    });
});