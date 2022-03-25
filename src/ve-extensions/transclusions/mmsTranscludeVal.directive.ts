import * as angular from "angular";
var veDirectives = angular.module('veDirectives');

veDirectives.directive('mmsTranscludeVal', ['ElementService', 'UtilsService', 'UxService', 'Utils', 'URLService', 'AuthService',
    '$http', '$compile', 'growl', 'MathJax', 'ViewService', 'EventService', 'MathJaxService', mmsTranscludeVal]);

/**
 * @ngdoc directive
 * @name veDirectives.directive:mmsTranscludeVal
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires mms.URLService
 * @requires mms.UxService
 * @requires mms.Utils
 * @requires $compile
 * @requires $http
 * @requires $templateCache
 * @requires growl
 * @requires _
 * @requires MathJax
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's value binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and val change,
 * and on click. The element should be a Property. Nested transclusions within 
 * string values will also be registered.
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
function mmsTranscludeVal(ElementService, UtilsService, UxService, Utils, URLService, AuthService, $http,
                          $compile, growl, ViewService, EventService, MathJaxService) {

    let eventSvc = EventService;

    var valTemplate = 'partials/mms-directives/mmsTranscludeVal.html';
    var frameTemplate = 'partials/mms-directives/mmsTranscludeValFrame.html';
    var editTemplate = 'partials/mms-directives/mmsTranscludeValEdit.html';
    var emptyRegex = /^\s*$/;
    var spacePeriod = />(?:\s|&nbsp;)\./g;
    var spaceSpace = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g;
    var spaceComma = />(?:\s|&nbsp;),/g;

    var mmsTranscludeCtrl = function ($scope) {

        eventSvc.$init($scope);

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

    var mmsTranscludeValLink = function(scope, domElement : JQuery, attrs, controllers) {
        var mmsViewCtrl = controllers[0];
        var mmsViewPresentationElemCtrl = controllers[1];
        scope.recompileScope = null;
        scope.cfType = 'val';
        domElement.on("click",function(e) {
            if (scope.startEdit && !scope.nonEditable) {
                scope.startEdit();
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.transcludeClicked(scope.element);
            }
            if (scope.nonEditable && mmsViewCtrl && mmsViewCtrl.isEditable()) {
                growl.warning("Cross Reference is not editable.");
            }
            e.stopPropagation();
        });

        scope.addHtml = function(value) {
            value.value = "<p>" + value.value + "</p>";
        };

        scope.cleanupVal = function(obj) {
            obj.value = parseInt(obj.value);
        };

        var recompile = function(preview?) {
            if (scope.recompileScope) {
                scope.recompileScope.$destroy();
            }
            var toCompileList = [];
            var areStrings = false;
            var values = scope.values;
            if (preview) {
                values = scope.editValues;
            } else {
                scope.isEditing = false;
            }
            for (var i = 0; i < values.length; i++) {
                if (values[i].type === 'LiteralString') {
                    areStrings = true;
                    var s = values[i].value;
                    if (s.indexOf('<p>') === -1) {
                        s = s.replace('<', '&lt;');
                    }
                    toCompileList.push(s);
                } else {
                    break;
                }
            }
            domElement.empty();
            scope.recompileScope = scope.$new();
            if (values.length === 0 || Object.keys(values[0]).length < 2) {
                domElement[0].innerHTML = '<span class="no-print placeholder">(no value)</span>';
            } else if (areStrings) {
                var toCompile = toCompileList.join(' ');
                if (toCompile === '' || emptyRegex.test(toCompile)) {
                    domElement[0].innerHTML = '<span class="no-print placeholder">(no value)</span>';
                    return;
                }
                toCompile = toCompile.replace(spacePeriod, '>.');
                toCompile = toCompile.replace(spaceSpace, '> ');
                toCompile = toCompile.replace(spaceComma, '>,');
                if (preview) {
                    domElement[0].innerHTML = '<div class="panel panel-info">'+toCompile+'</div>';
                } else {
                    domElement[0].innerHTML = toCompile;
                }
                $(domElement[0]).find('img').each(function(index) {
                    Utils.fixImgSrc($(this));
                });
                if (!scope.mmsGenerateForDiff) {
                    MathJaxService.typeset(domElement[0], scope).then(
                        () => _finalize()
                    );
                }else {
                    _finalize();
                }

            } else {
                if (preview) {
                    domElement[0].innerHTML = editTemplate;
                } else {
                    domElement[0].innerHTML = valTemplate;
                }
                $compile(domElement.contents())(scope.recompileScope);
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        var _finalize = function () {
            $compile(domElement.contents())(scope.recompileScope);
        }

        var idwatch = scope.$watch('mmsElementId', function(newVal, oldVal) {
            if (!newVal || !scope.mmsProjectId) {
                return;
            }
            idwatch();
            if (UtilsService.hasCircularReference(scope, scope.mmsElementId, 'val')) {
                domElement.html('<span class="mms-error">Circular Reference!</span>');
                return;
            }
            domElement.html('(loading...)');
            domElement.addClass("isLoading");

            scope.projectId = scope.mmsProjectId;
            scope.refId = scope.mmsRefId ? scope.mmsRefId : 'master';
            scope.commitId = scope.mmsCommitId ? scope.mmsCommitId : 'latest';
            var reqOb = {elementId: scope.mmsElementId, projectId: scope.projectId, refId: scope.refId, commitId: scope.commitId, includeRecentVersionElement: true};
            ElementService.getElement(reqOb, 1)
            .then(function(data) {
                scope.element = data;
                Utils.setupValCf(scope);
                recompile();
                Utils.reopenUnsavedElts(scope, 'value');
                if (scope.commitId === 'latest') {
                   scope.subs.push(eventSvc.$on('element.updated', function (data) {
                        let elementOb = data.element;
                        let continueEdit = data.continueEdit;
                        if (elementOb.id === scope.element.id && elementOb._projectId === scope.element._projectId &&
                            elementOb._refId === scope.element._refId && !continueEdit) {
                            Utils.setupValCf(scope);
                            recompile();
                        }
                    }));
                }
            }, function(reason) {
                domElement.html('<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type" mms-cf-label="::cfLabel"></annotation>');
                $compile(domElement.contents())(Object.assign(scope.$new(), {
                    reqOb: reqOb,
                    recentElement: reason.data.recentVersionOfElement,
                    type: ViewService.AnnotationType.mmsTranscludeVal,
                    cfLabel: scope.mmsCfLabel
                }));
            }).finally(function() {
                domElement.removeClass("isLoading");
            });
        });

        scope.hasHtml = function(s) {
            return Utils.hasHtml(s);
        };

        Utils.setupValEditFunctions(scope);
        
        if (mmsViewCtrl) {
            scope.isEditing = false;
            scope.elementSaving = false;
            scope.isDirectChildOfPresentationElement = Utils.isDirectChildOfPresentationElementFunc(domElement, mmsViewCtrl);
            scope.view = mmsViewCtrl.getView();

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
                var id = scope.element.typeId;
                if (scope.element.type === 'Slot')
                    id = scope.element.definingFeatureId;
                if (!id || (scope.isEnumeration && scope.options)) {
                    Utils.startEdit(scope, mmsViewCtrl, domElement, frameTemplate, false);
                    return;
                }
                Utils.getPropertySpec(scope.element)
                .then( function(value) {
                    scope.isEnumeration = value.isEnumeration;
                    scope.isSlot = value.isSlot;
                    scope.options = value.options;
                    Utils.startEdit(scope, mmsViewCtrl, domElement, frameTemplate, false);
                }, function(reason) {
                    Utils.startEdit(scope, mmsViewCtrl, domElement, frameTemplate, false);
                    growl.error('Failed to get property spec: ' + reason.message);
                });
            };

            scope.preview = function() {
                Utils.previewAction(scope, recompile, domElement);
            };
        }

        if (mmsViewPresentationElemCtrl) {
            scope.delete = function() {
                Utils.deleteAction(scope,scope.bbApi,mmsViewPresentationElemCtrl.getParentSection());
            };
            scope.instanceSpec = mmsViewPresentationElemCtrl.getInstanceSpec();
            scope.instanceVal = mmsViewPresentationElemCtrl.getInstanceVal();
            scope.presentationElem = mmsViewPresentationElemCtrl.getPresentationElement();
        }
    };

    return {
        restrict: 'E',
        //templateUrl: template,
        scope: {
            mmsElementId: '@',
            mmsProjectId: '@',
            mmsRefId: '@',
            mmsCommitId: '@',
            nonEditable: '<',
            mmsCfLabel: '@',
            mmsGenerateForDiff: '<'
        },
        require: ['?^^view','?^^mmsViewPresentationElem'],
        controller: ['$scope', mmsTranscludeCtrl],
        link: mmsTranscludeValLink
    };
}
