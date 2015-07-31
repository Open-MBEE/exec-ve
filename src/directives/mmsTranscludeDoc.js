'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeDoc', ['Utils','ElementService', 'UtilsService', 'ViewService', 'UxService', '$compile', '$log', '$templateCache', '$rootScope', '$modal', 'growl', '_', mmsTranscludeDoc]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeDoc
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
 * 
 * ## Example
 *  <pre>
    <mms-transclude-doc mms-eid="element_id"></mms-transclude-doc>
    </pre>
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeDoc(Utils, ElementService, UtilsService, ViewService, UxService, $compile, $log, $templateCache, $rootScope, $modal, growl, _) {

    var template = $templateCache.get('mms/templates/mmsTranscludeDoc.html');

    var mmsTranscludeDocCtrl = function ($scope) {

        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.preview", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.save", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.cancel", $scope));
                $scope.bbApi.addButton(UxService.getButtonBarButton("presentation.element.delete", $scope));
                $scope.bbApi.setPermission("presentation.element.delete", $scope.isDirectChildOfPresentationElement);
            }     
        };

    };

    var mmsTranscludeDocLink = function(scope, element, attrs, controllers) {
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

            /*if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT' && !scope.isEditing)
                return false;
            if (scope.isEditing)
                e.stopPropagation();*/
            e.stopPropagation();
        });

        var recompile = function() {
            if (scope.recompileScope)
                scope.recompileScope.$destroy();
            scope.isEditing = false;
            element.empty();
            var doc = scope.element.documentation;
            if (!doc) {
                var p = '(No ' + scope.panelType + ')';
                if (scope.version !== 'latest')
                    p = '';
                doc = '<p>' + p + '</p>';
            }
            element.append(doc);
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
                doc = '<p ng-class="{placeholder: version!=\'latest\'}">(No ' + scope.panelType + ')</p>';
            element.append('<div class="panel panel-info">'+doc+'</div>');
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
            if (UtilsService.hasCircularReference(scope, scope.mmsEid, 'doc')) {
                element.html('<span class="error">Circular Reference!</span>');
                //$log.log("prevent circular dereference!");
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
            ElementService.getElement(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.element = data;
                if (!scope.panelTitle) {
                    scope.panelTitle = scope.element.name + " Documentation";
                    scope.panelType = "Text";
                }

                recompile();
                /*scope.$on('presentationElem.save', function(event, edit, ws, type) {
                    if (edit.sysmlid === scope.element.sysmlid && ws === scope.ws && type === 'documentation')
                        recompile();
                });*/
                //scope.$watch('element.documentation', recompile);
                if (scope.version === 'latest') {
                    scope.$on('element.updated', function(event, eid, ws, type) {
                        if (eid === scope.mmsEid && ws === scope.ws && (type === 'all' || type === 'documentation'))
                            recompile();
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
                // ElementService.getElementForEdit(scope.mmsEid, false, ws)
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
                //     element.html('<span class="error">doc cf ' + newVal + ' not found</span>');
                //     growl.error('Cf Doc Error: ' + reason.message + ': ' + scope.mmsEid);
                // });

            }, function(reason) {
                var status = ' not found';
                if (reason.status === 410)
                    status = ' deleted';
                element.html('<span class="error">doc cf ' + newVal + status + '</span>');
                growl.error('Cf Doc Error: ' + reason.message + ': ' + scope.mmsEid);
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
            var auto = [ViewService.typeToClassifierId.Image, ViewService.typeToClassifierId.Paragraph,
                ViewService.typeToClassifierId.List, ViewService.typeToClassifierId.Table];

            if (auto.indexOf(scope.instanceSpec.specialization.classifier[0]) >= 0)
            //do not allow model generated to be deleted
                scope.isDirectChildOfPresentationElement = false;
            if (scope.isDirectChildOfPresentationElement) {
                scope.panelTitle = scope.instanceSpec.name;
                scope.panelType = scope.presentationElem.type; //this is hack for fake table/list/equation until we get actual editors
                if (scope.panelType.charAt(scope.panelType.length-1) === 'T')
                    scope.panelType = scope.panelType.substring(0, scope.panelType.length-1);
                if (scope.panelType === 'Paragraph')
                    scope.panelType = 'Text';
            }
            if (scope.presentationElem) {
                scope.tinymceType = scope.presentationElem.type;
            }
        }

    };

    return {
        restrict: 'E',
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: ['?^mmsView','?^mmsViewPresentationElem'],
        controller: ['$scope', mmsTranscludeDocCtrl],
        link: mmsTranscludeDocLink
    };
}