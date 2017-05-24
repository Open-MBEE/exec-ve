'use strict';

describe('Directive: mmsTranscludeCom', function () {
    var scope,
        element; 
    var $httpBackend;
    var $rootScope, 
        $compile;
    var mockCacheService, 
        mockUtilsService;

    beforeEach(module('mms'));
    beforeEach(module('mms.directives'));
    beforeEach(function () {
        inject(function ($injector) {
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            mockCacheService = $injector.get('CacheService');
            mockUtilsService = $injector.get('UtilsService');
            scope        = $rootScope.$new();
        });

        var testElement       = {
            id              : "fifthelementid",
            _editable       : true,
            _creator        : "theonetrueadmin",
            name            : "merp",
            documentation   : "<p>The rain in Spain falls mainly on the plain.<\/p>\n",
            _projectId      : "yetanotherprojectid",
            _refId          : "branchfive",
            _commitId       : "latest"
        };
        testElement.panelType  = "Comment";

        $httpBackend.when('GET', '/alfresco/service/projects/' + testElement._projectId + '/refs/' + testElement._refId + '/elements/' + testElement.id).respond(200, testElement);
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsTranscludeCom should translude a comment within the element', function () {
        scope.element = {
            mmsEid: "fifthelementid",
            mmsRefId: "branchfive",
            mmsCommitId: "latest",
            mmsProjectId: "yetanotherprojectid",
            editable: true     
        };
        element = angular.element('<mms-transclude-com mms-element-id="fifthelementid" mms-project-id="yetanotherprojectid" mms-ref-id="branchfive" mms-commit-id="latest"></mms-transclude-com>');
        console.log("elem: " + element.text());
        $compile(element)(scope);
        scope.$apply();
        expect(element.html()).toContain("The rain in Spain falls mainly on the plain.");

        console.log("text: " + element.html());
        expect(element.html()).toContain("- theonetrueadmin");
        $httpBackend.flush();
    });
});

//DONE