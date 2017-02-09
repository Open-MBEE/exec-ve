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

    var mmsTranscludeDocLink = function(scope, element, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        var mmsCfDocCtrl = controllers[2];
        var mmsCfValCtrl = controllers[3];
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
            var doc = scope.element.documentation;
            if (!doc || emptyRegex.test(doc)) {
                var p = '<span class="no-print">(No ' + scope.panelType + ')</span>';
                if (scope.version !== 'latest')
                    p = '';
                doc = '<p>' + p + '</p>';
            }
            var fixSpan = /<span style="/; //<div style="display:inline;
            doc = doc.replace(fixPreSpanRegex, "<mms-transclude");
            doc = doc.replace(fixPostSpanRegex, "</mms-transclude-$1>");
            element[0].innerHTML = doc;
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element[0]]);
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
            var doc = scope.edit.documentation;
            if (!doc)
                doc = '<p class="no-print" ng-class="{placeholder: commitId!=\'latest\'}">(No ' + scope.panelType + ')</p>';
            element[0].innerHTML = '<div class="panel panel-info">'+doc+'</div>';
            //element.append('<div class="panel panel-info">'+doc+'</div>');
            scope.recompileScope = scope.$new();
            $compile(element.contents())(scope.recompileScope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.edit);
            }
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
            element.html('(loading...)');
            element.addClass("isLoading");
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
                    scope.$on('element.updated', function(event, eid, refId, type, continueEdit) {
                        //TODO check projectId ===scope.projectId or commit?
                        if (eid === scope.mmsElementId && refId === scope.refId && (type === 'all' || type === 'documentation') && !continueEdit)
                            recompile();
                    });
                    //actions for stomp 
                    scope.$on("stomp.element", function(event, deltaSource, deltaWorkspaceId, deltaElementId, deltaModifier, elemName){
                        if(deltaWorkspaceId === scope.refId && deltaElementId === scope.mmsElementId){
                            if(scope.isEditing === false){
                                recompile();
                            }
                            if(scope.isEditing === true){
                                growl.warning("This documentation has been changed: " + elemName +
                                            " modified by: " + deltaModifier, {ttl: -1});
                            }
                        }
                    });
                }
                // TODO: below has issues when having edits.  For some reason this is
                //       entered twice, once and the frame is added, and then again
                //       and recompileEdit is ran! 
                
                // // We cant count on scope.edit or scope.isEditing in the case that the
                // // view name is saved while the view documenation is being edited, so
                // // no way to know if there should be a frame or not based on that, so
                // // get the edit object from the cache and check the editable state
                // // and if we have any edits: 
                // ElementService.getElementForEdit(scope.mmsElementId, false, mmsRefId)
                // .then(function(edit) {

                //     // TODO: replace with Utils.hasEdits() after refactoring to not pass in scope
                //     //if (_.isEqual(edit, data)) {
                //     if (edit.documentation === data.documentation) {
                //         recompile();
                //     }
                //     else {
                //         if (mmsViewCtrl && mmsViewCtrl.isEditable()) {
                //             Utils.addFrame(scope,mmsViewCtrl,element,template);
                //         }
                //         else {
                //             scope.recompileEdit = true;
                //             recompileEdit();
                //         }
                //     }

                // }, function(reason) {
                //     element.html('<span class="mms-error">doc cf ' + newVal + ' not found</span>');
                //     growl.error('Cf Doc Error: ' + reason.message + ': ' + scope.mmsElementId);
                // });

            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                element.html('<span class="mms-error">doc cf ' + newVal + status + '</span>');
            }).finally(function() {
                element.removeClass("isLoading");
            });
        });

        if (mmsViewCtrl) {

            scope.isEditing = false;
            scope.elementSaving = false;
            scope.view = mmsViewCtrl.getView();
            //TODO remove this when deleting in parent PE directive
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);
            var type = "documentation";

            var callback = function() {
                Utils.showEditCallBack(scope,mmsViewCtrl,element,template,recompile,recompileEdit,type);
            };

            scope.save = function() {
                Utils.saveAction(scope, recompile, scope.bbApi, null, type, element);
            };

            scope.saveC = function() {
                Utils.saveAction(scope, recompile, scope.bbApi, null, type, element, true);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope, recompile, scope.bbApi, type, element);
            };

            scope.addFrame = function() {
                Utils.addFrame(scope, mmsViewCtrl, element, template);
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompileEdit, recompile, type, element);
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
            mmsElementId: '@',
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