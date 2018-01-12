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
        scope.containerId = "tabContainer-" + id;
        scope.viewId = "view-" + id;
        scope.tableId = "table-" + id;
        scope.edgeTableId = "edgeTable-" + id;
        scope.inspectorId = "inspector-" + id;
        scope.controlsId = "controls-" + id;
        //var initElements = ["_17_0_5_1_407019f_1402422711365_292853_16371"];
        scope.initElements = [];
        var viewName;
        var viewType;
        var tableName;
        var edgeTableName;
        var inspectorName;
        var controlsTreeName;
        
        switch(scope.mmsTspSpec.tstype) {
        case "IBD":
            viewName = "Internal Block Diagram";
            viewType = "tsDrawingView";
            tableName = 'Classifiers';
            edgeTableName = "Associations";
            inspectorName = "Details";
            controlsTreeName = "IBD Controls";
            break;
        case "BDD":
            viewName = "Block Definition Diagram";
            viewType = "tsDrawingView";
            tableName = 'Classifiers';
            edgeTableName = "Associations";
            inspectorName = "Details";
            controlsTreeName = "BDD Controls";
            break;
        case "SMD":
            viewName = "State Machine";
            viewType = "tsDrawingView";
            tableName = 'Classifiers';
            edgeTableName = "Associations";
            inspectorName = "Details";
            controlsTreeName = "Controls";
            break;
        case "AD":
            viewName = "Activity Diagram";
            viewType = "tsDrawingView";
            tableName = 'Classifiers';
            edgeTableName = "Associations";
            inspectorName = "Details";
            controlsTreeName = "Activity Controls";
            break;
        case "SD":
            viewName = "Sequence Diagram";
            viewType = "tsDrawingView";
            edgeTableName = "Associations";
            inspectorName = "Details";
            break;
        /*case "Table":
            viewName = "Table";
            viewType = "tsTableView";
            break;*/
        default:
        	viewName = "Blcok Definition Diagram";
            viewType = "tsDrawingView";
            tableName = "Classifiers";
            edgeTableName = "Associations";
            inspectorName = "Details";
        }
      //scope.mmsTspSpec.tstype
            	
        
        if (scope.mmsTspSpec && scope.mmsTspSpec.elements)
            scope.initElements = scope.mmsTspSpec.elements;
        if (scope.mmsTspSpec && scope.mmsTspSpec.context)
            scope.context = scope.mmsTspSpec.context;

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
                    }
                },
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
                },
                {
                    "command":"NewView",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "viewID":"table-" + id,
                        "viewName": tableName,
                        "viewClass": 'tsTableView',
                        "onload":"onPerspectivesViewLoaded",
                        "onupdate":"onPerspectivesViewUpdated",
                        "oncanvasrendered":"onPerspectivesViewCanvasRendered"
                        }
                },
                {
                    "command":"NewView",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "viewID":"edgeTable-" + id,
                        "viewName": edgeTableName,
                        "viewClass": 'tsTableView',
                        "onload":"onPerspectivesViewLoaded",
                        "onupdate":"onPerspectivesViewUpdated",
                        "oncanvasrendered":"onPerspectivesViewCanvasRendered"
                        }
                },
                {
                    "command":"NewView",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "viewID": "" + scope.inspectorId,
                        "viewName": inspectorName,
                        "viewClass": 'tsInspectorView',
                        "onload":"onPerspectivesViewLoaded",
                        "onupdate":"onPerspectivesViewUpdated",
                        "oncanvasrendered":"onPerspectivesViewCanvasRendered"
                        }
                },
                {
                    "command":"NewView",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "viewID":"" + scope.controlsId,
                        "viewName": controlsTreeName,
                        "viewClass": 'tsTreeView',
                        "onload":"onPerspectivesViewLoaded",
                        "onupdate":"onPerspectivesViewUpdated",
                        "oncanvasrendered":"onPerspectivesViewCanvasRendered"
                        }
                },
                {
                    "command":"NewTabPanel",
                    "data": {
                        "project": id,
                        "module": "SysML",
                        "modelID":"model-" + id,
                        "id":"tabContainer-" + id,
                        "widgetIDs": [scope.viewId, scope.tableId, scope.edgeTableId,
                         scope.inspectorId, scope.controlsId]
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
                        "args": ["int-add-" + id, "https://opencae-uat.jpl.nasa.gov/alfresco/service"],
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
                }
            });
            if (scope.context) {
                updateCommand.data.push({
                    "command": "Custom",
                            "data":{
                                "project":id,
                                "module":"SysML",
                                "modelID":'model-' + id,
                                "serverClassName":"gov.nasa.jpl.mbee.ems.command.NewContextCommand",
                                "viewID":"view-" + id,
                                "viewName":viewName,
                                "args":[""+scope.context]
                            },
                    "onfailure":"onPerspectivesCommandFailure",
                });
            }
        }
        scope.$on('$destroy', function() {
            invokePerspectivesCommand({
                "command": "CloseProject",
                "onsuccess":"onPerspectivesCommandSuccess",
                "onfailure":"onPerspectivesCommandFailure",
                "data": {
                    "project": id
                }
            });
        });
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