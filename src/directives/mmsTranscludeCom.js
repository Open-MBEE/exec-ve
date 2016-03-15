'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeCom', ['Utils', 'ElementService', 'UtilsService', 'ViewService', 'UxService', '$log', '$templateCache', '$compile', 'growl', mmsTranscludeCom]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeCom
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * (This is different from mmsTranscludeDoc because of special styles applied to comments)
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeCom(Utils, ElementService, UtilsService, ViewService, UxService, $log, $templateCache, $compile, growl) {

    var template = $templateCache.get('mms/templates/mmsTranscludeDoc.html');
    
    var mmsTranscludeComCtrl = function ($scope) {

        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-preview", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-save", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-saveC", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-cancel", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation-element-delete", $scope));
                $scope.bbApi.setPermission("presentation-element-delete", $scope.isDirectChildOfPresentationElement);
            }     
        };
    };

    var mmsTranscludeComLink = function(scope, element, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        scope.recompileScope = null;
        var processed = false;
        scope.cfType = 'doc';

        element.click(function(e) {
            if (scope.addFrame)
                scope.addFrame();

            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.mmsEid);
            //if (e.target.tagName !== 'A')
              //  return false;
              e.stopPropagation();
        });

        var recompile = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            scope.isEditing = false;
            element.empty();
            var doc = scope.element.documentation || '(No comment)';
            doc += ' - ' + scope.element.creator;
            element[0].innerHTML = doc;
            scope.recompileScope = scope.$new();
            $compile(element.contents())(scope.recompileScope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element, 'Comment');
            }
        };

        var recompileEdit = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            element.empty();
            var doc = scope.edit.documentation;
            if (!doc)
                doc = '<p class="no-print" ng-class="{placeholder: version!=\'latest\'}">(No Comment)</p>';
            element[0].innerHTML = '<div class="panel panel-info">'+doc+'</div>';
            scope.recompileScope = scope.$new();
            $compile(element.contents())(scope.recompileScope); 
        };

        var idwatch = scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal)
                return;
            idwatch();
            if (UtilsService.hasCircularReference(scope, scope.mmsEid, 'doc')) {
                //$log.log("prevent circular dereference!");
                element.html('<span class="error">Circular Reference!</span>');
                return;
            }
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
            ElementService.getElement(scope.mmsEid, false, ws, version, 1)
            .then(function(data) {
                scope.element = data;
                recompile();
                scope.panelType = "Comment";
                if (scope.version === 'latest') {
                    scope.$on('element.updated', function(event, eid, ws, type, continueEdit) {
                        if (eid === scope.mmsEid && ws === scope.ws && (type === 'all' || type === 'documentation') && !continueEdit)
                            recompile();
                    });
                }
                //scope.$watch('element.documentation', recompile);
            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                element.html('<span class="error">comment ' + newVal + status + '</span>');
                //growl.error('Cf Comment Error: ' + reason.message + ': ' + scope.mmsEid);
            });
        });

        if (mmsViewCtrl) {

            scope.isEditing = false;
            scope.elementSaving = false;
            scope.view = mmsViewCtrl.getView();
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);
            var type = "documentation";

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

            scope.saveC = function() {
                Utils.saveAction(scope,recompile,scope.bbApi,null,type,element,true);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope,recompile,scope.bbApi,type,element);
            };

            scope.addFrame = function() {
                Utils.addFrame(scope,mmsViewCtrl,element,template);
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompileEdit, recompile, type,element);
            };
        } 

        if (mmsViewPresentationElemCtrl) {

            scope.delete = function() {
                Utils.deleteAction(scope,scope.bbApi,mmsViewPresentationElemCtrl.getParentSection());
            };

            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            var auto = [ViewService.TYPE_TO_CLASSIFIER_ID.Image, ViewService.TYPE_TO_CLASSIFIER_ID.Paragraph,
                ViewService.TYPE_TO_CLASSIFIER_ID.List, ViewService.TYPE_TO_CLASSIFIER_ID.Table];

            if (auto.indexOf(scope.instanceSpec.specialization.classifier[0]) >= 0)
            //do not allow model generated to be deleted
                scope.isDirectChildOfPresentationElement = false;
            if (scope.isDirectChildOfPresentationElement)
                scope.panelTitle = scope.instanceSpec.name;
            scope.panelType = 'Comment'; 
        }
    };

    return {
        restrict: 'E',
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: ['?^mmsView', '?^mmsViewPresentationElem'],
        controller: ['$scope', mmsTranscludeComCtrl],
        link: mmsTranscludeComLink
    };
}