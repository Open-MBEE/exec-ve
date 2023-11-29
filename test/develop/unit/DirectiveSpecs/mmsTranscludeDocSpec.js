'use strict';

xdescribe('Directive: mmsTranscludeDoc', function() {
    var scope,
        element; 
    var $httpBackend;
    var $rootScope,
        $compile;

    beforeEach(module('mms'));
    beforeEach(module('mms.directives'));
    beforeEach(function() {
        inject(function($injector) {
            $httpBackend = $injector.get('$httpBackend');
            $rootScope = $injector.get('$rootScope');
            $compile = $injector.get('$compile');
            scope = $rootScope.$new();

            var mock = {
                id: 'thisisanid',
                projectId: 'aprojectid',
                commitId: 'latest',
                refId: 'master'
            };

            $httpBackend.when('GET', '/alfresco/service/projects/' + mock.projectId + '/refs/' + mock.refId + '/elements/' + mock.id).respond(200, mock);
            
            var testElement = {
                id: 'fifthelementid',
                name: 'blah',
                _projectId: 'aprojectid',
                _commitId: 'latest',
                _refId: 'master',
                documentation: 'documentation',// and <mms-transclude-name mms-eid="{{mock.id}}" mms-project-id="{{mock.projectId}}" mms-ref-id="{{mock.refId}}" mms-commit-id="{{mock.commitId}}" mms-watch-id="true" no-click="true" non-editable="true"></mms-transclude-name>',
                type: 'Class'
            };
            $httpBackend.when('GET', '/alfresco/service/projects/' + testElement._projectId + '/refs/' + testElement._refId + '/elements/' + testElement.id).respond(200, testElement);
        });
    });

    it('should, given an element id, put in the element\'s documentation binding', function() {
        scope.view = {
            mmsEid: "fifthelementid",
            mmsRefId: "master",
            mmsCommitId: "latest",
            mmsProjectId: "aprojectid"
        };
        element = angular.element('<mms-transclude-doc data-mms-eid="{{view.mmsEid}}" mms-project-id="{{view.mmsProjectId}}" mms-ref-id="{{view.mmsRefId}}"></mms-transclude-doc>');

        $compile(element)(scope);
        scope.$digest();
        console.log("doc " + element.html());
    });
});