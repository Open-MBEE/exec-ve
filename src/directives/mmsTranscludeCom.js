'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeCom', ['Utils', 'ElementService', 'UtilsService', 'ViewService', 'UxService', '$templateCache', '$compile', 'growl', 'MathJax', mmsTranscludeCom]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeCom
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.ViewService
 * @requires mms.UxService
 * @requires mms.Utils
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires MathJax
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * (This is different from mmsTranscludeDoc because of special styles applied to comments)
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeCom(Utils, ElementService, UtilsService, ViewService, UxService, $templateCache, $compile, growl, MathJax) {

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
            if (scope.addFrame && !scope.nonEditable)
                scope.addFrame();

            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.element);
            if (scope.nonEditable) {
                growl.warning("Cross Reference is not editable.");
            }
            e.stopPropagation();
        });

        var recompile = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            scope.isEditing = false;
            element.empty();
            var doc = scope.element.documentation || '(No comment)';
            doc += ' - ' + scope.element._creator;
            element[0].innerHTML = doc;
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element[0]]);
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
                doc = '<p class="no-print" ng-class="{placeholder: commitId!=\'latest\'}">(No Comment)</p>';
            element[0].innerHTML = '<div class="panel panel-info">'+doc+'</div>';
            scope.recompileScope = scope.$new();
            $compile(element.contents())(scope.recompileScope); 
        };

        var idwatch = scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal)
                return;
            idwatch();
            if (UtilsService.hasCircularReference(scope, scope.mmsElementId, 'doc')) {
                element.html('<span class="mms-error">Circular Reference!</span>');
                return;
            }
            var projectId = scope.mmsProjectId;
            var refId = scope.mmsRefId;
            var commitId = scope.mmsCommitId;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getElementOrigin();
                if (!projectId)
                    projectId = viewVersion.projectId;
                if (!refId)
                    refId = viewVersion.refId;
                if (!commitId)
                    commitId = viewVersion.commitId;
            }
            scope.projectId = projectId;
            scope.refId = refId ? refId : 'master';
            scope.commitId = commitId ? commitId : 'latest';
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};
            ElementService.getElement(reqOb, 1, false)
            .then(function(data) {
                scope.element = data;
                recompile();
                scope.panelType = "Comment";
                if (scope.commitId === 'latest') {
                    scope.$on('element.updated', function(event, eid, refId, type, continueEdit) {
                        //TODO check projectId ===scope.projectId or commit?
                        if (eid === scope.mmsElementId && refId === scope.refId && (type === 'all' || type === 'documentation') && !continueEdit)
                            recompile();
                    });
                }
            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                element.html('<span class="mms-error">comment ' + newVal + status + '</span>');
            });
        });

        if (mmsViewCtrl) {

            scope.isEditing = false;
            scope.elementSaving = false;
            scope.view = mmsViewCtrl.getView();
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);
            var type = "documentation";

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

            if (auto.indexOf(scope.instanceSpec.classifierIds[0]) >= 0)
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
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            nonEditable: '<'
        },
        require: ['?^mmsView', '?^mmsViewPresentationElem'],
        controller: ['$scope', mmsTranscludeComCtrl],
        link: mmsTranscludeComLink
    };
}