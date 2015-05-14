'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeDoc', ['Utils','ElementService', 'UtilsService', 'ViewService', 'UxService', '$compile', '$log', '$templateCache', '$rootScope', '$modal', 'growl', mmsTranscludeDoc]);

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
function mmsTranscludeDoc(Utils, ElementService, UtilsService, ViewService, UxService, $compile, $log, $templateCache, $rootScope, $modal, growl) {

    var template = $templateCache.get('mms/templates/mmsTranscludeDoc.html');

    var mmsTranscludeDocCtrl = function ($scope) {

        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;

        $scope.bbApi.init = function() {
            if (!$scope.buttonsInit) {
                $scope.buttonsInit = true;
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

        var processed = false;
        scope.cfType = 'doc';

        element.click(function(e) {
            if (scope.addFrame)
                scope.addFrame();

            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.mmsEid);

            if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT')
                return false;
            //e.stopPropagation();
        });

        var recompile = function() {
            element.empty();
            var doc = scope.element.documentation;
            if (!doc)
                doc = '<p ng-class="{placeholder: version!=\'latest\'}">(no documentation)</p>';
            element.append(doc);
            $compile(element.contents())(scope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var recompileEdit = function() {
            element.empty();
            var doc = scope.edit.documentation;
            if (!doc)
                doc = '<p ng-class="{placeholder: version!=\'latest\'}">(no documentation)</p>';
            element.append('<div class="panel panel-info">'+doc+'</div>');
            $compile(element.contents())(scope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.edit);
            }
        };

        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;
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
                    scope.ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
            }
            scope.version = version ? version : 'latest';
            ElementService.getElement(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.element = data;
                if (!scope.panelTitle)
                    scope.panelTitle = scope.element.name;
                recompile();
                scope.$watch('element.documentation', recompile);
            }, function(reason) {
                element.html('<span class="error">doc cf ' + newVal + ' not found</span>');
                growl.error('Cf Doc Error: ' + reason.message + ': ' + scope.mmsEid);
            });
        });

        if (mmsViewCtrl) {

            scope.isEditing = false;
            scope.elementSaving = false;
            scope.cleanUp = false;
            scope.view = mmsViewCtrl.getView();
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);

            mmsViewCtrl.registerPresenElemCallBack(function() {
                Utils.showEditCallBack(scope,mmsViewCtrl,element,template,recompile,recompileEdit,"documentation");
            });

            scope.save = function() {
                Utils.saveAction(scope,recompile,mmsViewCtrl,scope.bbApi);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope,mmsViewCtrl,recompile,scope.bbApi,"documentation");
            };

            scope.delete = function() {
                Utils.deleteAction(scope,scope.bbApi);
            };

            scope.addFrame = function() {
                Utils.addFrame(scope,mmsViewCtrl,element,template);
            };
        } 

        if (mmsViewPresentationElemCtrl) {

            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            if (scope.isDirectChildOfPresentationElement)
                scope.panelTitle = scope.instanceSpec.name;
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