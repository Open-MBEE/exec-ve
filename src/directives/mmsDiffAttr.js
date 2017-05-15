'use strict';

angular.module('mms.directives')
.directive('mmsDiffAttr', ['ProjectService', 'ElementService', 'URLService','$q', '$compile', '$rootScope', '$interval', mmsDiffAttr]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsDiffAttr
 *
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 *  Compares a element at two different times and generates a pretty diff.
 * ## Example
 *
 * <mms-diff-attr mms-eid="element-id" mms-attr="name/doc/val" mms-version-one="timestamp/latest/tag?" mms-version-two="timestamp/latest/tag?"></mms-diff-attr>
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsAttr Attribute to use, ie name, doc, value
 * @param {string=master} mmsWsOne Workspace to use, defaults to current ws or master
 * @param {string=master} mmsWsTwo Workspace to use, defaults to current ws or master
 * @param {string=latest} mmsVersionOne  can be 'latest', timestamp or tag id, default is latest
 * @param {string=latest} mmsVersionTwo  can be 'latest', timestamp or tag id, default is latest
 */
function mmsDiffAttr(ProjectService, ElementService, URLService, $q, $compile, $rootScope, $interval) {

    var mmsDiffAttrLink = function(scope, element, attrs, mmsViewCtrl) {
        // TODO: error checking for missing elements -- util function for http error??
        var projectOneId = scope.mmsProjectOneId;
        var projectTwoId = scope.mmsProjectTwoId;
        var refOneId = scope.mmsRefOneId;
        var refTwoId = scope.mmsRefTwoId;
        var commitOneId = scope.mmsCommitOneId;
        var commitTwoId = scope.mmsCommitTwoId;
        var viewOrigin = null;

        var invalidOrig = false;
        var invalidComp = false;
        var origNotFound = false;
        var compNotFound = false;
        var deletedFlag = false;

        if (mmsViewCtrl) {
            viewOrigin = mmsViewCtrl.getElementOrigin(); 
        } 
        if (!projectOneId && viewOrigin) {
            projectOneId = viewOrigin.projectId;
        }
        if (!projectTwoId && viewOrigin) {
            projectTwoId = viewOrigin.projectId;
        }
        if (!refOneId && viewOrigin) {
            refOneId = viewOrigin.refId;
        } else if (!refOneId && !viewOrigin) {
            refOneId = 'master';
        }
        if (!refTwoId && viewOrigin) {
            refTwoId = viewOrigin.refId;
        } else if (!refTwoId && !viewOrigin) {
            refTwoId = 'master';
        }

        ElementService.getElement({
            projectId:  projectOneId,
            elementId:  scope.mmsEid, 
            refId:      refOneId, 
            commitId:   commitOneId
        }).then(function(data) {
            var htmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._commitId, data._refId);
            $compile(htmlData)($rootScope.$new());
            scope.origElem = angular.element(htmlData).text();
            var promise1 = $interval(
                function() {
                    scope.origElem = angular.element(htmlData).text();
                }, 5000);
        }, function(reason) {
            // scope.origElem = '';
            origNotFound = true;
            if (reason.message.toLowerCase() == "not found") {
                scope.origElem = '';
            } else {
                invalidOrig = true;
            }
        }).then(function() {
                ElementService.getElement({
                projectId:  projectTwoId, 
                elementId:  scope.mmsEid, 
                refId:      refTwoId, 
                commitId:   commitTwoId
            }).then(function(data) { 
                var htmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._commitId, data._refId);
                $compile(htmlData)($rootScope.$new());
                scope.compElem = angular.element(htmlData).text();
                var promise2 = $interval(
                    function() {
                        scope.compElem = angular.element(htmlData).text();
                    }, 5000);
                    checkElement(origNotFound, compNotFound, deletedFlag);
            }, function(reason) {
                // scope.compElem = '';
                if (reason.message.toLowerCase() == "not found") {
                    compNotFound = true;
                    scope.compElem = '';
                } else if (reason.message.toLowerCase() == "deleted") {
                    deletedFlag = true;
                } else {
                    compNotFound = true;
                    invalidComp = true;
                }
                checkElement(origNotFound, compNotFound, deletedFlag);
                checkValidity(invalidOrig, invalidComp);
            });
        });

        var createTransclude = function(elementId, type, projectId, commitId, refId) {
            var transcludeElm = angular.element('<mms-transclude-'+ type +'>');
            transcludeElm.attr("mms-eid", elementId);
            transcludeElm.attr("mms-project-id", projectId);
            transcludeElm.attr("mms-commit-id", commitId);
            transcludeElm.attr("mms-ref-id", refId);
            return transcludeElm;
        };

        var checkElement = function(origNotFound, compNotFound, deletedFlag) {
            switch (origNotFound) {
                case false:
                    if (compNotFound === true) {
                        element.html('<span class="text-info"><i class="fa fa-info-circle"></i> This element has been removed from the View. </span>');
                    } else if (deletedFlag === true) {
                        element.prepend('<span class="text-info"><i class="fa fa-info-circle"></i> This element has been deleted: </span>');
                    }
                    break;
                default:
                    if (compNotFound === false) {
                        if (scope.compElem === "") {
                            element.html('<span class="text-info"><i class="fa fa-info-circle"></i> This element is a new element with no content. </span>');
                        } else {
                            element.prepend('<span class="text-info"><i class="fa fa-info-circle"></i> This element is a new element: </span>');
                        }
                    } else if (compNotFound === true) {
                        element.html('<span class="mms-error"><i class="fa fa-info-circle"></i> Invalid Project, Branch/Tag, Commit, or Element IDs. Check entries.</span>');
                    }
            }
        };

        var checkValidity = function(invalidOrig, invalidComp) {
            if (invalidOrig && invalidComp) {
                element.html('<span class="mms-error"><i class="fa fa-info-circle"></i> Invalid Project, Branch/Tag, Commit, or Element IDs. Check entries.</span>');
            }
        };
    };

    return {
        restrict: 'E',
        scope: {
            mmsEid: '@',
            mmsAttr: '@',
            mmsProjectOneId: '@',
            mmsProjectTwoId: '@',
            mmsRefOneId: '@',
            mmsRefTwoId: '@',
            mmsCommitOneId: '@',
            mmsCommitTwoId: '@'
        },
        template: '<style>del{color: black;background: #ffbbbb;} ins{color: black;background: #bbffbb;} .match,.textdiff span {color: gray;}</style><div class="textdiff" semantic-diff left-obj="origElem" right-obj="compElem" ></div>',
        require: '?^^mmsView',
        link: mmsDiffAttrLink
    };
}
