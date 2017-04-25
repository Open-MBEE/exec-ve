'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeDoc', ['Utils','ElementService', 'UtilsService', 'ViewService', 'UxService', '$compile', '$templateCache', 'growl', '_', 'MathJax', mmsTranscludeDoc]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeDoc
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.ViewService
 * @requires mms.UxService
 * @requires mms.Utils
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires _
 * @requires MathJax
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * 
 * ## Example
 *  <pre>
    <mms-transclude-doc mms-element-id="element_id"></mms-transclude-doc>
    </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeDoc(Utils, ElementService, UtilsService, ViewService, UxService, $compile, $templateCache, growl, _, MathJax) {

    var template = $templateCache.get('mms/templates/mmsTranscludeDoc.html');

    var fixPreSpanRegex = /<\/span>\s*<mms-transclude/g;
    var fixPostSpanRegex = /<\/mms-transclude-(name|doc|val|com)>\s*<span[^>]*>/g;
    var emptyRegex = /^\s*$/;

    var mmsTranscludeDocCtrl = function ($scope) {

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

        //INFO this was this.getWsAndVersion
        this.getElementOrigin = function() {
            return {
                projectId: $scope.projectId,
                refId: $scope.refId,
                commitId: $scope.commitId
            };
        };
    };

    var mmsTranscludeDocLink = function(scope, domElement, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        var mmsCfDocCtrl = controllers[2];
        var mmsCfValCtrl = controllers[3];
        scope.recompileScope = null;
        var processed = false;
        scope.cfType = 'doc';

        domElement.click(function(e) {
            if (scope.startEdit && !scope.nonEditable)
                scope.startEdit();

            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.element);
            if (scope.nonEditable) {
                growl.warning("Cross Reference is not editable.");
            }
            e.stopPropagation();
        });

        var recompile = function(preview) {
            if (scope.recompileScope) {
                scope.recompileScope.$destroy();
            }
            domElement.empty();
            var doc = preview ? scope.edit.documentation : scope.element.documentation;
            if (!doc || emptyRegex.test(doc)) {
                if (preview) {
                    doc = '<p class="no-print" ng-class="{placeholder: commitId!=\'latest\'}">(No ' + scope.panelType + ')</p>';
                }
                var p = '<span class="no-print">(No ' + scope.panelType + ')</span>';
                if (scope.commitId !== 'latest')
                    p = '';
                doc = '<p>' + p + '</p>';
            }
            var fixSpan = /<span style="/;
            doc = doc.replace(fixPreSpanRegex, "<mms-transclude");
            doc = doc.replace(fixPostSpanRegex, "</mms-transclude-$1>");
            if (preview) {
                domElement[0].innerHTML = '<div class="panel panel-info">'+doc+'</div>';
            } else {
                scope.isEditing = false;
                domElement[0].innerHTML = doc;
            }
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, domElement[0]]);
            scope.recompileScope = scope.$new();
            $compile(domElement.contents())(scope.recompileScope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var idwatch = scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal)
                return;
            idwatch();
            if (UtilsService.hasCircularReference(scope, scope.mmsElementId, 'doc')) {
                domElement.html('<span class="mms-error">Circular Reference!</span>');
                return;
            }
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
                if (!scope.panelTitle) {
                    scope.panelTitle = scope.element.name + " Documentation";
                    scope.panelType = "Text";
                }
                recompile();
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
                domElement.html('<span class="mms-error">doc cf ' + newVal + status + '</span>');
            }).finally(function() {
                domElement.removeClass("isLoading");
            });
        });

        if (mmsViewCtrl) {

            scope.isEditing = false;
            scope.elementSaving = false;
            scope.view = mmsViewCtrl.getView();
            //TODO remove this when deleting in parent PE directive
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(domElement, mmsViewCtrl);
            var type = "documentation";

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

        if (mmsViewPresentationElemCtrl) {

            scope.delete = function() {
                Utils.deleteAction(scope, scope.bbApi, mmsViewPresentationElemCtrl.getParentSection());
            };

            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            var auto = [ViewService.TYPE_TO_CLASSIFIER_ID.Image, ViewService.TYPE_TO_CLASSIFIER_ID.Paragraph,
                ViewService.TYPE_TO_CLASSIFIER_ID.List, ViewService.TYPE_TO_CLASSIFIER_ID.Table];

            if (auto.indexOf(scope.instanceSpec.classifierIds[0]) >= 0)
            //do not allow model generated to be deleted
                scope.isDirectChildOfPresentationElement = false;
            if (scope.isDirectChildOfPresentationElement) {
                scope.panelTitle = scope.instanceSpec.name;
                scope.panelType = scope.presentationElem.type; //this is hack for fake table/list/equation until we get actual editors
                if (scope.panelType.charAt(scope.panelType.length-1) === 'T')
                    scope.panelType = scope.panelType.substring(0, scope.panelType.length-1);
                if (scope.panelType === 'Paragraph')
                    scope.panelType = 'Text';
                if (scope.panelType === 'Figure')
                    scope.panelType = 'Image';
            }
            if (scope.presentationElem) {
                scope.editorType = scope.presentationElem.type;
            }
        }
    };

    return {
        restrict: 'E',
        scope: {
            mmsElementId: '@mmsEid',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            nonEditable: '<'
        },
        require: ['?^^mmsView','?^^mmsViewPresentationElem', '?^^mmsTranscludeDoc', '?^^mmsTranscludeVal'],
        controller: ['$scope', mmsTranscludeDocCtrl],
        link: mmsTranscludeDocLink
    };
}