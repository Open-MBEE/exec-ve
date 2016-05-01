'use strict';

angular.module('mms.directives')
.directive('mmsPerspectives', ['SiteService', 'WorkspaceService', 'ConfigService', '$state', '$templateCache', '$window', 'growl', mmsPerspectives]);

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
function mmsPerspectives(SiteService, WorkspaceService, ConfigService, $state, $templateCache, $window, growl) {
    var template = $templateCache.get('mms/templates/mmsPerspectives.html');
    var count = 0;
    var mmsPerspectivesLink = function(scope, element, attrs) {
        var id = count++;
        element.html('<div class="tsDrawingView" id="network' + id + '" style="width:770px;height:480px;"></div>');
        var webProjectCommand =
        {
            "command":"WebProject",
            "onload":"onPerspectivesProjectLoad",
            "onready":"onPerspectivesProjectReady" + id,
            "onfailure":"onPerspectivesCommandFailure",
            "onsuccess":"onPerspectivesCommandSuccess",
            "data":
            [
                {
                    "command":"LoadProject",
                    "data":
                    {
                        "project":"tspProjectID" + id,
                        "filename":"project/Basic.tsp"
                    }
                },
                {
                    "command":"NewDefaultModel",
                    "data":
                    {
                        "project":"tspProjectID" + id,
                        "module":"Network",
                        "modelID":"NetworkModuleModelID"
                    }
                },
                {
                    "command":"NewIntegrator",
                    "data":
                    {
                        "project":"tspProjectID" + id,
                        "module":"Network",
                        "modelID":"NetworkModuleModelID",
                        "integratorName":"Network Excel Data",
                        "integratorID":"NetworkModuleNetworkDataIntegratorID"
                    }
                },
                {
                    "command":"NewView",
                    "data":
                    {
                        "project":"tspProjectID" + id,
                        "module":"Network",
                        "modelID":"NetworkModuleModelID",
                        "viewID":"network" + id,
                        "viewName":"Network Map",
                        "viewClass":"tsDrawingView",
                        "onload":"onPerspectivesViewLoaded",
                        "onupdate":"onPerspectivesViewUpdated",
                        "oncanvasrendered":"onPerspectivesViewCanvasRendered"
                    }
                }
            ]
        };

    var updateCommand =
	{
		"command":"Update",
        "onsuccess":"onPerspectivesCommandSuccess",
        "onfailure":"onPerspectivesCommandFailure",
		"data":
		{
			"project":"tspProjectID" + id,
			"module":"Network",
			"integratorIDs":["NetworkModuleNetworkDataIntegratorID"]
		}
	};
    //$window.updateCommand = updateCommand;
    $window.onPerspectivesCommandSuccess = function(successfulCommand)
    {
        console.log("Perspectives command: " +
           successfulCommand.command +
           " completed successfully");
    };
    $window.onPerspectivesCommandFailure = function(failedCommand, message, callstack)
    {
        console.log("Perspectives command " + failedCommand.commmand +
            " failed. Reason is: " + message);
        console.log(callstack);
    };
    $window.onPerspectivesProjectLoad = function(projectID)
    {
        console.log("All project UI elements should now be on the DOM for " + projectID);
    };
    $window['onPerspectivesProjectReady' + id] = function(projectID)
    {
        console.log("All project RPC calls are complete and you can now access all project resources via the DOM. " + projectID);

        // since everything is ready - lets just update for the user.
        invokePerspectivesCommand(updateCommand);
    };
    $window.onPerspectivesViewLoaded = function(projectID, moduleName, modelID, viewID, viewName)
    {
        console.log("The Perspectives view " + viewID + " is now on the DOM.");
    };
    $window.onPerspectivesViewUpdated = function(projectID, moduleName, modelID, viewID, viewNamem, viewData)
    {
        console.log("The Perspectives view" + viewID + " was udpdated with data " + viewData);
    };
    $window.onPerspectivesViewCanvasRendered = function(projectID, moduleName, modelID, viewID, viewName)
    {
        console.log("The Perspectives canvas for view" + viewID + " was rendered");
    };
    $window.onPerspectivesMouseClickOnObject = function(data)
    {
        if (data)
        {
            console.log("JavaScript Callback = Mouse clicked on object with ID = " + data.objectID);
        }
    };
    $window.onPerspectivesMouseDoubleClickOnObject = function(data)
    {
        if (data)
        {
            console.log("JavaScript Callback = Mouse double clicked on object with ID = " + data.objectID);
        }
    };
    invokePerspectivesCommand(webProjectCommand);
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            mmsWs: '@',
            mmsVersion: '@',
        },
        link: mmsPerspectivesLink
    };
}