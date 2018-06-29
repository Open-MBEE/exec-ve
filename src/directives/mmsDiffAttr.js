'use strict';

angular.module('mms.directives')
.directive('mmsDiffAttr', ['ElementService', '$compile', '$rootScope', '$interval', '$templateCache', mmsDiffAttr]);

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
 * @param {string=master} mmsCompareRefId Compare ref ID or master, defaults to base ref ID
 * @param {string=latest} mmsBaseCommitId Base commit id, default is latest
 * @param {string=latest} mmsCompareCommitId Compare commit id, default is latest
 */
function mmsDiffAttr(ElementService, $compile, $rootScope, $interval, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsDiffAttr.html');

    var mmsDiffAttrLink = function(scope, element, attrs, mmsViewCtrl) {
        var ran = false;
        var viewOrigin;
        var baseNotFound = false;
        var compNotFound = false;
        var baseDeleted = false;
        var compDeleted = false;
        if (mmsViewCtrl) {
            viewOrigin = mmsViewCtrl.getElementOrigin();
        }
        scope.options = {
            editCost: 8
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

            scope.message = '';
            scope.origElem = '';
            scope.compElem = '';
            scope.diffLoading = true;
            var baseElementId = scope.mmsBaseElementId;
            var compareElementId = scope.mmsCompareElementId;
            var baseProjectId = scope.mmsBaseProjectId;
            var compareProjectId = scope.mmsCompareProjectId;
            var baseRefId = scope.mmsBaseRefId;
            var compareRefId = scope.mmsCompareRefId;
            var baseCommitId = scope.mmsBaseCommitId;
            var compareCommitId = scope.mmsCompareCommitId;

            baseNotFound = false;
            compNotFound = false;
            baseDeleted = false;
            compDeleted = false;

            if (!compareElementId) {
                compareElementId = baseElementId;
            }
            if (!baseProjectId && viewOrigin) {
                baseProjectId = viewOrigin.projectId;
            // } else {
            //     // return
            }
            if (!compareProjectId) {
                compareProjectId = baseProjectId;
            }
            if (!baseRefId && viewOrigin) {
                baseRefId = viewOrigin.refId;
            } else if (!baseRefId && !viewOrigin) {
                baseRefId = 'master';
            }
            if (!compareRefId) {
                compareRefId = baseRefId;
            }
            if (!baseCommitId) {
                baseCommitId = 'latest';
            }
            if (!compareCommitId) {
                compareCommitId = 'latest';
            }
            if (baseCommitId === compareCommitId) {
                scope.message = ' Comparing same version.';
                scope.diffLoading = false;
                return;
            }

            ElementService.getElement({
                projectId:  baseProjectId,
                elementId:  baseElementId,
                refId:      baseRefId,
                commitId:   baseCommitId
            }).then(function(data) {
                scope.element = data;
                var htmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._refId, data._commitId);
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
                if (reason.data.message && reason.data.message.toLowerCase().includes("deleted")) {
                    baseDeleted = true;
                } else {
                    scope.origElem = '';
                    baseNotFound = true;
                    // invalidOrig = true;
                }
            }).finally(function() {
                ElementService.getElement({
                    projectId:  compareProjectId,
                    elementId:  compareElementId,
                    refId:      compareRefId,
                    commitId:   compareCommitId
                }).then(function(data) {
                    var comphtmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._refId, data._commitId);
                    $compile(comphtmlData)($rootScope.$new());
                    scope.compElem = angular.element(comphtmlData).text();
                    var promise2 = $interval(
                        function() {
                            scope.compElem = angular.element(comphtmlData).text();
                            if ( !scope.compElem.includes("(loading...)") && angular.isDefined(promise2) ) {
                                $interval.cancel(promise2);
                                promise2 = undefined;
                            }
                        }, 50);
                    checkElement(baseNotFound, compNotFound);
                }, function(reason) {
                    if (reason.data.message && reason.data.message.toLowerCase().includes("deleted") === true) {
                        compDeleted = true;
                    } else {
                        compNotFound = true;
                        scope.compElem = '';
                        // invalidComp = true;
                    }
                    checkElement(baseNotFound, compNotFound);
                    // checkValidity(invalidOrig, invalidComp);
                }).finally(function() {
                    scope.diffLoading = false;
                });
            });
        };

        var createTransclude = function(elementId, type, projectId, refId, commitId) {
            var transcludeElm = angular.element('<mms-cf>');
            transcludeElm.attr("mms-cf-type", type);
            transcludeElm.attr("mms-element-id", elementId);
            transcludeElm.attr("mms-project-id", projectId);
            transcludeElm.attr("mms-ref-id", refId);
            transcludeElm.attr("mms-commit-id", commitId);
            return transcludeElm;
        };

        var checkElement = function(baseNotFound, compNotFound) {
            if (baseNotFound && compNotFound) {
                scope.message = ' Both base and compare elements do not exist.';
            } else if (baseNotFound) {
                scope.message = ' This is a new element.';
            } else if (compNotFound) {
                scope.message = ' Comparison element does not exist.';
            }
            if (baseDeleted && compDeleted) {
                scope.message = ' This element has been deleted.';
            } else if (baseDeleted){
                scope.message = ' Base element has been deleted.';
            } else if (compDeleted){
                scope.message = ' Comparison element has been deleted.';
            }
        };

        // var checkValidity = function(invalidOrig, invalidComp) {
        //     if (invalidOrig && invalidComp) {
        //         scope.message = '<span class="mms-error"><i class="fa fa-info-circle"></i> Invalid Project, Branch/Tag, Commit, or Element IDs. Check entries.');
        //     }
        // };

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
        template: template,
        require: '?^^mmsView',
        link: mmsDiffAttrLink
    };
}
