import angular from 'angular';

const veDirectives = angular.module('veDirectives');

veDirectives.directive('mmsTsDiagram', [
    'ElementService',
    '$templateCache',
    '$window',
    '$timeout',
    'growl',
    'ApplicationService',
    'AuthService',
    'URLService',
    mmsTsDiagram,
]);

/**
 * @ngdoc directive
 * @name veDirectives.directive:mmsTsDiagram
 *
 * @requires mms.ElementService
 * @requires $templateCache
 * @requires $window
 * @requires growl
 * @requires ApplicationService
 * @requires AuthService
 *
 * @restrict E
 * * //TODO - update
 *
 */
function mmsTsDiagram(
    ElementService,
    $templateCache,
    $window,
    $timeout,
    growl,
    ApplicationService,
    AuthService,
    URLService
) {
    let importedTsJs = false;
    const template = 'partials/mms-directives/mmsTsDiagram.html';
    const mapping = {};
    // var deferreds = {};
    const projectId2PeId = {};
    const peId2projectId = {};
    const projectIdLoaded = {};
    const viewNameMapping = {
        IBD: 'Internal Block Diagram',
        BDD: 'Block Definition Diagram',
        STM: 'State Machine',
        ACT: 'Activity Diagram',
        SD: 'Sequence Diagram',
        PKG: 'Package Diagram',
        PAR: 'Parametric Diagram',
        REQ: 'Requirement Diagram',
        UC: 'Use Case Diagram',
    };
    const controlMapping = {
        IBD: 'IBD Controls',
        BDD: 'BDD Controls',
        STM: 'STM Controls',
        ACT: 'ACT Controls',
        SD: 'Controls',
        PKG: 'PKG Controls',
        PAR: 'PAR Controls',
        REQ: 'REQ Controls',
        UC: 'UC Controls',
    };
    const elementTableMapping = {
        IBD: 'IBD Elements',
        BDD: 'BDD Elements',
        STM: 'STM Elements',
        ACT: 'ACT Elements',
        SD: 'Elements',
        PKG: 'PKG Elements',
        PAR: 'PAR Elements',
        REQ: 'REQ Elements',
        UC: 'UC Elements',
    };
    const relTableMapping = {
        IBD: 'IBD Relationships',
        BDD: 'BDD Relationships',
        STM: 'STM Relationships',
        ACT: 'ACT Relationships',
        SD: 'Associations',
        PKG: 'PKG Relationships',
        PAR: 'PAR Relationships',
        REQ: 'REQ Relationships',
        UC: 'UC Relationships',
    };

    $window.onPerspectivesCommandSuccess = (successfulCommand) => {
        console.log('Perspectives command: ' + successfulCommand.command + ' completed successfully');
        $window.hidePerspectivesProgressIndicator();
    };
    $window.onPerspectivesCommandFailure = function (failedCommand, message, callstack) {
        console.log('Perspectives command ' + failedCommand.commmand + ' failed. Reason is: ' + message);
        $window.hidePerspectivesProgressIndicator();
        console.log(callstack);
    };
    $window.onPerspectivesProjectLoad = (projectID) => {
        console.log('All project UI elements should now be on the DOM for ' + projectID);
    };
    $window.onPerspectivesProjectReady = (projectID) => {
        console.log(
            'All project RPC calls are complete and you can now access all project resources via the DOM. ' + projectID
        );
        if (!projectIdLoaded[projectID]) {
            $window.showPerspectivesProgressIndicator();
            $window.invokePerspectivesCommand(mapping[projectID]);
            projectIdLoaded[projectID] = true;
        }
    };
    $window.onPerspectivesViewLoaded = function (projectID, moduleName, modelID, viewID, viewName) {
        console.log('The Perspectives view ' + viewID + ' is now on the DOM.');
    };
    $window.onPerspectivesViewUpdated = function (projectID, moduleName, modelID, viewID, viewNamem, peObject) {
        console.log('The Perspectives view' + viewID + ' was udpdated with data ' + peObject);
    };
    $window.onPerspectivesViewCanvasRendered = function (projectID, moduleName, modelID, viewID, viewName) {
        console.log('The Perspectives canvas for view' + viewID + ' was rendered');
    };
    $window.onPerspectivesMouseClickOnObject = (data) => {
        if (data) {
            console.log('JavaScript Callback = Mouse clicked on object with ID = ' + data.objectID);
        }
    };
    $window.onPerspectivesMouseDoubleClickOnObject = (data) => {
        if (data) {
            console.log('JavaScript Callback = Mouse double clicked on object with ID = ' + data.objectID);
        }
    };
    $window.PerspectivesErrorDialogHandler = function (message, callStackString) {
        //prevent ts error dialog from appearing for any js exception
        console.log(message);
        console.log(callStackString);
    };
    //store global mapping of project name to hash, on*** functions can lookup the hash
    const mmsTsDiagramLink = (scope, element, attrs) => {
        if (!$window.invokePerspectivesCommand && !importedTsJs) {
            $('body').append(
                '<script type="text/javascript" language="javascript" src="/mms-ts/tsperspectives/tsperspectives.nocache.js"></script>\n' +
                    '<script type="text/javascript" language="javascript" src="/mms-ts/tsperspectives/dojo/dojo/dojo.js"></script>\n' +
                    '<script type="text/javascript" language="javascript" src="/mms-ts/tsperspectives/TSHovering.js"></script>\n' +
                    '<script type="text/javascript" language="javascript" src="/mms-ts/tsperspectives/TSButtonTooltip.js"></script>'
            );

            importedTsJs = true;
        }
        let id = ApplicationService.createUniqueId();
        if (peId2projectId[scope.mmsPeId]) {
            id = peId2projectId[scope.mmsPeId];
        } else {
            peId2projectId[scope.mmsPeId] = id;
        }
        projectId2PeId[id] = scope.mmsPeId;

        scope.containerId = 'tabContainer-' + id;
        scope.viewId = 'view-' + id;
        scope.tableId = 'table-' + id;
        scope.edgeTableId = 'edgeTable-' + id;
        scope.inspectorId = 'inspector-' + id;
        scope.controlsId = 'controls-' + id;
        scope.initElements = [];

        const params = {
            viewName: viewNameMapping[scope.mmsTspSpec.diagramType],
            viewType: 'tsDrawingView',
            tableName: elementTableMapping[scope.mmsTspSpec.diagramType],
            edgeTableName: relTableMapping[scope.mmsTspSpec.diagramType],
            inspectorName: 'Details',
            controlsName: controlMapping[scope.mmsTspSpec.diagramType],
        };

        if (scope.mmsTspSpec && scope.mmsTspSpec.elements) scope.initElements = scope.mmsTspSpec.elements;
        if (scope.mmsTspSpec && scope.mmsTspSpec.context) scope.context = scope.mmsTspSpec.context;

        const webProjectCommand = _createWebProjectCommand(scope, params, id);
        mapping[id] = _createUpdateCommand(scope, params.viewName, id);

        function tryInvokeCommand() {
            if (!$window.invokePerspectivesCommand) {
                $timeout(tryInvokeCommand, 1000, false);
            } else {
                $window.invokePerspectivesCommand(webProjectCommand);
            }
        }
        tryInvokeCommand();
    };

    function _getElementsArrayString(elements) {
        return '[{"id": "' + elements.join('"}, {"id": "') + '"}]';
    }

    function _createWebProjectCommand(scope, params, id) {
        const webProjectCommand = {
            command: 'WebProject',
            onload: 'onPerspectivesProjectLoad',
            onready: 'onPerspectivesProjectReady', //quirk?
            onfailure: 'onPerspectivesCommandFailure',
            onsuccess: 'onPerspectivesCommandSuccess',
            data: [
                {
                    command: 'LoadProject',
                    data: {
                        project: id,
                        filename: 'project/MMS.tsp',
                    },
                },
                {
                    command: 'NewDefaultModel',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                    },
                },
                {
                    command: 'NewIntegrator',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        integratorName: 'MMS ADD',
                        integratorID: 'int-add-' + id,
                    },
                },
                {
                    command: 'NewIntegrator',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        integratorName: 'Filter Control Data',
                        integratorID: 'int-fcd-' + id,
                        integratorFileLocation: 'data/SysMLFilterDefaults.xlsx',
                    },
                },
                {
                    command: 'NewView',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        viewID: 'view-' + id,
                        viewName: params.viewName,
                        viewClass: params.viewType,
                        onload: 'onPerspectivesViewLoaded',
                        onupdate: 'onPerspectivesViewUpdated',
                        oncanvasrendered: 'onPerspectivesViewCanvasRendered',
                    },
                },
                {
                    command: 'NewView',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        viewID: 'table-' + id,
                        viewName: params.tableName,
                        viewClass: 'tsTableView',
                        onload: 'onPerspectivesViewLoaded',
                        onupdate: 'onPerspectivesViewUpdated',
                        oncanvasrendered: 'onPerspectivesViewCanvasRendered',
                    },
                },
                {
                    command: 'NewView',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        viewID: 'edgeTable-' + id,
                        viewName: params.edgeTableName,
                        viewClass: 'tsTableView',
                        onload: 'onPerspectivesViewLoaded',
                        onupdate: 'onPerspectivesViewUpdated',
                        oncanvasrendered: 'onPerspectivesViewCanvasRendered',
                    },
                },
                {
                    command: 'NewView',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        viewID: '' + scope.inspectorId,
                        viewName: params.inspectorName,
                        viewClass: 'tsInspectorView',
                        onload: 'onPerspectivesViewLoaded',
                        onupdate: 'onPerspectivesViewUpdated',
                        oncanvasrendered: 'onPerspectivesViewCanvasRendered',
                    },
                },
                {
                    command: 'NewView',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        viewID: '' + scope.controlsId,
                        viewName: params.controlsName,
                        viewClass: 'tsTreeView',
                        onload: 'onPerspectivesViewLoaded',
                        onupdate: 'onPerspectivesViewUpdated',
                        oncanvasrendered: 'onPerspectivesViewCanvasRendered',
                    },
                },
                {
                    command: 'NewTabPanel',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        id: 'tabContainer-' + id,
                        widgetIDs: [
                            scope.viewId,
                            scope.tableId,
                            scope.edgeTableId,
                            scope.inspectorId,
                            scope.controlsId,
                        ],
                    },
                },
            ],
        };
        return webProjectCommand;
    }

    function _createUpdateCommand(scope, viewName, id) {
        const updateCommand: {
            data: object[];
            command: string;
            onsuccess: string;
        } = {
            command: 'Group',
            onsuccess: 'onPerspectivesCommandSuccess',
            data: [] as object[],
        };
        updateCommand.data.push(
            {
                command: 'Custom',
                data: {
                    serverClassName: 'gov.nasa.jpl.mbee.ems.action.SetMmsRestBaseUrlCommandImpl',
                    args: ['int-add-' + id, URLService.getMmsServer() + URLService.getRoot()],
                    modelID: 'model-' + id,
                    module: 'SysML',
                    project: id,
                    viewID: 'view-' + id,
                    viewName: viewName,
                },
            },
            {
                command: 'SetModelAttribute',
                data: {
                    attributeName: 'Ticket',
                    attributeValue: AuthService.getToken(),
                    modelID: 'model-' + id,
                    module: 'SysML',
                    project: id,
                    viewID: 'view-' + id,
                    viewName: viewName,
                },
                onfailure: 'onPerspectivesCommandFailure',
            },
            {
                command: 'SetModelAttribute',
                data: {
                    attributeName: 'MMSRefId',
                    attributeValue: scope.mmsRefId,
                    modelID: 'model-' + id,
                    module: 'SysML',
                    project: id,
                    viewID: 'view-' + id,
                    viewName: viewName,
                },
                onfailure: 'onPerspectivesCommandFailure',
            },
            {
                command: 'SetModelAttribute',
                data: {
                    attributeName: 'MMSProjectId',
                    attributeValue: scope.mmsProjectId,
                    modelID: 'model-' + id,
                    module: 'SysML',
                    project: id,
                    viewID: 'view-' + id,
                    viewName: viewName,
                },
                onfailure: 'onPerspectivesCommandFailure',
            }
        );
        if (scope.context || scope.initElements.length > 0) {
            const initialIntegratorIds: string[] = [];
            if (scope.initElements.length > 0) {
                updateCommand.data.push({
                    command: 'SetModelAttribute',
                    data: {
                        attributeName: 'Inserts',
                        attributeValue: _getElementsArrayString(scope.initElements),
                        modelID: 'model-' + id,
                        module: 'SysML',
                        project: id,
                        viewID: 'view-' + id,
                        viewName: viewName,
                    },
                    onfailure: 'onPerspectivesCommandFailure',
                });
                initialIntegratorIds.push('int-add-' + id);
            }
            initialIntegratorIds.push('int-fcd-' + id);
            updateCommand.data.push({
                command: 'Update',
                onsuccess: 'onPerspectivesCommandSuccess',
                onfailure: 'onPerspectivesCommandFailure',
                data: {
                    project: id,
                    module: 'SysML',
                    integratorIDs: initialIntegratorIds,
                },
            });
            if (scope.context) {
                updateCommand.data.push({
                    command: 'Custom',
                    data: {
                        project: id,
                        module: 'SysML',
                        modelID: 'model-' + id,
                        serverClassName: 'gov.nasa.jpl.mbee.ems.command.NewContextCommand',
                        viewID: 'view-' + id,
                        viewName: viewName,
                        args: ['' + scope.context],
                    },
                    onfailure: 'onPerspectivesCommandFailure',
                });
            }
        }
        return updateCommand;
    }

    return {
        restrict: 'E',
        templateUrl: template,
        scope: {
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsTspSpec: '<',
            mmsPeId: '@',
        },
        link: mmsTsDiagramLink,
    };
}
