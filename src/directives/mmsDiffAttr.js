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
 *
 * <mms-diff-attr mms-eid="element-id" mms-attr="name/doc/val" mms-ref-one="branch/tag" mms-ref-two="branch/tag"></mms-diff-attr>
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string} mmsAttr Attribute to use -  ie `name`, `doc` or `value`
 * @param {string} mmsProjectOneId Project for original data
 * @param {string} mmsProjectTwoId Project for comparisson data
 * @param {string=master} mmsRefOneId Ref to use, defaults to current ref or master
 * @param {string=master} mmsRefTwoId Ref to use, defaults to current ref or master
 * @param {string=latest} mmsCommitOneId  can be 'latest' or commit id, default is latest
 * @param {string=latest} mmsCommitTwoId  can be 'latest' or commit id, default is latest
 */
function mmsDiffAttr(ElementService, $compile, $rootScope, $interval) {

    var mmsDiffAttrLink = function(scope, element, attrs, mmsViewCtrl) {
        var projectOneId = scope.mmsProjectOneId;
        var projectTwoId = scope.mmsProjectTwoId;
        var elemOneId = scope.mmsEidOne;
        var elemTwoId = scope.mmsEidTwo;
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
        var deletedCommOrigin = false;

        if (mmsViewCtrl) {
            viewOrigin = mmsViewCtrl.getElementOrigin(); 
        } 
        if (!elemTwoId) {
            elemTwoId = elemOneId;
        }
        if (!projectOneId && viewOrigin) {
            projectOneId = viewOrigin.projectId;
        }
        if (!projectTwoId) {
            projectTwoId = projectOneId;
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
            elementId:  elemOneId, 
            refId:      refOneId, 
            commitId:   commitOneId
        }).then(function(data) {
            // element.prepend('<span class="text-info"> <br><b> Original data: </b> '+ data._projectId + '<br> -- refId: ' +  data._refId+ ' <br>-- commitId: ' +data._commitId+'</span>');
            var htmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._commitId, data._refId);
            $compile(htmlData)($rootScope.$new());
            scope.origElem = angular.element(htmlData).text();
            var promise1 = $interval(
                function() {
                    scope.origElem = angular.element(htmlData).text();
                }, 5000);
        }, function(reason) {
            // element.prepend('<span class="text-info"> <br>Error: <b> Original data: </b> '+ projectOneId + '<br> -- refId: ' +  refOneId+ ' <br>-- commitId: ' +commitOneId+'</span>');
            // origNotFound = true;
            // if(reason.status === 500) { 
            //     deletedOrigin = true;
            // } else if (reason.message.toLowerCase() == "not found") {
            //     scope.origElem = '';
            // } else {
            //     invalidOrig = true;
            // }

            origNotFound = true;
            if (reason.status === 500) { 
                deletedCommOrigin = true;
            } else if (reason.data.message && reason.data.message.toLowerCase().includes("deleted") === true) {
                deletedFlag = true;
            } else {
                scope.origElem = '';
                invalidOrig = true;
            }
            
        }).finally(function() {
            ElementService.getElement({
                projectId:  projectTwoId, 
                elementId:  elemTwoId, 
                refId:      refTwoId, 
                commitId:   commitTwoId
            }).then(function(data) {
                // element.prepend('<span class="text-info"> <b> Comparison data: </b> '+ data._projectId + '<br> -- refId: ' +  data._refId+ ' <br>-- commitId: ' +data._commitId+'</span>');
                var htmlData = createTransclude(data.id, scope.mmsAttr, data._projectId, data._commitId, data._refId);
                $compile(htmlData)($rootScope.$new());
                scope.compElem = angular.element(htmlData).text();
                var promise2 = $interval(
                    function() {
                        scope.compElem = angular.element(htmlData).text();
                    }, 5000);
                checkElement(origNotFound, compNotFound, deletedFlag); 
            }, function(reason) {
                // element.prepend('<span class="text-info"> <br>Error: <b> Comparison data: </b> '+ projectTwoId + '<br> -- refId: ' +  refTwoId+ ' <br>-- commitId: ' +commitTwoId+'</span>');
                // scope.compElem = '';
                // if (reason.data.message && reason.data.message.toLowerCase().includes("deleted") === true) {
                //     deletedFlag = true;
                // } else if (reason.message.toLowerCase() == "not found") {
                //     compNotFound = true;
                //     scope.compElem = '';
                // } else {
                //     compNotFound = true;
                //     invalidComp = true;
                // }

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
                        element.html('<span class="text-info"><i class="fa fa-info-circle"></i> Comparison element not found. Might be due to invalid input. </span>');
                    } 
                    // else if (deletedFlag === true) {
                    //     element.prepend('<span class="text-info"><i class="fa fa-info-circle"></i> This element has been deleted. </span>');
                    // }
                    break;
                default:
                    if (deletedCommOrigin === true) { //for 500 error on MMS tf
                        element.prepend('<span class="text-info"><i class="fa fa-info-circle"></i> This element has been deleted. </span>');
                    } else if (compNotFound === false) {
                        // if (scope.compElem === "") {
                        //     element.prepend('<span class="text-info"><i class="fa fa-info-circle"></i> This element is a new element with no content. </span>');
                        // } else {
                            element.prepend('<span class="text-info"><i class="fa fa-info-circle"></i> This element is a new element. </span>');
                        // }
                    } else if (compNotFound === true) {
                        element.html('<span class="mms-error"><i class="fa fa-info-circle"></i> Invalid Project, Branch/Tag, Commit, or Element IDs. Check entries.</span>');
                    }
            }

            if(deletedFlag === true) {
                element.html('<span class="text-info"><i class="fa fa-info-circle"></i> This element has been deleted. </span>');
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
            mmsEidOne: '@',
            mmsEidTwo: '@',
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
