'use strict';

angular.module('mms.directives')
.directive('mmsPerspectives', ['SiteService', 'ElementService', 'WorkspaceService', 'ConfigService', '$state', '$templateCache', '$window', 'growl', 'ApplicationService', 'AuthService', '$modal', '$q', mmsPerspectives]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsPerspectives
 *
 * @requires mms.SiteService
 * @requires mms.WorkspaceService
 * @requires mms.ConfigService
 * @requires $state
 * @requires $templateCache
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * //TODO - update
 * mmsPerspectives is responsible for gathering server-side tsp file to display using
 * Tom Saywer Persectives JS library.
 *
 */
function mmsPerspectives(SiteService, ElementService, WorkspaceService, ConfigService, $state, $templateCache, $window, growl, ApplicationService, AuthService, $modal, $q) {
    var template = $templateCache.get('mms/templates/mmsPerspectives.html');
    var mapping = {};
    var deferreds = {};
    var projectId2Peid = {};
    function getElementsArrayString(elements) {
        return '[{"sysmlid": "' + elements.join('"}, {"sysmlid": "') + '"}]';
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
    $window.onPerspectivesSaveElementSuccess = function(successfulCommand, result) {
        
        console.log("Perspectives command: " +
           successfulCommand.command +
           " completed successfully");
        var projectId = successfulCommand.data.project;
        var eid = projectId2Peid[projectId];
        var elementsList = JSON.parse(result);
        ElementService.updateElement({
            "sysmlid": eid, 
            "specialization": {
                "type": "InstanceSpecification",
                "instanceSpecificationSpecification": {
                    "type": "LiteralString",
                    "string": JSON.stringify({elements: elementsList, type: "Tsp"})
                }
            }
        }).then(function() {
            deferreds[projectId].resolve("ok");
        });
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

    function tspAddElementCtrl($scope, $modalInstance) {
        $scope.choose = function(elem, property) {
            $modalInstance.close(elem.sysmlid);
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
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
        var initElements = [];
        if (scope.mmsTspSpec && scope.mmsTspSpec.elements)
            initElements = scope.mmsTspSpec.elements;

        scope.saveElement = function() {
            var deferred = $q.defer();
            // var saveCommand = {
            //     "command":"Update",
            //     "onsuccess":"onPerspectivesAddElementSuccess",
            //     "onfailure":"onPerspectivesCommandFailure",
            //     "data": {
            //         "project": id,
            //         "module":"MMS",
            //         "integratorIDs":["int-save-" + id]
            //     }
            // };
            deferreds[id] = deferred;
            deferred.promise.then(function() {
                growl.info("saved!");
            });
            var saveCommand = {
                    "command": "Custom",
                    "data": {
                        "serverClassName": "gov.nasa.jpl.mbee.ems.GetElementIdsCommandImpl",
                        "args": [],
                        "modelID": 'model-' + id,
                        "module": "MMS",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": "Drawing View 1"
                    },
                    "onsuccess": "onPerspectivesSaveElementSuccess",
                    "onfailure":"onPerspectivesCommandFailure",
                };
                    
            invokePerspectivesCommand(saveCommand);
        };

        scope.addElement = function() {
            var instance = $modal.open({
                template: '<mms-search mms-options="searchOptions"></mms-search><div class="modal-footer"></span><button class="btn btn-danger" ng-click="cancel()">CANCEL</button></div>',
                scope: scope,
                controller: ['$scope', '$modalInstance', tspAddElementCtrl],
                size: 'lg'
            });
            instance.result.then(function(eid) {
                console.log("element chosen: " + eid);
                console.log("project id: " + id);
                var groupCommand = {
                    "command": "Group",
                    "data": [
                        {
                            "command": "SetModelAttribute",
                            "data": {
                                "attributeName": "AddElements",
                                "attributeValue": getElementsArrayString([eid]),
                                "modelID": 'model-' + id,
                                "module": "MMS",
                                "project": id,
                                "viewID": "view-" + id,
                                "viewName": "Drawing View 1"
                            },
                            "onsuccess":"onPerspectivesAddElementSuccess",
                            "onfailure":"onPerspectivesCommandFailure",
                        },
                        {
                            "command": "Custom",
                            "data": {
                                "serverClassName": "gov.nasa.jpl.mbee.ems.ResetIntegratorCommandImpl",
                                "args": ["int-add-" + id],
                                "modelID": 'model-' + id,
                                "module": "MMS",
                                "project": id,
                                "viewID": "view-" + id,
                                "viewName": "Drawing View 1"
                            }
                        },
                        {
                            "command":"Update",
                            "onsuccess":"onPerspectivesAddElementSuccess",
                            "onfailure":"onPerspectivesCommandFailure",
                            "data": {
                                "project": id,
                                "module":"MMS",
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
                        "module":"MMS",
                        "modelID":"model-" + id
                    }
                },
                {
                    "command":"NewIntegrator",
                    "data": {
                        "project": id,
                        "module":"MMS",
                        "modelID":"model-" + id,
                        "integratorName":"MMS ADD",
                        "integratorID":"int-add-" + id,
                        //"integratorFileLocation": "https://cae-ems.jpl.nasa.gov/alfresco/service"
                    }
                },
                {
                    "command":"NewView",
                    "data": {
                        "project": id,
                        "module":"MMS",
                        "modelID":"model-" + id,
                        "viewID":"view-" + id,
                        "viewName":"Drawing View 1",
                        "viewClass":"tsDrawingView",
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
                        "serverClassName": "gov.nasa.jpl.mbee.ems.SetMmsRestBaseUrlCommandImpl",
                        "args": ["int-add-" + id, "https://cae-ems-uat.jpl.nasa.gov/alfresco/service"],
                        "modelID": 'model-' + id,
                        "module": "MMS",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": "Drawing View 1"
                    }
                }, 
                {
                    "command": "SetModelAttribute",
                    "data": {
                        "attributeName": "AddElements",
                        "attributeValue": getElementsArrayString(initElements),
                        "modelID": 'model-' + id,
                        "module": "MMS",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": "Drawing View 1"
                    },
                    "onfailure":"onPerspectivesCommandFailure",
                },
                {
                    "command": "SetModelAttribute",
                    "data": {
                        "attributeName": "Ticket",
                        "attributeValue": AuthService.getTicket(),
                        "modelID": 'model-' + id,
                        "module": "MMS",
                        "project": id,
                        "viewID": "view-" + id,
                        "viewName": "Drawing View 1"
                    },
                    "onfailure":"onPerspectivesCommandFailure",
                },
                {
                    "command":"Update",
                    "onsuccess":"onPerspectivesCommandSuccess",
                    "onfailure":"onPerspectivesCommandFailure",
                    "data": {
                        "project": id,
                        "module":"MMS",
                        "integratorIDs":["int-add-" + id]
                    }
               }
            ]
        };
        mapping[id] = updateCommand;
        projectId2Peid[id] = scope.mmsPeid;
        invokePerspectivesCommand(webProjectCommand);
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsWs: '@',
            mmsVersion: '@',
            mmsTspSpec: '=',
            mmsPeid: '@'
        },
        link: mmsPerspectivesLink
    };
}