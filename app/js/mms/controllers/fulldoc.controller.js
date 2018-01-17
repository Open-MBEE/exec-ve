'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('FullDocCtrl', ['$scope', '$rootScope', '$state', '$element', '$interval', '$timeout', '$anchorScroll', '$location', '$http', 'FullDocumentService',
    'hotkeys', 'growl', '_', 'MmsAppUtils', 'UxService', 'search', 'orgOb', 'projectOb', 'refOb', 'groupOb', 'documentOb',
function($scope, $rootScope, $state, $element, $interval, $timeout, $anchorScroll, $location, $http, FullDocumentService, hotkeys, growl, _,
    MmsAppUtils, UxService, search, orgOb, projectOb, refOb, groupOb, documentOb) {

    $rootScope.ve_fullDocMode = true;
    if (!$rootScope.veCommentsOn)
        $rootScope.veCommentsOn = false;
    if (!$rootScope.veElementsOn)
        $rootScope.veElementsOn = false;
    if (!$rootScope.ve_editmode)
        $rootScope.ve_editmode = false;

    // var lazyLoadingApi = addLazyLoading();
    $scope.search = search;
    $scope.buttons = [];
    $scope.refOb = refOb;
    $scope.projectOb = projectOb;
    $scope.latestElement = '';
    $scope.docLibLink = '';
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

            $scope.bbApi.addButton(UxService.getButtonBarButton('show-elements'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('show-comments'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('refresh-numbering'));
            // $scope.bbApi.addButton(UxService.getButtonBarButton('share-url'));
            $scope.bbApi.addButton(UxService.getButtonBarButton('print'));
            var exportButtons = UxService.getButtonBarButton('export');
            exportButtons.dropdown_buttons.push(UxService.getButtonBarButton("convert-pdf"));
            $scope.bbApi.addButton(exportButtons);
            $scope.bbApi.setToggleState('show-comments', $rootScope.veCommentsOn);
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
    $scope.views = [];

    var views = [];
    var view2children = {};
    var num = 1;
    var seenViewIds = {};
    view2children[documentOb.id] = [];
    var fullDocumentService;

    var loadingViewsFromServer = growl.info('Loading data from server', {ttl: -1});
    createViews().then(function(views) {
        // 1. instantiate documentService
        // 2. setup the scroll event
        // 3. load views until the scrollbar show up
        // 4. after that if user scroll, incrementally load one more views at a time
        // 5. respond to content export, refresh numbering, branch click
        fullDocumentService = new FullDocumentService(views);
        _startUpScroll();
        $scope.views = fullDocumentService.viewsBuffer;
    }).finally(function() {
        loadingViewsFromServer.destroy();
    });

    initializeDocLibLink();

    $scope.$on('mms-tree-click', function(e, branch) {
        var message = _createGrowlMessage('Loading views!');
        fullDocumentService.handleClickOnBranch(branch, function() {
            $location.hash(branch.data.id);
            $anchorScroll();
            message.destroy();
        });
    });

    // TODO:HONG for some reason after printing, the click on the tree hierarchy doesn't work anymore
    // TODO:HONG what happen when we add new stuffs
    $scope.$on('newViewAdded', function(event, vId, curSec, prevSibId) {
        var sibIndex = _.findIndex(views, {id: prevSibId});
        views.splice(sibIndex+1, 0, buildViewElt(vId, curSec) );
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

    $scope.$on('convert-pdf', function() {
        var message = _createGrowlMessage('Preparing views for generating pdf file!');
        fullDocumentService.handleContentExport(function() {
            message.destroy();
            var converting = false;
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
    });

    $scope.$on('print', function() {
        var message = _createGrowlMessage('Preparing views for printing!');
        fullDocumentService.handleContentExport(function() {
            message.destroy();
            MmsAppUtils.printModal(documentOb, refOb, true, 1);
        });
    });

    $scope.$on('word', function() {
        var message = _createGrowlMessage('Preparing views for to generate word document!');
        fullDocumentService.handleContentExport(function() {
            message.destroy();
            MmsAppUtils.printModal(documentOb, refOb, true, 2);
        });
    });

    $scope.$on('tabletocsv', function() {
        var message = _createGrowlMessage('Preparing views for converting table to csv!');
        fullDocumentService.handleContentExport(function() {
            message.destroy();
            MmsAppUtils.tableToCsv(true);
        });
    });

    $scope.$on('refresh-numbering', function() {
        var message = _createGrowlMessage('Preparing views for refresh numbering!');
        fullDocumentService.handleContentExport(function() {
            message.destroy();
            var printElementCopy = angular.element("#print-div");
            MmsAppUtils.refreshNumbering($rootScope.ve_treeApi.get_rows(), printElementCopy);
        });
    });

    function createViews() {
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
        if (!documentOb._childViews) {
            documentOb._childViews = [];
        }
        return MmsAppUtils.handleChildViews(documentOb, 'composite', projectOb.id, refOb.id, handleSingleView, handleChildren)
            .then(function(childIds) {
                for (var i = 0; i < childIds.length; i++) {
                    addToArray(childIds[i], num);
                    num = num + 1;
                }
            });
    }

    function initializeDocLibLink() {
        if (groupOb !== null) {
            $scope.docLibLink = groupOb._link;
        } else if (documentOb !== null && documentOb._groupId !== undefined && documentOb._groupId !== null) {
            $scope.docLibLink = '/share/page/repository#filter=path|/Sites/' + orgOb.id + '/documentLibrary/' +
                projectOb.id + '/' + documentOb._groupId;
        } else {
            $scope.docLibLink = '/share/page/repository#filter=path|/Sites/' + orgOb.id + '/documentLibrary/' +
                projectOb.id;
        }
    }

    function elementTranscluded(elementOb, type) {
        if (elementOb && type !== 'Comment') {
            if (elementOb._modified > $scope.latestElement)
                $scope.latestElement = elementOb._modified;
        }
    }

    function elementClicked(elementOb) {
        $rootScope.$broadcast('elementSelected', elementOb, 'latest');
    }

    function buildViewElt(vId, curSec) {
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
    }

    function addToArray(viewId, curSection) {
        views.push(buildViewElt(viewId, curSection));

        if (view2children[viewId]) {
            var num = 1;
            for (var i = 0; i < view2children[viewId].length; i++) {
                addToArray(view2children[viewId][i], curSection + '.' + num);
                num = num + 1;
            }
        }
    }

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

    function _createGrowlMessage(message) {
        return growl.info(message, {ttl: -1});
    }

    function _startUpScroll() {
        var element;
        var childElement;
        var visibleHeight;
        var thresholdBetweenScrollBarAndBottom = 2000;

        // use timeout to wait for angularjs to attach element to DOM
        $timeout(function() {
            console.log('Set up scroll event');
            element = window.document.querySelector('#bingo');
            childElement = $(element).find('#bingo');
            visibleHeight = childElement.height();
            element.addEventListener('scroll', function() {
                // this scrollHeight(total height including the inivisible part) changes as more views are added
                var totalHeight = childElement.prop('scrollHeight');
                var hiddenContentHeight = totalHeight - visibleHeight;

                // Scroll is almost at the bottom. Load more one more view
                if (hiddenContentHeight - childElement.scrollTop() <= thresholdBetweenScrollBarAndBottom) {
                    $scope.apply(fullDocumentService.handleDocumentScrolling);
                }
            }, true);

            console.log('load initial views');
            fullDocumentService.addInitialViews(_isScrollbarVisible);
        }, 0);



        function _isScrollbarVisible() {
            return childElement.prop('scrollHeight') > visibleHeight;
        }
    }
}]);

