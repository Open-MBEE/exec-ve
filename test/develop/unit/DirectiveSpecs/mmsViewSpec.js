'use strict';

describe('Directive: mmsView', function () {
    var scope,
        element;
    var $httpBackend;
    var $rootScope,
        $compile;
    // need to put these into different beforeEach block. If not jasmine will intermittently fail...
    beforeEach(module('mms.directives'));
    beforeEach(module('mms'));
    beforeEach(function() {
        inject(function ($injector) {
            $rootScope = $injector.get('$rootScope');
            $compile = $injector.get('$compile');
            $httpBackend = $injector.get('$httpBackend');
            scope = $rootScope.$new();

            var element = {
                _allowedElements: [],
                _modifier: "merp",
                powertypeExtentIds: [],
                representationId: null,
                mdExtensionsIds: [],
                _qualifiedId: "/opencae/someprojectid/someprojectid_pm/holding_bin_someprojectid/someelementid",
                templateBindingIds: [],
                appliedStereotypeInstanceId: "someappliedid",
                templateParameterId: null,
                ownerId: "someownerid",
                isActive: false,
                type: "Class",
                isLeaf: false,
                clientDependencyIds: [],
                useCaseIds: [],
                syncElementId: null,
                classifierBehaviorId: null,
                interfaceRealizationIds: [],
                id: "someelementid",
                _elasticId: "someelasticid",
                _refId: "master",
                supplierDependencyIds: [],
                _modified: "2017-05-18T14:02:18.497-0700",
                _appliedStereotypeIds: [
                    "somestereotypeid"
                ],
                nameExpression: null,
                ownedAttributeIds: [
                    "someownedid"
                ],
                packageImportIds: [],
                visibility: null,
                substitutionIds: [],
                documentation: "",
                _qualifiedName: "//OpenCAE/Data/holding_bin/VE TEST",
                redefinedClassifierIds: [],
                _editable: true,
                _contents: {
                type: "Expression",
                operand: [
                  {
                    instanceId: "instanceid1",
                    type: "InstanceValue"
                  },
                  {
                    instanceId: "instanceid2",
                    type: "InstanceValue"
                  },
                  {
                    instanceId: "instanceid3",
                    type: "InstanceValue"
                  },
                  {
                    instanceId: "instanceid4",
                    type: "InstanceValue"
                  },
                  {
                    instanceId: "instanceid5",
                    type: "InstanceValue"
                  },
                  {
                    instanceId: "instanceid6",
                    type: "InstanceValue"
                  },
                  {
                    instanceId: "instanceid7",
                    type: "InstanceValue"
                  }
                ]
                  },
                  isAbstract: false,
                  _commitId: "latest",
                  _childViews: [
                    {
                      "aggregation": "composite",
                      "id": "childid1"
                    }
                  ],
                  generalizationIds: [],
                  _displayedElementIds: [
                    "somedisplayedid"
                  ],
                  _creator: "admin",
                  ownedOperationIds: [],
                  _created: "2017-04-27T16:22:52.518-0700",
                  name: "This is a Name",
                  elementImportIds: [],
                  collaborationUseIds: [],
                  isFinalSpecialization: false,
                  _projectId: "someprojectid"                 
            };

            var testElements = {
                elements: [
                    {
                        _allowedElements: [],
                        _modifier: "merp",
                        powertypeExtentIds: [],
                        representationId: null,
                        mdExtensionsIds: [],
                        _qualifiedId: "/opencae/someprojectid/someprojectid_pm/holding_bin_someprojectid/someelementid",
                        templateBindingIds: [],
                        appliedStereotypeInstanceId: "someappliedid",
                        templateParameterId: null,
                        ownerId: "someownerid",
                        isActive: false,
                        type: "Class",
                        isLeaf: false,
                        clientDependencyIds: [],
                        useCaseIds: [],
                        syncElementId: null,
                        classifierBehaviorId: null,
                        interfaceRealizationIds: [],
                        id: "someelementid",
                        _elasticId: "someelasticid",
                        _refId: "master",
                        supplierDependencyIds: [],
                        _modified: "2017-05-18T14:02:18.497-0700",
                        _appliedStereotypeIds: [
                            "somestereotypeid"
                        ],
                        nameExpression: null,
                        ownedAttributeIds: [
                            "someownedid"
                        ],
                        packageImportIds: [],
                        visibility: null,
                        substitutionIds: [],
                        documentation: "",
                        _qualifiedName: "//OpenCAE/Data/holding_bin/VE TEST",
                        redefinedClassifierIds: [],
                        _editable: true,
                        _contents: {
                        type: "Expression",
                        operand: [
                          {
                            instanceId: "instanceid1",
                            type: "InstanceValue"
                          },
                          {
                            instanceId: "instanceid2",
                            type: "InstanceValue"
                          },
                          {
                            instanceId: "instanceid3",
                            type: "InstanceValue"
                          },
                          {
                            instanceId: "instanceid4",
                            type: "InstanceValue"
                          },
                          {
                            instanceId: "instanceid5",
                            type: "InstanceValue"
                          },
                          {
                            instanceId: "instanceid6",
                            type: "InstanceValue"
                          },
                          {
                            instanceId: "instanceid7",
                            type: "InstanceValue"
                          }
                        ]
                          },
                          isAbstract: false,
                          _commitId: "latest",
                          _childViews: [
                            {
                              "aggregation": "composite",
                              "id": "childid1"
                            }
                          ],
                          generalizationIds: [],
                          _displayedElementIds: [
                            "somedisplayedid"
                          ],
                          _creator: "admin",
                          ownedOperationIds: [],
                          _created: "2017-04-27T16:22:52.518-0700",
                          name: "This is a Name",
                          elementImportIds: [],
                          collaborationUseIds: [],
                          isFinalSpecialization: false,
                          _projectId: "someprojectid"
                    }
                ]
            };

            $httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/master/elements').respond(200, testElements);
            $httpBackend.when('GET', '/alfresco/service/projects/someprojectid/refs/master/elements/someelementid').respond(200, element);

        });
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('mmsView should transclude a basic view', function () {
        scope.api = $rootScope.viewApi;
        scope.view = {
            mmsElementId: "someelementid",
            mmsProjectId: "someprojectid",
            mmsRefId: "master",
            mmsCommitId: "latest",
            mmsNumber: 930429
        };
        element = angular.element('<mms-view mms-element-id="{{view.mmsElementId}}" mms-project-id="{{view.mmsProjectId}}" mms-ref-id="{{view.mmsRefId}}" mms-commit-id="{{view.mmsCommitId}}" mms-number="{{view.mmsViewNumber}}" mms-view-api="api"></mms-view>');
        $compile(element)(scope);
        scope.$apply();
        $httpBackend.flush();
        expect(element.html()).toContain('div id="someelementid"');
        // console.log(element.html());
    });

    it('mmsView Controller transcludeClicked should not run when the given an undefined object ', function() {
        scope.api = {elementClicked: function(){}};
        scope.view = {
          mmsElementId: "someelementid",
          mmsProjectId: "someprojectid",
          mmsRefId: "master",
          mmsCommitId: "latest",
          mmsNumber: 930429
        };
        element = angular.element('<mms-view mms-element-id="{{view.mmsElementId}}" mms-project-id="{{view.mmsProjectId}}" mms-ref-id="{{view.mmsRefId}}" mms-commit-id="{{view.mmsCommitId}}" mms-number="{{view.mmsViewNumber}}" mms-view-api="api"></mms-view>');
        $compile(element)(scope);
        scope.$digest();
        $httpBackend.flush();
        var mmsViewController = element.controller('mmsView');
        spyOn(scope.api, 'elementClicked');


        mmsViewController.transcludeClicked(undefined);
        expect(scope.api.elementClicked).not.toHaveBeenCalled();

        mmsViewController.transcludeClicked({});
        expect(scope.api.elementClicked).toHaveBeenCalled();
    });
});
