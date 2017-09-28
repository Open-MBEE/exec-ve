'use strict';

angular.module('mms.directives')
.directive('mmsDiffAttr', ['ElementService', '$compile', '$rootScope', '$interval', mmsDiffAttr]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsDiffAttr
 *
 * @requires mms.ElementService
 * @requires $compile
 * @requires $rootScope
 * @requires $interval
 *
 * @restrict E
 *
 * @description
 *  Compares a element at two different refs/commits and generates a pretty diff.
 * ## Example
 * <mms-diff-attr mms-base-element-id="" (mms-compare-element-id="") mms-attr="name|doc|val"
 * (mms-base-project-id="" mms-compare-project-id="" mms-base-ref-id="" mms-compare-ref-id=""
 * mms-base-commit-id="" mms-compare-commit-id="")></mms-diff-attr>
 *
 * @param {string} mmsBaseElementId The id of the element to do comparison of
 * @param {string} mmsAttr Attribute to use -  ie `name`, `doc` or `value`
 * @param {string} mmsBaseProjectId Base project ID for original/base element
 * @param {string} mmsCompareProjectId Compare project ID for compare element
 * @param {string=master} mmsBaseRefId Base ref ID or master, defaults to current ref or master
 * @param {string=master} mmsCompareRefId Compare ref ID or master, defaults to current ref or master
 * @param {string=latest} mmsBaseCommitId Base commit id, default is latest
 * @param {string=latest} mmsCompareCommitId Compare commit id, default is latest
 */
function mmsDiffAttr(ElementService, $compile, $rootScope, $interval) {

    var mmsDiffAttrLink = function(scope, element, attrs, mmsViewCtrl) {
        var ran = false;
        var viewOrigin;
        if (mmsViewCtrl) {
            viewOrigin = mmsViewCtrl.getElementOrigin(); 
        } 
        scope.options = {
            editCost: 4
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsDiffAttr#changeElement
         * @methodOf mms.directives.directive:mmsDiffAttr
         *
         * @description
         * Change scope for diff when there is a change in commit id
         */
        var changeElement = function(newVal, oldVal) {
            if (!newVal || (newVal == oldVal && ran)) {
                return;
            }

            var baseElementId = scope.mmsBaseElementId;
            var compareElementId = scope.mmsCompareElementId;
            var baseProjectId = scope.mmsBaseProjectId;
            var compareProjectId = scope.mmsCompareProjectId;
            var baseRefId = scope.mmsBaseRefId;
            var compareRefId = scope.mmsCompareRefId;
            var baseCommitId = scope.mmsBaseCommitId;
            var compareCommitId = scope.mmsCompareCommitId;

            var invalidOrig = false;
            var invalidComp = false;
            var origNotFound = false;
            var compNotFound = false;
            var deletedFlag = false;


            if (!compareElementId) {
                compareElementId = baseElementId;
            }
            if (!baseProjectId && viewOrigin) {
                baseProjectId = viewOrigin.projectId;
            } else {
                // return
            }
            if (!compareProjectId) {
                compareProjectId = baseProjectId;
            }
            if (!baseRefId && viewOrigin) {
                baseRefId = viewOrigin.refId;
            } else if (!baseRefId && !viewOrigin) {
                baseRefId = 'master';
            }
            if (!compareRefId && viewOrigin) {
                compareRefId = viewOrigin.refId;
            } else if (!compareRefId && viewOrigin) {
                compareRefId = 'master';
            }
            if (baseCommitId === compareCommitId) {
                element.html('<span class="text-info"><i class="fa fa-info-circle"></i> You have selected the same commit ID. No changes.</span>');
                return;
            }

        ElementService.getElement({
            projectId:  baseProjectId,
            elementId:  baseElementId,
            refId:      baseRefId,
            commitId:   baseCommitId
        }).then(function(data) {
            // element.prepend('<span class="text-info"> <br><b> Original data: </b> '+ data._projectId + '<br> -- refId: ' +  data._refId+ ' <br>-- commitId: ' +data._commitId+'</span>');
            scope.element = data;
            var htmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._commitId, data._refId);
            $compile(htmlData)($rootScope.$new());
            scope.origElem = angular.element(htmlData).text();
            var promise1 = $interval(
                function() {
                    scope.origElem = angular.element(htmlData).text();
                    if ( !scope.origElem.includes("(loading...)") && angular.isDefined(promise1) ) {
                        $interval.cancel(promise1);
                        promise1 = undefined;
                    }
                }, 50);
        }, function(reason) {
            // element.prepend('<span class="text-info"> <br>Error: <b> Original data: </b> '+ baseProjectId + '<br> -- refId: ' +  baseRefId+ ' <br>-- commitId: ' +baseCommitId+'</span>');
            origNotFound = true;
            if (reason.data.message && reason.data.message.toLowerCase().includes("deleted") === true) {
                deletedFlag = true;
            } else {
                scope.origElem = '';
                invalidOrig = true;
            }
        }).finally(function() {
            ElementService.getElement({
                projectId:  compareProjectId,
                elementId:  compareElementId,
                refId:      compareRefId,
                commitId:   compareCommitId
            }).then(function(data) {
                // element.prepend('<span class="text-info"> <b> Comparison data: </b> '+ data._projectId + '<br> -- refId: ' +  data._refId+ ' <br>-- commitId: ' +data._commitId+'</span>');
                var htmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._commitId, data._refId);
                $compile(htmlData)($rootScope.$new());
                scope.compElem = angular.element(htmlData).text();
                var promise2 = $interval(
                    function() {
                        scope.compElem = angular.element(htmlData).text();
                        if ( !scope.compElem.includes("(loading...)") && angular.isDefined(promise2) ) {
                            $interval.cancel(promise2);
                            promise2 = undefined;
                        }
                    }, 50);
                checkElement(origNotFound, compNotFound, deletedFlag); 
            }, function(reason) {
                // element.prepend('<span class="text-info"> <br>Error: <b> Comparison data: </b> '+ compareProjectId + '<br> -- refId: ' +  compareRefId+ ' <br>-- commitId: ' +compareCommitId+'</span>');
                if (reason.data.message && reason.data.message.toLowerCase().includes("deleted") === true) {
                    deletedFlag = true;
                } else {
                    compNotFound = true;
                    scope.compElem = '';
                    invalidComp = true;
                }
                checkElement(origNotFound, compNotFound, deletedFlag); 
                checkValidity(invalidOrig, invalidComp);
            });
        });
    };

        var createTransclude = function(elementId, type, projectId, commitId, refId) {
            var transcludeElm = angular.element('<mms-cf>');
            transcludeElm.attr("mms-cf-type", type);
            transcludeElm.attr("mms-element-id", elementId);
            transcludeElm.attr("mms-project-id", projectId);
            transcludeElm.attr("mms-commit-id", commitId);
            transcludeElm.attr("mms-ref-id", refId);
            return transcludeElm;
        };

        var checkElement = function(origNotFound, compNotFound, deletedFlag) {
            switch (origNotFound) {
                case false:
                    if (compNotFound === true) {
                        element.html('<span class="text-info"><i class="fa fa-info-circle"></i> Comparison element not found. Might be due to invalid input. </span>');
                    } 
                    break;
                default:
                    if (compNotFound === false) {
                        element.prepend('<span class="text-info"><i class="fa fa-info-circle"></i> This element is a new element. </span>');
                    } else if (compNotFound === true) {
                        element.html('<span class="mms-error"><i class="fa fa-info-circle"></i> Invalid Project, Branch/Tag, Commit, or Element IDs. Check entries.</span>');
                    }
            }
            if (deletedFlag === true) {
                element.html('<span class="text-info"><i class="fa fa-info-circle"></i> This element has been deleted. </span>');
            }
        };

        var checkValidity = function(invalidOrig, invalidComp) {
            if (invalidOrig && invalidComp) {
                element.html('<span class="mms-error"><i class="fa fa-info-circle"></i> Invalid Project, Branch/Tag, Commit, or Element IDs. Check entries.</span>');
            }
        };

        scope.changeElement = changeElement;
        scope.$watch('mmsBaseCommitId', changeElement);
        scope.$watch('mmsCompareCommitId', changeElement);
    };

    return {
        restrict: 'E',
        scope: {
            mmsBaseElementId: '@',
            mmsCompareElementId: '@',
            mmsAttr: '@',
            mmsBaseProjectId: '@',
            mmsCompareProjectId: '@',
            mmsBaseRefId: '@',
            mmsCompareRefId: '@',
            mmsBaseCommitId: '@',
            mmsCompareCommitId: '@'
        },
        template: '<style>del, .del{color: black;background: #ffe3e3;text-decoration: line-through;}' +
            'ins, .ins{color: black;background: #dafde0;}' +
            '.match,.textdiff span {color: gray;}</style>'+
            '<div ng-if="element.type != \'Property\' && element.type != \'Port\' && element.type != \'Slot\'" class="textdiff" processing-diff options="options" left-obj="origElem" right-obj="compElem"></div>'+
            '<div ng-if="element.type === \'Property\' || element.type === \'Port\' || element.type === \'Slot\'"class="textdiff" line-diff options="options" left-obj="origElem" right-obj="compElem"></div>',
        require: '?^^mmsView',
        link: mmsDiffAttrLink
    };
}
