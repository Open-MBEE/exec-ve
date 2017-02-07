'use strict';

/* Controllers */

angular.module('mmsApp')

.controller('FullDocCtrl', ['$scope', '$templateCache', '$compile', '$timeout', '$rootScope', '$state', '$stateParams', '$window', 'MmsAppUtils', 'document', 'workspace', 'site', 'snapshot', 'time', 'tag', 'ConfigService', 'UxService', 'ViewService', 'UtilsService', 'ElementService', '$q', 'growl', 'hotkeys', 'search', '_', '$element',
function($scope, $templateCache, $compile, $timeout, $rootScope, $state, $stateParams, $window, MmsAppUtils, document, workspace, site, snapshot, time, tag, ConfigService, UxService, ViewService, UtilsService, ElementService, $q, growl, hotkeys, search, _, $element) {

    $scope.ws = $stateParams.workspace;
    $scope.site = site;
    $scope.search = search;
    $scope.latestElement = "";

    function searchLoading(){
        // or from center pane
        if ($element.find('.isLoading').length > 0) {
            growl.warning("Still loading!");
            return true;
        }
        return false;
    }

    var views = [];
    if (!$rootScope.veCommentsOn)
        $rootScope.veCommentsOn = false;
    if (!$rootScope.veElementsOn)
        $rootScope.veElementsOn = false;
    if (!$rootScope.mms_ShowEdits)
        $rootScope.mms_ShowEdits = false;
    $scope.buttons = [];
    views.push({id: document.sysmlid, api: {
        init: function(dis) {
            if ($rootScope.veCommentsOn) {
                dis.toggleShowComments();
            }
            if ($rootScope.veElementsOn) {
                dis.toggleShowElements();
            }
            if ($rootScope.mms_ShowEdits && time === 'latest') {
                dis.toggleShowEdits();
            }
        }
    }});
    var view2view = document.specialization.view2view;
    var view2children = {};
    ViewService.setCurrentView(document);
    var buildViewElt = function(vId, curSec) {
      return {id: vId, api: {
            init: function(dis) {
                if ($rootScope.veCommentsOn) {
                    dis.toggleShowComments();
                }
                if ($rootScope.veElementsOn) {
                    dis.toggleShowElements();
                }
                if ($rootScope.mms_ShowEdits && time === 'latest') {
                    dis.toggleShowEdits();
                }
            }
        }, number: curSec, topLevel: (curSec ? (curSec.toString().indexOf('.') === -1 && curSec !== 1) : false)};
    };

    $scope.findLatestElement = function(elem, type) {
        if (elem) {
            if (elem.modified > $scope.latestElement)
                $scope.latestElement = elem.modified;
        }
    };

    var addToArray = function(viewId, curSection) {

        views.push( buildViewElt(viewId, curSection) );
        if (view2children[viewId]) {
            var num = 1;
            view2children[viewId].forEach(function(cid) {
                addToArray(cid, curSection + '.' + num);
                num = num + 1;
            });
        }
    };
    var num = 1;

    var seenViewIds = {};
    function handleSingleView(v, aggr) {
        var childIds = view2children[v.sysmlid];
        if (!childIds)
            childIds = [];
        view2children[v.sysmlid] = childIds;
        if (!v.specialization.childViews || v.specialization.childViews.length === 0 || aggr === 'NONE') {
            return childIds;
        }
        for (var i = 0; i < v.specialization.childViews.length; i++) {
            if (seenViewIds[v.specialization.childViews[i].id])
                continue;
            seenViewIds[v.specialization.childViews[i].id] = true;
            childIds.push(v.specialization.childViews[i].id);
        }
        return childIds;
    }

    function handleChildren(childIds, childNodes) {
        return childIds;
    }

  if (view2view && view2view.length > 0) {
    view2view.forEach(function(view) {
        view2children[view.id] = view.childrenViews;
    });

    view2children[document.sysmlid].forEach(function(cid) {
        addToArray(cid, num);
        num = num + 1;
    });
  } else {
    view2children[document.sysmlid] = [];
    if (!document.specialization.childViews)
        document.specialization.childViews = [];
    MmsAppUtils.handleChildViews(document, 'COMPOSITE', $scope.ws, time, handleSingleView, handleChildren)
    .then(function(childIds) {
        for (var i = 0; i < childIds.length; i++) {
            addToArray(childIds[i], num);
            num = num + 1;
        }
    });
  }
    $scope.version = time;
    $scope.views = views;
    $scope.tscClicked = function(elementId, ws, version) {
        $rootScope.$broadcast('elementSelected', elementId, 'element', ws, version);
    };

    $scope.$on('newViewAdded', function(event, vId, curSec, prevSibId) {
        var sibIndex = _.findIndex(views, {id: prevSibId});
        views.splice(sibIndex+1, 0, buildViewElt(vId, curSec) );
    });

    $scope.bbApi = {};
    $scope.bbApi.init = function() {

        if (document && document.editable && time === 'latest') {
            $scope.bbApi.addButton(UxService.getButtonBarButton('show-edits'));
            $scope.bbApi.setToggleState('show-edits', $rootScope.mms_ShowEdits);
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
    };

    var converting = false;
    $scope.$on('convert-pdf', function() {
        if (searchLoading())
            return;
        if (converting) {
            growl.info("Please wait...");
            return;
        }
        converting = true;
        $scope.bbApi.toggleButtonSpinner('convert-pdf');
        MmsAppUtils.printModal(document, $scope.ws, site, time, tag, true, 3)
        .then(function(ob) {
            growl.info('Converting HTML to PDF...Please wait for a completion email.',{ttl: -1});
        }, function(reason){
            growl.error("Failed to convert HTML to PDF: " + reason.message);
        }).finally(function() {
            converting = false;
            $scope.bbApi.toggleButtonSpinner('convert-pdf');
        });
    });

    $scope.$on('show-comments', function() {
        $scope.views.forEach(function(view) {
            view.api.toggleShowComments();
        });
        $scope.bbApi.toggleButtonState('show-comments');
        $rootScope.veCommentsOn = !$rootScope.veCommentsOn;
    });

    $scope.$on('show-elements', function() {
        $scope.views.forEach(function(view) {
            view.api.toggleShowElements();
        });
        $scope.bbApi.toggleButtonState('show-elements');
        $rootScope.veElementsOn = !$rootScope.veElementsOn;
    });

    $scope.$on('show-edits', function() {
        if( ($rootScope.veElementsOn && $rootScope.mms_ShowEdits) || (!$rootScope.veElementsOn && !$rootScope.mms_ShowEdits) ){
            $scope.views.forEach(function(view) {
                view.api.toggleShowElements();
            });
            $scope.bbApi.toggleButtonState('show-elements');
            $rootScope.veElementsOn = !$rootScope.veElementsOn;
        }
        $scope.views.forEach(function(view) {
            view.api.toggleShowEdits();
        });
        $scope.bbApi.toggleButtonState('show-edits');
        $rootScope.mms_ShowEdits = !$rootScope.mms_ShowEdits;
    });
    $rootScope.mms_fullDocMode = true;

    $scope.$on('section-add-paragraph', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Paragraph', section);
    });

    $scope.$on('section-add-section', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Section', section);
    });

    $scope.$on('print', function() {
        if (searchLoading())
            return;
        MmsAppUtils.printModal(document, $scope.ws, site, time, tag, true, 1);
    });
    $scope.$on('word', function() {
        if (searchLoading())
            return;
        MmsAppUtils.printModal(document, $scope.ws, site, time, tag, true, 2);
    });
    $scope.$on('tabletocsv', function() {
        MmsAppUtils.tableToCsv(document, $scope.ws, time, true);
    });
    $scope.$on('refresh-numbering', function() {
        var printElementCopy = angular.element("#print-div");
        MmsAppUtils.refreshNumbering($rootScope.mms_treeApi.get_rows(),printElementCopy);
    });

    $scope.searchOptions= {};
    $scope.searchOptions.callback = function(elem) {
        $scope.tscClicked(elem.sysmlid);
    };
    $scope.searchOptions.emptyDocTxt = 'This field is empty.';
    $scope.searchOptions.searchInput = $stateParams.search;
    $scope.searchOptions.searchResult = $scope.search;

    $scope.searchGoToDocument = function (doc, view, elem) {//siteId, documentId, viewId) {
        $state.go('workspace.site.document.view', {site: doc.siteCharacterizationId, document: doc.sysmlid, view: view.sysmlid, tag: undefined, search: undefined});
    };
    $scope.searchOptions.relatedCallback = $scope.searchGoToDocument;
}]);
