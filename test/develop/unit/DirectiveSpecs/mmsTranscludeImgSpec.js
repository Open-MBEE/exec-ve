'use strict';

xdescribe('mmsTranscludeImg Directive', function () {
    var scope,
        element; 
    var $httpBackend;
    var $rootScope, 
        $compile;

    beforeEach(function () {
        module('mms.directives');
        inject(function ($injector) {
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            scope        = $rootScope.$new();
        });

        $httpBackend.when('GET', '/alfresco/service/api/node/content/workspace/SpacesStore/7ba7cd9b-f78f-4357-bc0c-6240d194da85/img_1472590831071.png').respond(200, '');
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsTranscludeImg should transclude a image within the element', function () {

        var testElement = {
            id              : "someelementid",
            _projectId      : "projectId",
            _refId          : "refId",
            _commitId       : "master",
            name            : "Merpity Merp Merp",
            documentation   : "<p><img src=\"/alfresco/service/api/node/content/workspace/SpacesStore/7ba7cd9b-f78f-4357-bc0c-6240d194da85/img_1472590831071.png\"/><\/p>\n"
        };

        element = angular.element('<mms-transclude-img mms-eid="{{testElement.id}}" mms-project-id="{{testElement._projectId}}" mms-ref-id="{{testElement._refId}}" mms-commit-id="{{testElement._commitId}}"></mms-transclude-img>');
        $compile(element)(scope);
        scope.$apply();
        var imageString = '<img class="mms-svg"><img class="mms-png">';
        expect(element.html()).toContain(imageString);
    });

});
