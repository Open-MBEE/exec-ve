'use strict';

xdescribe('mmsTranscludeName Directive', function () {
    var scope,
        element; 
    var $httpBackend;
    var $rootScope, 
        $compile;

    beforeEach(module('mms.directives'));
    beforeEach(function () {
        inject(function ($injector) {
            $rootScope   = $injector.get('$rootScope');
            $compile     = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            scope        = $rootScope.$new();

            var mock = {
                id          : 'viewId',
                _projectId  : 'someprojectid',
                _refId      : 'master',
                _commitId   : 'latest',
                name        : 'blah',
                type        : 'Class'
            };
        });
        
        $httpBackend.when('GET', '/alfresco/service/projects/' + mock._projectId + '/refs/' + mock._refId + '/elements/' + mock.id).respond(200, mock);     
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should put in the element\'s name binding', function () {
        var testElement = {
            mmsEid        : 'viewId',
            mmsProjectId  : 'someprojectid',
            mmsRefId      : 'master',
            mmsCommitId   : 'latest',
            mmsWatchId    : true,
            noClick       : true,
            nonEditable   : true
        };
        element = angular.element('<mms-transclude-name mms-eid="{{testElement.mmsEid}}" mms-project-id="{{testElement.mmsProjectId}}" mms-ref-id="{{testElement.mmsRefId}}" mms-commit-id="{{testElement.mmsCommitId}}" mms-watch-id="{{testElement.mmsWatchId}}" no-click="{{testElement.noClick}}"></mms-transclude-name>');
        $compile(element)(scope);
        scope.$apply();
        console.log(element.html());
        expect(element.html()).toContain('blah');
        $httpBackend.flush();

    });
});