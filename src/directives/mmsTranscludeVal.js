'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeVal', ['ElementService', 'UtilsService', 'UxService', 'Utils', '$log', '$compile', '$templateCache', 'growl', mmsTranscludeVal]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeVal
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's value binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and val change,
 * and on click. The element should be a Property. Nested transclusions within 
 * string values will also be registered.
 *
 * @param {string} mmsEid The id of the element whose value to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeVal(ElementService, UtilsService, UxService, Utils, $log, $compile, $templateCache, growl) {
    var valTemplate = $templateCache.get('mms/templates/mmsTranscludeVal.html');
    var frameTemplate = $templateCache.get('mms/templates/mmsTranscludeValFrame.html');
    var editTemplate = $templateCache.get('mms/templates/mmsTranscludeValEdit.html');

    var mmsTranscludeCtrl = function ($scope, $rootScope) {

        $scope.bbApi = {};
        $scope.buttons = [];
        $scope.buttonsInit = false;

        $scope.callDoubleClick = function(value) {
            growl.info(value.type);
        };

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

    var mmsTranscludeValLink = function(scope, element, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];

        var processed = false;
        scope.cfType = 'val';
        element.click(function(e) {
            if (scope.addFrame)
                scope.addFrame();

            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.mmsEid);

            /*if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT' && !scope.isEditing) //need review for inline editing (boolean and nested)
                return false;
            if (scope.isEditing)*/
                e.stopPropagation();
        });

        var recompile = function() {
            var toCompileList = [];
            var areStrings = false;
            for (var i = 0; i < scope.values.length; i++) {
                if (scope.values[i].type === 'LiteralString') {
                    areStrings = true;
                    var s = scope.values[i].string;
                    if (s.indexOf('<p>') === -1) {
                        s = s.replace('<', '&lt;');
                    }
                    toCompileList.push(s);
                } else {
                    break;
                }
            } 
            element.empty();
            if (scope.values.length === 0 || Object.keys(scope.values[0]).length < 2)
                element.html('<span' + ((scope.version === 'latest') ? '' : ' class="placeholder"') + '>(no value)</span>');
            else if (areStrings) {
                var toCompile = toCompileList.join(' ');
                if (toCompile === '') {
                    element.html('<span' + ((scope.version === 'latest') ? '' : ' class="placeholder"') + '>(no value)</span>');
                    return;
                }
                element.append(toCompile);
                $compile(element.contents())(scope); 
            } else {
                element.append(valTemplate);
                $compile(element.contents())(scope);
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var recompileEdit = function() {
            var toCompileList = [];
            var areStrings = false;
            for (var i = 0; i < scope.editValues.length; i++) {
                if (scope.editValues[i].type === 'LiteralString') {
                    areStrings = true;
                    var s = scope.editValues[i].string;
                    if (s.indexOf('<p>') === -1) {
                        s = s.replace('<', '&lt;');
                    }
                    toCompileList.push(s);
                } else {
                    break;
                }
            } 
            element.empty();
            if (scope.editValues.length === 0 || Object.keys(scope.editValues[0]).length < 2)
                element.html('<span' + ((scope.version === 'latest') ? '' : ' class="placeholder"') + '>(no value)</span>');
            else if (areStrings) {
                var toCompile = toCompileList.join(' ');
                if (toCompile === '') {
                    element.html('<span' + ((scope.version === 'latest') ? '' : ' class="placeholder"') + '>(no value)</span>');
                    return;
                }
                element.append('<div class="panel panel-info">'+toCompile+'</div>');
                $compile(element.contents())(scope); 
            } else {
                element.append(editTemplate);
                $compile(element.contents())(scope);
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.edit);
            }
        };

        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;
            if (UtilsService.hasCircularReference(scope, scope.mmsEid, 'val')) {
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
            ElementService.getElement(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.element = data;
                scope.values = scope.element.specialization.value;
                if (scope.element.specialization.type === 'Constraint' && scope.element.specialization.specification)
                    scope.values = [scope.element.specialization.specification];
                recompile();
                scope.$watch('values', recompile, true);
            }, function(reason) {
                element.html('<span class="error">value cf ' + newVal + ' not found</span>');
                growl.error('Cf Val Error: ' + reason.message + ': ' + scope.mmsEid);
            });
        });

        scope.hasHtml = function(s) {
            return Utils.hasHtml(s);
        };

        scope.addValueTypes = {string: 'LiteralString', boolean: 'LiteralBoolean', integer: 'LiteralInteger', real: 'LiteralReal'};
        scope.addValue = function(type) {
            if (type === 'LiteralBoolean')
                scope.editValues.push({type: type, boolean: false});
            else if (type === 'LiteralInteger')
                scope.editValues.push({type: type, integer: 0});
            else if (type === 'LiteralString')
                scope.editValues.push({type: type, string: ''});
            else if (type === 'LiteralReal')
                scope.editValues.push({type: type, double: 0.0});
        };
        scope.addValueType = 'LiteralString';

        if (mmsViewCtrl && mmsViewPresentationElemCtrl) {
            
            scope.isEditing = false;
            scope.elementSaving = false;
            scope.cleanUp = false;
            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
            scope.view = mmsViewCtrl.getView();
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(element, mmsViewCtrl);

            var callback = function() {
                Utils.showEditCallBack(scope,mmsViewCtrl,element,frameTemplate,recompile,recompileEdit);
            };
            
            mmsViewCtrl.registerPresenElemCallBack(callback);

            scope.$on('$destroy', function() {
                mmsViewCtrl.unRegisterPresenElemCallBack(callback);
            });

            scope.save = function() {
                Utils.saveAction(scope,recompile,mmsViewCtrl,scope.bbApi);
            };

            scope.cancel = function() {
                Utils.cancelAction(scope,mmsViewCtrl,recompile,scope.bbApi);
            };

            scope.delete = function() {
                Utils.deleteAction(scope,scope.bbApi,mmsViewPresentationElemCtrl.getParentSection());
            };

            scope.addFrame = function() {
                Utils.addFrame(scope,mmsViewCtrl,element,frameTemplate);
            };
        } 
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: ['?^mmsView','?^mmsViewPresentationElem'],
        controller: ['$scope', mmsTranscludeCtrl],
        link: mmsTranscludeValLink
    };
}