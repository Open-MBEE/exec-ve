'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeName', ['ElementService', 'UxService', '$compile', 'growl', '$templateCache', 'Utils', mmsTranscludeName]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeName
 *
 * @requires mms.ElementService
 * @requires mms.UxService
 * @requires mms.Utils
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeName(ElementService, UxService, $compile, growl, $templateCache, Utils) {

    var template = $templateCache.get('mms/templates/mmsTranscludeName.html');
    var defaultTemplate = '<span ng-if="element.name">{{element.name}}</span><span ng-if="!element.name" class="no-print" ng-class="{placeholder: version!=\'latest\'}">(no name)</span>';
    var editTemplate = '<span ng-if="edit.name">{{edit.name}}</span><span ng-if="!edit.name" class="no-print" ng-class="{placeholder: version!=\'latest\'}">(no name)</span>';

    var mmsTranscludeNameCtrl = function ($scope) {

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
            }
        };

    };

    var mmsTranscludeNameLink = function(scope, domElement, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsCfDocCtrl = controllers[1];
        var mmsCfValCtrl = controllers[2];
        var processed = false;
        scope.recompileScope = null;
        domElement.click(function(e) {
            if (scope.noClick)
                return;

            if (scope.clickHandler) {
                scope.clickHandler();
                return;
            }
            if (scope.startEdit && !scope.nonEditable)
                scope.startEdit();

            if (!mmsViewCtrl)
                return false;

            if (scope.nonEditable) {
                growl.warning("Cross Reference is not editable.");
            }
            mmsViewCtrl.transcludeClicked(scope.element);
            e.stopPropagation();
        });

        var recompile = function(preview) {
            if (scope.recompileScope) {
                scope.recompileScope.$destroy();
            }
            domElement.empty();
            if (preview) {
                domElement[0].innerHTML = '<div class="panel panel-info">'+editTemplate+'</div>';
            } else {
                scope.isEditing = false;
                domElement[0].innerHTML = defaultTemplate;
            }
            scope.recompileScope = scope.$new();
            $compile(domElement.contents())(scope.recompileScope);
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var idwatch = scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal)
                return;
            if (!scope.mmsWatchId)
                idwatch();
            var projectId = scope.mmsProjectId;
            var refId = scope.mmsRefId;
            var commitId = scope.mmsCommitId;
            if (mmsCfValCtrl) {
                var cfvVersion = mmsCfValCtrl.getElementOrigin();
                if (!projectId)
                    projectId = cfvVersion.projectId;
                if (!refId)
                    refId = cfvVersion.refId;
                if (!commitId)
                    commitId = cfvVersion.commitId;
            }
            if (mmsCfDocCtrl) {
                var cfdVersion = mmsCfDocCtrl.getElementOrigin();
                if (!projectId)
                    projectId = mmsCfDocCtrl.projectId;
                if (!refId)
                    refId = mmsCfDocCtrl.refId;
                if (!commitId)
                    commitId = mmsCfDocCtrl.commitId;
            }
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getElementOrigin();
                if (!projectId)
                    projectId = viewVersion.projectId;
                if (!refId)
                    refId = viewVersion.refId;
                if (!commitId)
                    commitId = viewVersion.commitId;
            }
            domElement.html('(loading...)');
            domElement.addClass("isLoading");

            scope.projectId = projectId;
            scope.refId = refId ? refId : 'master';
            scope.commitId = commitId ? commitId : 'latest';
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId};
            ElementService.getElement(reqOb, 1, false)
            .then(function(data) {
                scope.element = data;
                recompile();
                if (mmsViewCtrl) {
                    mmsViewCtrl.elementTranscluded(scope.element);
                }
                if (scope.commitId === 'latest') {
                    scope.$on('element.updated', function (event, elementOb, continueEdit, stompUpdate) {
                        if (elementOb.id === scope.element.id && elementOb._projectId === scope.element._projectId &&
                            elementOb._refId === scope.element._refId && !continueEdit) {
                            //actions for stomp
                            if(stompUpdate && scope.isEditing === true) {
                                growl.warning("This value has been changed: " + elementOb.name +
                                    " modified by: " + elementOb._modifier, {ttl: -1});
                            } else {
                                recompile();
                            }
                        }
                    });
                }
            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                domElement.html('<span class="mms-error">name cf ' + newVal + status + '</span>');
            }).finally(function() {
                domElement.removeClass("isLoading");
            });
        });



        if (mmsViewCtrl) {

            scope.isEditing = false;
            scope.elementSaving = false;
            scope.view = mmsViewCtrl.getView();
            var type = "name";

            scope.save = function() {
                Utils.saveAction(scope, domElement, false);
            };

            scope.saveC = function() {
                Utils.saveAction(scope, domElement, true);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope, recompile, domElement);
            };

            scope.startEdit = function() {
                Utils.startEdit(scope, mmsViewCtrl, domElement, template, false);
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompile, domElement);
            };
        }
    };

    return {
        restrict: 'E',
        scope: {
            mmsElementId: '@mmsEid',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            mmsWatchId: '@',
            noClick: '@',
            nonEditable: '<',
            clickHandler: '&?'
        },
        require: ['?^^mmsView', '?^^mmsTranscludeDoc', '?^^mmsTranscludeVal'],
        controller: ['$scope', mmsTranscludeNameCtrl],
        link: mmsTranscludeNameLink
    };
}