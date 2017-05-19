'use strict';

describe('Directive: mmsHistory', function () {
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

            someElement = getJSONFixture('mmsHistory/historyElement.json');
            var refObject = {
                _commitId: "acommitid",
                _created: "2017-05-10T15:59:33.857-0700",
                _creator: "merp",
                _elasticId: "9203rusfjdjflsk",
                _modified: "2017-05-10T15:59:33.857-0700",
                _modifier: "merp",
                description: "",
                id: "anotherref",
                name: "master2",
                parentRefId: "master",
                permission: "write",
                type: "Branch"
            };


            $httpBackend.when('GET', /alfresco\/service\/projects\/someproject\/refs\/master\/elements\/someElement/).respond(200,
                {elements:[someElement]}
            );

            $httpBackend.when('GET', /alfresco\/service\/projects/).respond(200,
                {
                    projects: [
                        {
                            twcId: "ksdlfskj1232839204",
                            _modifier: "merp",
                            type: "Project",
                            uri: "twcloud:/82934782479wieisuro",
                            orgId: "someorg",
                            _created: "2017-04-26T13:37:34.179-0700",
                            qualifiedId: "master/6f86c76e-3919-4285-84c1-9c5786809590",
                            id: "someproject",
                            created: "2015-04-28T16:36:22.991-0700",
                            _elasticId: "293u4sjfdkjsfldfdlf",
                            _modified: "2017-04-26T13:37:34.179-0700",
                            _refId: "master",
                            _projectId: "someproject",
                            name: "Recover",
                            _modified: "2015-04-28T16:36:22.991-0700",
                            _creator: "someCrazyDude",
                            categoryId: "920384ijijroewiroie"
                        },
                        {
                            twcId: "kdlsfkls2934829847",
                            _modifier: "merp",
                            type: "Project",
                            uri: "twcloud:/82394ieoriwflkdsf",
                            orgId: "someorg",
                            _created: "2017-04-26T13:37:34.179-0700",
                            qualifiedId: "master/kslf8239489sfjdkfos",
                            id: "anotherproject",
                            created: "2015-04-28T16:36:22.991-0700",
                            _elasticId: "839jkdfsljfkdls",
                            _modified: "2017-04-26T13:37:34.179-0700",
                            _refId: "anotherref",
                            _projectId: "anotherproject",
                            name: "Recover2",
                            _modified: "2015-04-28T16:36:22.991-0700",
                            _creator: "AnotherCrazyDude",
                            categoryId: "299ufsjlkdlfsf"
                        }]
                }
            );

            $httpBackend.when('GET', /alfresco\/service\/projects\/someproject\/refs\/master\/history\/someElement/).respond(200,
                {
                    "commits": [
                        {
                            "_creator": "merp",
                            "_created": "2015-12-14T15:28:09.000-0800",
                            "id": "19203943028493840"
                        },
                        {
                            "_creator": "flerp",
                            "_created": "2015-09-09T09:22:47.000-0700",
                            "id": "29348075382939204"
                        },
                        {
                            "_creator": "derp",
                            "_created": "2015-09-03T11:16:07.000-0700",
                            "id": "23840293048230493"
                        },
                        {
                            "_creator": "frankenfurter",
                            "_created": "2015-07-22T09:56:40.000-0700",
                            "id": "839248932478234792"
                        }]
                }
            );

            var cacheKey = UtilsService.makeElementKey(someElement.elements[0].id, 'master', 'latest', false);
            CacheService.put(cacheKey, someElement.elements[0]);
        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


    it('should get the history for a specific element', function () {
        scope.view = {
            mmsElementId: "someElement",
            mmsRefId: "master",
            mmsProjectId: "someproject"
        };

        element = angular.element('<mms-history mms-element-id="{{view.mmsElementId}}" mms-project-id="{{view.mmsProjectId}}" mms-ref-id="{{view.mmsRefId}}"></mms-history>');
        $compile(element)(scope);

        scope.$apply();
        $httpBackend.flush();
        console.log(element.html());
    });
});
