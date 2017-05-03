'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('FullDocCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$window', '$element', 'hotkeys', 'growl',
    'MmsAppUtils', 'UxService', 'search', '_', 'documentOb', 'projectOb', 'refOb',
function($scope, $rootScope, $state, $stateParams, $window, $element, hotkeys, growl,
    MmsAppUtils, UxService, search, _, documentOb, projectOb, refOb) {
    
    $rootScope.ve_fullDocMode = true;

    function isPageLoading() {
        if ($element.find('.isLoading').length > 0) {
            growl.warning("Still loading!");
            return true;
        }
        return false;
    }
    if (!$rootScope.veCommentsOn)
        $rootScope.veCommentsOn = false;
    if (!$rootScope.veElementsOn)
        $rootScope.veElementsOn = false;
    if (!$rootScope.ve_editmode)
        $rootScope.ve_editmode = false;

    $scope.search = search;
    $scope.buttons = [];
    $scope.refOb = refOb;
    $scope.projectOb = projectOb;
    $scope.latestElement = '';
    //build array of views in doc
    var elementTranscluded = function(elementOb, type) {
        if (elementOb && type !== 'Comment') {
            if (elementOb._modified > $scope.latestElement)
                $scope.latestElement = elementOb._modified;
        }
    };
    var elementClicked = function(elementOb) {
        $rootScope.$broadcast('elementSelected', elementOb, 'latest');
    };

    var views = [];
    views.push({id: documentOb.id, api: {
        init: function(dis) {
            if ($rootScope.veCommentsOn) {
                dis.toggleShowComments();
            }
            if ($rootScope.veElementsOn) {
                dis.toggleShowElements();
            }
            if ($rootScope.ve_editmode) {
                dis.toggleShowEdits();
            }
        },
        elementTranscluded: elementTranscluded,
        elementClicked: elementClicked
    }});
    var view2children = {};
    var buildViewElt = function(vId, curSec) {
      return {id: vId, api: {
            init: function(dis) {
                if ($rootScope.veCommentsOn) {
                    dis.toggleShowComments();
                }
                if ($rootScope.veElementsOn) {
                    dis.toggleShowElements();
                }
                if ($rootScope.ve_editmode) {
                    dis.toggleShowEdits();
                }
            },
            elementTranscluded: elementTranscluded,
            elementClicked: elementClicked
        }, number: curSec, topLevel: (curSec ? (curSec.toString().indexOf('.') === -1 && curSec !== 1) : false)};
    };

    var addToArray = function(viewId, curSection) {
        views.push(buildViewElt(viewId, curSection));

        if (view2children[viewId]) {
            var num = 1;
            for (var i = 0; i < view2children[viewId].length; i++) {
                addToArray(view2children[viewId][i], curSection + '.' + num);
                num = num + 1;
            }
        }
    };
    var num = 1;

    var seenViewIds = {};
    function handleSingleView(v, aggr) {
        var childIds = view2children[v.id];
        if (!childIds) {
            childIds = [];
        }
        view2children[v.id] = childIds;
        if (!v._childViews || v._childViews.length === 0 || aggr === 'none') {
            return childIds;
        }
        for (var i = 0; i < v._childViews.length; i++) {
            if (seenViewIds[v._childViews[i].id]) {
                continue;
            }
            seenViewIds[v._childViews[i].id] = true;
            childIds.push(v._childViews[i].id);
        }
        return childIds;
    }

    function handleChildren(childIds, childNodes) {
        return childIds;
    }

    view2children[documentOb.id] = [];
    if (!documentOb._childViews) {
        documentOb._childViews = [];
    }
    MmsAppUtils.handleChildViews(documentOb, 'composite', projectOb.id, refOb.id, handleSingleView, handleChildren)
    .then(function(childIds) {
        for (var i = 0; i < childIds.length; i++) {
            addToArray(childIds[i], num);
            num = num + 1;
        }
    });
    $scope.views = views;

    $scope.$on('newViewAdded', function(event, vId, curSec, prevSibId) {
        var sibIndex = _.findIndex(views, {id: prevSibId});
        views.splice(sibIndex+1, 0, buildViewElt(vId, curSec) );
    });
    
    $scope.bbApi = {
        init: function() {
            if (documentOb && documentOb._editable && refOb.type === 'Branch') {
                $scope.bbApi.addButton(UxService.getButtonBarButton('show-edits'));
                $scope.bbApi.setToggleState('show-edits', $rootScope.ve_editmode);
                hotkeys.bindTo($scope)
                .add({
                    combo: 'alt+d',
                    description: 'toggle edit mode',
                    callback: function() {$scope.$broadcast('show-edits');}
                });
            }

            $scope.bbApi.addButton(UxService.getButtonBarButton('show-comments'));
            $scope.bbApi.setToggleState('show-comments', $rootScope.veCommentsOn);
            $scope.bbApi.addButton(UxService.getButtonBarButton('print'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('convert-pdf'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('word'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('tabletocsv'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('show-elements'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('refresh-numbering'));
            $scope.bbApi.setToggleState('show-elements', $rootScope.veElementsOn);
            hotkeys.bindTo($scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: function() {$scope.$broadcast('show-comments');}
            }).add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: function() {$scope.$broadcast('show-elements');}
            });
        }
    };

    $scope.$on('section-add-paragraph', function(event, sectionOb) {
        MmsAppUtils.addPresentationElement($scope, 'Paragraph', sectionOb);
    });

    $scope.$on('section-add-list', function(event, sectionOb) {
        MmsAppUtils.addPresentationElement($scope, 'List', sectionOb);
    });

    $scope.$on('section-add-table', function(event, sectionOb) {
        MmsAppUtils.addPresentationElement($scope, 'Table', sectionOb);
    });

    $scope.$on('section-add-equation', function(event, sectionOb) {
        MmsAppUtils.addPresentationElement($scope, 'Equation', sectionOb);
    });

    $scope.$on('section-add-section', function(event, sectionOb) {
        MmsAppUtils.addPresentationElement($scope, 'Section', sectionOb);
    });

    $scope.$on('section-add-comment', function(event, sectionOb) {
        MmsAppUtils.addPresentationElement($scope, 'Comment', sectionOb);
    });

    $scope.$on('section-add-image', function(event, sectionOb) {
        MmsAppUtils.addPresentationElement($scope, 'Image', sectionOb);
    });

    $scope.$on('show-comments', function() {
        for (var i = 0; i < $scope.views.length; i++) {
            $scope.views[i].api.toggleShowComments();
        }
        $scope.bbApi.toggleButtonState('show-comments');
        $rootScope.veCommentsOn = !$rootScope.veCommentsOn;
    });

    $scope.$on('show-elements', function() {
        for (var i = 0; i < $scope.views.length; i++) {
            $scope.views[i].api.toggleShowElements();
        }
        $scope.bbApi.toggleButtonState('show-elements');
        $rootScope.veElementsOn = !$rootScope.veElementsOn;
    });

    $scope.$on('show-edits', function() {
        var i = 0;
        if (($rootScope.veElementsOn && $rootScope.ve_editmode) || (!$rootScope.veElementsOn && !$rootScope.ve_editmode) ){
            for (i = 0; i < $scope.views.length; i++) {
                $scope.views[i].api.toggleShowElements();
            }
            $scope.bbApi.toggleButtonState('show-elements');
            $rootScope.veElementsOn = !$rootScope.veElementsOn;
        }
        $scope.bbApi.toggleButtonState('show-edits');
        $rootScope.ve_editmode = !$rootScope.ve_editmode;
        for (i = 0; i < $scope.views.length; i++) {
            $scope.views[i].api.toggleShowEdits();
        }
    });

    $scope.searchOptions = {
        emptyDocTxt: 'This field is empty.',
        searchInput: search,
        getProperties: true,
        callback: function(elementOb) {
            $rootScope.$broadcast('elementSelected', elementOb, 'latest');
            if ($rootScope.ve_togglePane && $rootScope.ve_togglePane.closed)
                $rootScope.ve_togglePane.toggle();
        },
        relatedCallback: function (doc, view, elem) {//siteId, documentId, viewId) {
            $state.go('project.ref.document.view', {projectId: doc._projectId, documentId: doc.id, viewId: view.id, refId: doc._refId, search: undefined});
        }
    };

    var converting = false;
    $scope.$on('convert-pdf', function() {
        if (isPageLoading())
            return;
        if (converting) {
            growl.info("Please wait...");
            return;
        }
        converting = true;
        $scope.bbApi.toggleButtonSpinner('convert-pdf');
        MmsAppUtils.printModal(documentOb, refOb, true, 3)
        .then(function(ob) {
            growl.info('Converting HTML to PDF...Please wait for a completion email.',{ttl: -1});
        }, function(reason){
            growl.error("Failed to convert HTML to PDF: " + reason.message);
        }).finally(function() {
            converting = false;
            $scope.bbApi.toggleButtonSpinner('convert-pdf');
        });
    });

    $scope.$on('print', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(documentOb, refOb, true, 1);
    });

    $scope.$on('word', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.printModal(documentOb, refOb, true, 2);
    });

    $scope.$on('tabletocsv', function() {
        if (isPageLoading())
            return;
        MmsAppUtils.tableToCsv(true);
    });

    $scope.$on('refresh-numbering', function() {
        if (isPageLoading())
            return;
        var printElementCopy = angular.element("#print-div");
        MmsAppUtils.refreshNumbering($rootScope.ve_treeApi.get_rows(), printElementCopy);
    });
}]);

