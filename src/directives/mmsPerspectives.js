'use strict';

angular.module('mms.directives')
.directive('mmsPerspectives', ['ElementService', '$templateCache', '$window', '$timeout', 'growl', 'ApplicationService', 'AuthService', 'URLService', mmsPerspectives]);

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
 *
 * @restrict E
 *
 * @description
 * //TODO - update
 * mmsPerspectives is responsible for gathering server-side tsp file to display using
 * Tom Saywer Persectives JS library.
 *
 */
function mmsPerspectives(ElementService, $templateCache, $window, $timeout, growl, ApplicationService, AuthService, URLService) {
    var template = $templateCache.get('mms/templates/mmsPerspectives.html');
    var mapping = {};
    var deferreds = {};
    var projectId2PeId = {};
    var peId2projectId = {};
    var projectIdLoaded = {};
    var viewNameMapping = {
        IBD: 'Internal Block Diagram',
        BDD: 'Block Definition Diagram',
        SMD: 'State Machine',
        AD: 'Activity Diagram',
        SD: 'Sequence Diagram'
    };
    var controlMapping = {
        IBD: 'IBD Controls',
        BDD: 'BDD Controls',
        SMD: 'Controls',
        AD: 'Activity Controls',
        SD: 'Controls'
    };
    $('body').append(
    '<script type="text/javascript" language="javascript" src="/Basic/tsperspectives/tsperspectives.nocache.js"></script>\n' +
    '<script type="text/javascript" language="javascript" src="/Basic/tsperspectives/dojo/dojo/dojo.js"></script>\n' +
    '<script type="text/javascript" language="javascript" src="/Basic/tsperspectives/TSHovering.js"></script>\n' +
    '<script language="javascript" type="text/javascript" src="/Basic/tsperspectives/TSButtonTooltip.js"></script>');

    function getElementsArrayString(elements) {
        return '[{"id": "' + elements.join('"}, {"id": "') + '"}]';
    }
    $window.onPerspectivesCommandSuccess = function(successfulCommand) {
        console.log("Perspectives command: " + successfulCommand.command + " completed successfully");
    };
    $window.onPerspectivesCommandFailure = function(failedCommand, message, callstack) {
        console.log("Perspectives command " + failedCommand.commmand + " failed. Reason is: " + message);
        console.log(callstack);
    };
    $window.onPerspectivesProjectLoad = function(projectID) {
        console.log("All project UI elements should now be on the DOM for " + projectID);
    };
    $window.onPerspectivesProjectReady = function(projectID) {
        console.log("All project RPC calls are complete and you can now access all project resources via the DOM. " + projectID);
        if (!projectIdLoaded[projectID]) {
            invokePerspectivesCommand(mapping[projectID]);
            projectIdLoaded[projectID] = true;
        }
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

    //store global mapping of project name to hash, on*** functions can lookup the hash 
    var mmsPerspectivesLink = function(scope, element, attrs) {
        var id = ApplicationService.createUniqueId();
        if (peId2projectId[scope.mmsPeId]) {
            id = peId2projectId[scope.mmsPeId];
        } else {
            peId2projectId[scope.mmsPeId] = id;
        }

        scope.containerId = "tabContainer-" + id;
        scope.viewId = "view-" + id;
        scope.tableId = "table-" + id;
        scope.edgeTableId = "edgeTable-" + id;
        scope.inspectorId = "inspector-" + id;
        scope.controlsId = "controls-" + id;
        scope.initElements = [];

        var viewName = viewNameMapping[scope.mmsTspSpec.tstype];
        var viewType = 'tsDrawingView';
        var tableName = 'Classifiers';
        var edgeTableName = 'Associations';
        var inspectorName = 'Details';
        var controlsTreeName = controlMapping[scope.mmsTspSpec.tstype];

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
                        "args": ["int-add-" + id, 'https://opencae-uat.jpl.nasa.gov/alfresco/service'],//ApplicationService.getAppBaseUrl() + URLService.getRoot()],
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
        mapping[id] = updateCommand;
        projectId2PeId[id] = scope.mmsPeId;
        function tryInvokeCommand() {
            if (!$window.invokePerspectivesCommand) {
                $timeout(tryInvokeCommand, 1000, false);
            }
            invokePerspectivesCommand(webProjectCommand);
        }
        tryInvokeCommand();
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