'use strict';

angular.module('mms.directives')
.directive('mmsPerspectives', ['ElementService', '$templateCache', '$window', 'growl', 'ApplicationService', 'AuthService', '$uibModal', '$q', mmsPerspectives]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsPerspectives
 *
 * @requires mms.ElementService
 * @requires $templateCache
 * @requires $window
 * @requires growl
 * @requires ApplicationService
 * @requires AuthService
 * @requires $uibModal
 * @requires $q
 *
 * @restrict E
 *
 * @description
 * //TODO - update
 * mmsPerspectives is responsible for gathering server-side tsp file to display using
 * Tom Saywer Persectives JS library.
 *
 */
function mmsPerspectives(ElementService, $templateCache, $window, growl, ApplicationService, AuthService, $uibModal, $q) {
    var template = $templateCache.get('mms/templates/mmsPerspectives.html');
    var mapping = {};
    var deferreds = {};
    var projectId2Peid = {};
    function getElementsArrayString(elements) {
        return '[{"id": "' + elements.join('"}, {"id": "') + '"}]';
    }
    $window.onPerspectivesCommandSuccess = function(successfulCommand) {
        console.log("Perspectives command: " +
           successfulCommand.command +
           " completed successfully");
    };
    $window.onPerspectivesAddElementSuccess = function(successfulCommand) {
        console.log("Perspectives command: " +
           successfulCommand.command +
           " completed successfully");
    };
    $window.onPerspectivesCommandFailure = function(failedCommand, message, callstack) {
        console.log("Perspectives command " + failedCommand.commmand +
            " failed. Reason is: " + message);
        console.log(callstack);
    };
    $window.onPerspectivesProjectLoad = function(projectID) {
        console.log("All project UI elements should now be on the DOM for " + projectID);
    };
    $window.onPerspectivesProjectReady = function(projectID) {
        console.log("All project RPC calls are complete and you can now access all project resources via the DOM. " + projectID);
        invokePerspectivesCommand(mapping[projectID]);
    };
    $window.onPerspectivesViewLoaded = function(projectID, moduleName, modelID, viewID, viewName) {
        console.log("The Perspectives view " + viewID + " is now on the DOM.");
    };
    $window.onPerspectivesViewUpdated = function(projectID, moduleName, modelID, viewID, viewNamem, viewData) {
        console.log("The Perspectives view" + viewID + " was udpdated with data " + viewData);
    };
    $window.onPerspectivesViewCanvasRendered = function(projectID, moduleName, modelID, viewID, viewName) {
        console.log("The Perspectives canvas for view" + viewID + " was rendered");
    };
    $window.onPerspectivesMouseClickOnObject = function(data) {
        if (data) {
            console.log("JavaScript Callback = Mouse clicked on object with ID = " + data.objectID);
        }
    };
    $window.onPerspectivesMouseDoubleClickOnObject = function(data) {
        if (data) {
            console.log("JavaScript Callback = Mouse double clicked on object with ID = " + data.objectID);
        }
    };

    function tspAddElementCtrl($scope, $uibModalInstance) {
        $scope.choose = function(elem, property) {
            $uibModalInstance.close(elem.id);
        };
        $scope.cancel = function() {
            $uibModalInstance.dismiss();
        };
        $scope.searchOptions= {};
        $scope.searchOptions.callback = $scope.choose;
        $scope.searchOptions.emptyDocTxt = 'This field is empty';
    }
    //store global mapping of project name to hash, on*** functions can lookup the hash 
    var mmsPerspectivesLink = function(scope, element, attrs) {
        var id = ApplicationService.createUniqueId();
        scope.viewId = "view-" + id;
        //var initElements = ["_17_0_5_1_407019f_1402422711365_292853_16371"];
        scope.initElements = [];
        var viewName;
        var viewType;
        
        switch(scope.mmsTspSpec.tstype) {
        case "IBD":
            viewName = "Internal Block Diagram";
            viewType = "tsDrawingView";
            break;
        case "BDD":
            viewName = "Block Definition Diagram";
            viewType = "tsDrawingView";
            break;
        case "SMD":
            viewName = "State Machine";
            viewType = "tsDrawingView";
            break;
        case "AD":
            viewName = "Activity Diagram";
            viewType = "tsDrawingView";
            break;
        case "SD":
            viewName = "Sequence Diagram";
            viewType = "tsDrawingView";
            break;
        /*case "Table":
            viewName = "Table";
            viewType = "tsTableView";
            break;*/
        default:
        	viewName = "Unsupported Diagram";
        	viewType = "tsDrawingView";
        }
      //scope.mmsTspSpec.tstype
        
        if (scope.mmsTspSpec && scope.mmsTspSpec.elements)
            scope.initElements = scope.mmsTspSpec.elements;
        if (scope.mmsTspSpec && scope.mmsTspSpec.context)
            scope.context = scope.mmsTspSpec.context;

        scope.saveElement = function() {
            ElementService.updateElement({
                "id": scope.mmsPeId,
                _projectId: scope.mmsProjectId,
                _refId: scope.mmsRefId,
                "type": "InstanceSpecification",
                "specification": {
                    "type": "LiteralString",
                    "value": JSON.stringify({context: scope.context, type: "Tsp", tstype: scope.mmsTspSpec.tstype, elements: scope.initElements})
                }
            }).then(function() {
                growl.info("saved!");
            });
        };

        scope.useContext = function() {
            var instance = $uibModal.open({
                template: '<mms-search mms-options="searchOptions" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}"></mms-search><div class="modal-footer"></span><button class="btn btn-danger" ng-click="cancel()">CANCEL</button></div>',
                scope: scope,
                controller: ['$scope', '$uibModalInstance', tspAddElementCtrl],
                size: 'lg'
            });
            instance.result.then(function(eid) {
                console.log("element chosen: " + eid);
                console.log("project id: " + id);
                scope.context = eid;
                var groupCommand = {
                    "command": "Group",
                    "data": [
                        {
                            "command": "SetModelAttribute",
                            "data": {
                                "attributeName": "Context",
                                "attributeValue": eid,
                                "modelID": 'model-' + id,
                                "module": "SysML",
                                "project": id,
                                "viewID": "view-" + id,
                                "viewName": viewName
                            },
                            "onsuccess":"onPerspectivesAddElementSuccess",
                            "onfailure":"onPerspectivesCommandFailure",
                        },
                        {
                            "command": "Custom",
                            "data": {
                                "serverClassName": "gov.nasa.jpl.mbee.ems.action.ResetIntegratorCommandImpl",
                                "args": ["int-context-" + id],
                                "modelID": 'model-' + id,
                                "module": "SysML",
                                "project": id,
                                "viewID": "view-" + id,
                                "viewName": viewName
                            }
                        },
                        {
                            "command":"Update",
                            "onsuccess":"onPerspectivesAddElementSuccess",
                            "onfailure":"onPerspectivesCommandFailure",
                            "data": {
                                "project": id,
                                "module": "SysML",
                                "integratorIDs":["int-context-" + id]
                            }
                        },
                    ]
                };
                invokePerspectivesCommand(groupCommand);
            });
        };

        scope.addElement = function() {
            var instance = $uibModal.open({
                template: '<mms-search mms-options="searchOptions" mms-project-id="{{mmsProjectId}}" mms-ref-id="{{mmsRefId}}"></mms-search><div class="modal-footer"></span><button class="btn btn-danger" ng-click="cancel()">CANCEL</button></div>',
                scope: scope,
                controller: ['$scope', '$uibModalInstance', tspAddElementCtrl],
                size: 'lg'
            });
            instance.result.then(function(eid) {
                console.log("element chosen: " + eid);
                console.log("project id: " + id);
                scope.initElements.push(eid);
                var groupCommand = {
                    "command": "Group",
                    "data": [
                        {
                            "command": "SetModelAttribute",
                            "data": {
                                "attributeName": "AddElements",
                                "attributeValue": getElementsArrayString([eid]),
                                "modelID": 'model-' + id,
                                "module": "SysML",
                                "project": id,
                                "viewID": "view-" + id,
                                "viewName": viewName
                            },
                            "onsuccess":"onPerspectivesAddElementSuccess",
                            "onfailure":"onPerspectivesCommandFailure",
                        },
                        {
                            "command": "Custom",
                            "data": {
                                "serverClassName": "gov.nasa.jpl.mbee.ems.action.ResetIntegratorCommandImpl",
                                "args": ["int-add-" + id],
                                "modelID": 'model-' + id,
                                "module": "SysML",
                                "project": id,
                                "viewID": "view-" + id,
                                "viewName": viewName
                            }
                        },
                        {
                            "command":"Update",
                            "onsuccess":"onPerspectivesAddElementSuccess",
                            "onfailure":"onPerspectivesCommandFailure",
                            "data": {
                                "project": id,
                                "module": "SysML",
                                "integratorIDs":["int-add-" + id]
                            }
                        },
                    ]
                };
                invokePerspectivesCommand(groupCommand);
            });
        };
        var webProjectCommand = {
            "command":"WebProject",
            "onload":"onPerspectivesProjectLoad",
            "onready":"onPerspectivesProjectReady", //quirk?
            "onfailure":"onPerspectivesCommandFailure",
            "onsuccess":"onPerspectivesCommandSuccess",
            "data": [
                {
                    "command":"LoadProject",
                    "data": {
                        "project": id,
                        "filename":"project/MMS.tsp"
                    }
                },
                {
                    "command":"NewDefaultModel",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id
                    }
                },
                {
                    "command":"NewIntegrator",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "integratorName":"MMS ADD",
                        "integratorID":"int-add-" + id
                        //"integratorFileLocation": "https://cae-ems.jpl.nasa.gov/alfresco/service"
                    }
                },
                {
                    "command":"NewIntegrator",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "integratorName":"MMS Recurse",
                        "integratorID":"int-context-" + id
                        //"integratorFileLocation": "https://cae-ems.jpl.nasa.gov/alfresco/service"
                    }
                },
                //temporary until new json format is implemented 
                /*{
                    "command":"NewIntegrator",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "integratorName":"System Model Data",
                        "integratorID":"int-smd-" + id
                    }
                },*/
                {
                    "command":"NewIntegrator",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "integratorName":"Filter Control Data",
                        "integratorID":"int-fcd-" + id,
                        "integratorFileLocation": "data/SysMLFilterDefaults.xlsx"
                    }
                },
                {
                    "command":"NewView",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "viewID":"view-" + id,
                        "viewName": viewName,
                        "viewClass":viewType,
                        "onload":"onPerspectivesViewLoaded",
                        "onupdate":"onPerspectivesViewUpdated",
                        "oncanvasrendered":"onPerspectivesViewCanvasRendered"
                    }
                }
            ]
        };
        var updateCommand = {
            "command": "Group",
            "data": [
                {
                    "command": "Custom",
                    "data": {
                        "serverClassName": "gov.nasa.jpl.mbee.ems.action.SetMmsRestBaseUrlCommandImpl",
                        "args": ["int-add-" + id, "https://opencae-int.jpl.nasa.gov/alfresco/service"],
                        "modelID": 'model-' + id,
                        "module": "SysML",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": viewName
                    }
                }, 
                {
                    "command": "Custom",
                    "data": {
                        "serverClassName": "gov.nasa.jpl.mbee.ems.action.SetMmsRestBaseUrlCommandImpl",
                        "args": ["int-context-" + id, "https://opencae-int.jpl.nasa.gov/alfresco/service"],
                        "modelID": 'model-' + id,
                        "module": "SysML",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": viewName
                    }
                },
                {
                    "command": "SetModelAttribute",
                    "data": {
                        "attributeName": "Ticket",
                        "attributeValue": AuthService.getTicket(),
                        "modelID": 'model-' + id,
                        "module": "SysML",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": viewName
                    },
                    "onfailure":"onPerspectivesCommandFailure",
                },
                {
                    "command": "SetModelAttribute",
                    "data": {
                        "attributeName": "MMSRefId",
                        "attributeValue": scope.mmsRefId,
                        "modelID": 'model-' + id,
                        "module": "SysML",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": viewName
                    },
                    "onfailure":"onPerspectivesCommandFailure",
                },
                {
                    "command": "SetModelAttribute",
                    "data": {
                        "attributeName": "MMSProjectId",
                        "attributeValue": scope.mmsProjectId,
                        "modelID": 'model-' + id,
                        "module": "SysML",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": viewName
                    },
                    "onfailure":"onPerspectivesCommandFailure",
                }
            ]
        };
        if (scope.context || (scope.initElements.length > 0)) {
            var initialIntegratorIds = [];
            if (scope.context) {
                updateCommand.data.push({
                    "command": "SetModelAttribute",
                    "data": {
                        "attributeName": "Context",
                        "attributeValue": scope.context,
                        "modelID": 'model-' + id,
                        "module": "SysML",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": viewName
                    },
                    "onfailure":"onPerspectivesCommandFailure",
                });
                //initialIntegratorIds.push('int-context-' + id);
            }
            if (scope.initElements.length > 0) {
                updateCommand.data.push({
                    "command": "SetModelAttribute",
                    "data": {
                        "attributeName": "AddElements",
                        "attributeValue": getElementsArrayString(scope.initElements),
                        "modelID": 'model-' + id,
                        "module": "SysML",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": viewName
                    },
                    "onfailure":"onPerspectivesCommandFailure",
                });
                initialIntegratorIds.push('int-add-' + id);
            }
            initialIntegratorIds.push('int-fcd-' + id);
            updateCommand.data.push({
                "command":"Update",
                "onsuccess":"onPerspectivesCommandSuccess",
                "onfailure":"onPerspectivesCommandFailure",
                "data": {
                    "project": id,
                    "module": "SysML",
                    "integratorIDs": initialIntegratorIds
                    //"integratorIDs":["int-add-" + id, 'int-context-' + id, 'int-fcd-' + id]
                    //"integratorIDs":["int-smd-" + id, "int-fcd-" + id]
                }
            });
        }
        mapping[id] = updateCommand;
        projectId2Peid[id] = scope.mmsPeId;
        invokePerspectivesCommand(webProjectCommand);
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsTspSpec: '<',
            mmsPeId: '@'
        },
        link: mmsPerspectivesLink
    };
}