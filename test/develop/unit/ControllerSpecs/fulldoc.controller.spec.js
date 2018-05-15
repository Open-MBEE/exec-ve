describe('Controller: fullDocController', function() {
    var $rootScope;
    var $httpBackend;
    var fullDocController;
    var scope;
    beforeEach(module('mmsApp', function($provide) {
        $provide.provider('search', function() {
            this.$get = function () { return {};}
        });
        $provide.provider('orgOb', function() {
            this.$get = function () { return {};}
        });
        $provide.provider('projectOb', function() {
            this.$get = function () { return {};}
        });
        $provide.provider('refOb', function() {
            this.$get = function () { return {};}
        });
        $provide.provider('groupOb', function() {
            this.$get = function () { return {};}
        });
        $provide.provider('documentOb', function() {
            this.$get = function () { return {};}
        });
    }));

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        var $controller = $injector.get('$controller');
        $rootScope = $injector.get('$rootScope');
        scope = $rootScope.$new();
        fullDocController = $controller('FullDocCtrl', {
            $scope: scope
        });

        $httpBackend.whenGET(function(url) {
            return url.indexOf('/alfresco/service/mms/login/ticket/') !== -1;
        } ).respond(200, {username: 'fakeUser'});
        $httpBackend.whenGET(function(url) {
            return url.indexOf('/alfresco/service/orgs?alf_ticket') !== -1;
        } ).respond(200, {orgs: ['org1']});
    }));

    describe('when Lazy loading Views', function() {
        it('should setup scrollApi on the scope to communicate with borderLayout library', function() {
            expect(scope.scrollApi).toBeDefined();
            expect(scope.scrollApi.notifyOnScroll).toBeDefined();
            expect(scope.scrollApi.isScrollVisible).toBeDefined();
        });

        it('should setup the following events', function() {
            expect(scope.$$listeners['mms-tree-click']).toBeDefined();
            expect(scope.$$listeners['mms-new-view-added']).toBeDefined();
        });
    });
});
