/**
 * Created by dank on 9/7/16.
 */
'use strict';

describe('mmsHistory', function () {
    var scope; //scope when directive is called
    var element; //dom element mms-transclude-name
    var $rootScope,
        $compile,
        CacheService,
        UtilsService,
        $httpBackend,
        someElement;

    beforeEach(function () {
        module('mms.directives');
        module('mms');
        inject(function ($injector) {
            $rootScope = $injector.get('$rootScope');
            $compile = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            UtilsService = $injector.get('UtilsService');
            CacheService = $injector.get('CacheService');
            scope = $rootScope.$new();

            // $httpBackend.when('GET', /alfresco\/service\/workspaces/).respond(200, {elements: [{sysmlid: "MerpId"}]});

            someElement = getJSONFixture('mmsHistory/historyElement.json');
            var workspaceObject = {
                    qualifiedId: "master",
                    id: "master",
                    workspaceOperationsPermission: true,
                    qualifiedName: "master",
                    name: "master"
            };


            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/elements\/someElement/).respond(200,
                {elements:[someElement]}
            );

            $httpBackend.when('GET', /alfresco\/service\/workspaces/).respond(200,
                {
                    workspaces: [
                        workspaceObject,
                        {
                            qualifiedId: "master/6f86c76e-3919-4285-84c1-9c5786809590",
                            id: "6f86c76e-3919-4285-84c1-9c5786809590",
                            created: "2015-04-28T16:36:22.991-0700",
                            description: "",
                            qualifiedName: "master/Recover",
                            name: "Recover",
                            parent: "master",
                            permission: "read",
                            branched: "2015-04-23T12:20:10.381-0700",
                            modified: "2015-04-28T16:36:22.991-0700",
                            creator: "someCrazyDude"
                        },
                        {
                            qualifiedId: "master/f6753422-efbc-4a98-a766-81bb90c532d7",
                            id: "f6753422-efbc-4a98-a766-81bb90c532d7",
                            created: "2015-04-28T17:06:09.237-0700",
                            description: "",
                            qualifiedName: "master/Recover2",
                            name: "Recover2",
                            parent: "master",
                            permission: "read",
                            branched: "2015-04-23T11:20:41.445-0700",
                            modified: "2015-04-28T17:06:09.237-0700",
                            creator: "theDude"
                        }]
                }
            );

            $httpBackend.when('GET', /alfresco\/service\/workspaces\/master\/history\/someElement/).respond(200,
                {
                    "versions": [
                        {
                            "modifier": "merp",
                            "timestamp": "2015-12-14T15:28:09.000-0800",
                            "label": "1.12"
                        },
                        {
                            "modifier": "flerp",
                            "timestamp": "2015-09-09T09:22:47.000-0700",
                            "label": "1.11"
                        },
                        {
                            "modifier": "derp",
                            "timestamp": "2015-09-03T11:16:07.000-0700",
                            "label": "1.10"
                        },
                        {
                            "modifier": "frankenfurter",
                            "timestamp": "2015-07-22T09:56:40.000-0700",
                            "label": "1.9"
                        }]
                }
            );

            var cacheKey = UtilsService.makeElementKey(someElement.elements[0].sysmlId, 'master', 'latest', false);
            CacheService.put(cacheKey, someElement.elements[0]);
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


    it('should get the history for a specific element', function () {
        scope.view = {
            sysmlid: "someElement",
            ws: "master",
            version: "latest"
        };

        element = angular.element('<mms-history mms-eid="{{view.sysmlid}}" mms-ws="{{view.ws}}" mms-version="{{view.version}}"></mms-history>');
        $compile(element)(scope);

        scope.$apply();
        $httpBackend.flush();
        console.log(element.html());
    });
});
