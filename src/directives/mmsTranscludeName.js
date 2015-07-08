'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeName', ['ElementService', 'UxService', '$compile', 'growl', '$templateCache', '$rootScope', '$modal', 'Utils', mmsTranscludeName]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeName
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsEid The id of the element whose name to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeName(ElementService, UxService, $compile, growl, $templateCache, $rootScope, $modal, Utils) {

    var template = $templateCache.get('mms/templates/mmsTranscludeName.html');
    var defaultTemplate = '<span ng-if="element.name">{{element.name}}</span><span ng-if="!element.name" ng-class="{placeholder: version!=\'latest\'}">(no name)</span>';
    var editTemplate = '<span ng-if="edit.name">{{edit.name}}</span><span ng-if="!edit.name" ng-class="{placeholder: version!=\'latest\'}">(no name)</span>';

    var mmsTranscludeNameCtrl = function ($scope) {

        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.preview", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.save", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.cancel", $scope));
            }     
        };

    };

    var mmsTranscludeNameLink = function(scope, element, attrs, mmsViewCtrl) {
        var processed = false;
        scope.recompileScope = null;
        element.click(function(e) {
            if (scope.addFrame)
                scope.addFrame();

            if (!mmsViewCtrl)
                return false;
            mmsViewCtrl.transcludeClicked(scope.mmsEid);
            //return false;
            e.stopPropagation();
        });

        var recompile = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            scope.isEditing = false;
            element.empty();
            element.append(defaultTemplate);
            scope.recompileScope = scope.$new();
            $compile(element.contents())(scope.recompileScope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var recompileEdit = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            element.empty();
            element.append('<div class="panel panel-info">'+editTemplate+'</div>');
            scope.recompileScope = scope.$new();
            $compile(element.contents())(scope.recompileScope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.edit);
            }
        };


        var idwatch = scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal)
                return;
            idwatch();
            var ws = scope.mmsWs;
            var version = scope.mmsVersion;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!ws)
                    ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
            }
            scope.ws = ws;
            scope.version = version ? version : 'latest';
            ElementService.getElement(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.element = data;
                recompile();
                if (mmsViewCtrl) {
                    mmsViewCtrl.elementTranscluded(scope.element);
                }
                if (scope.version === 'latest') {
                    scope.$on('element.updated', function(event, eid, ws, type) {
                        if (eid === scope.mmsEid && ws === scope.ws && (type === 'all' || type === 'name'))
                            recompile();
                    });
                }
            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                element.html('<span class="error">name cf ' + newVal + status + '</span>');
                growl.error('Cf Name Error: ' + reason.message + ': ' + scope.mmsEid);
            });
        });

        /*scope.$watch('element.name', function(newVal) {
            if (mmsViewCtrl && newVal) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        });*/


        if (mmsViewCtrl) {

            scope.isEditing = false;
            scope.elementSaving = false;
            scope.view = mmsViewCtrl.getView();
            var type = "name";

            var callback = function() {
                Utils.showEditCallBack(scope,mmsViewCtrl,element,template,recompile,recompileEdit,type);
            };
            
            mmsViewCtrl.registerPresenElemCallBack(callback);

            scope.$on('$destroy', function() {
                mmsViewCtrl.unRegisterPresenElemCallBack(callback);
            });

            scope.save = function() {
                Utils.saveAction(scope,recompile,scope.bbApi,null,type,element);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope,recompile,scope.bbApi,type,element);
            };

            scope.addFrame = function() {
                Utils.addFrame(scope,mmsViewCtrl,element,template);
            };

            // TODO: will we ever want a delete?

            scope.preview = function() {
                Utils.previewAction(scope, recompileEdit, recompile, type, element);
            };
        }

    };

    return {
        restrict: 'E',
        //template: '<span ng-if="element.name">{{element.name}}</span><span ng-if="!element.name" ng-class="{placeholder: version!=\'latest\'}">(no name)</span>',
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: '?^mmsView',
        controller: ['$scope', mmsTranscludeNameCtrl],
        link: mmsTranscludeNameLink
    };
}