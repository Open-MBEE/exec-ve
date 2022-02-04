'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('FullDocCtrl', ['$scope', '$state', '$anchorScroll', '$location', '$timeout', '$http', 'FullDocumentService', 'ShortenUrlService',
    'hotkeys', 'growl', '_', 'MmsAppUtils', 'Utils', 'UxService', 'URLService', 'UtilsService', 'search', 'orgOb', 'projectOb', 'refOb', 'groupOb', 'documentOb',
    'PermissionsService', 'RootScopeService', 'TreeService', 'EventService',
function($scope, $state, $anchorScroll, $location, $timeout, $http, FullDocumentService, ShortenUrlService, hotkeys, growl, _,
    MmsAppUtils, Utils, UxService, URLService, UtilsService, search, orgOb, projectOb, refOb, groupOb, documentOb, PermissionsService,
    RootScopeService, TreeService, EventService) {

    let rootScopeSvc = RootScopeService;
    let tree = TreeService.getApi();

    let eventSvc = EventService;
    eventSvc.$init($scope);

    $scope.viewContentLoading = false;

    $scope.subs.push(eventSvc.$on(rootScopeSvc.constants.VEVIEWCONTENTLOADING,(data) => {
        $scope.viewContentLoading = data;
    }));

    rootScopeSvc.veFullDocMode(true);
    if (!rootScopeSvc.veCommentsOn())
        rootScopeSvc.veCommentsOn(false);
    if (!rootScopeSvc.veElementsOn())
        rootScopeSvc.veElementsOn(false);
    if (!rootScopeSvc.veEditMode())
        rootScopeSvc.veEditMode(false);

    $scope.search = search;
    Utils.toggleLeftPane(search);
    $scope.buttons = [];
    $scope.refOb = refOb;
    $scope.projectOb = projectOb;
    $scope.latestElement = '';
    $scope.docLibLink = '';
    $scope.bbApi = {
        init: function() {
            if (documentOb && refOb.type === 'Branch' && PermissionsService.hasBranchEditPermission(refOb)) {
                $scope.bbApi.addButton(UxService.getButtonBarButton('show-edits'));
                $scope.bbApi.setToggleState('show-edits', rootScopeSvc.veEditMode());
                hotkeys.bindTo($scope)
                .add({
                    combo: 'alt+d',
                    description: 'toggle edit mode',
                    callback: function() {eventSvc.$broadcast('show-edits');}
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
            $scope.bbApi.setToggleState('show-comments', rootScopeSvc.veCommentsOn());
            $scope.bbApi.setToggleState('show-elements', rootScopeSvc.veElementsOn());
            hotkeys.bindTo($scope)
            .add({
                combo: 'alt+c',
                description: 'toggle show comments',
                callback: function() {eventSvc.$broadcast('show-comments');}
            }).add({
                combo: 'alt+e',
                description: 'toggle show elements',
                callback: function() {eventSvc.$broadcast('show-elements');}
            });
        }
    };
    $scope.searchOptions = {
        emptyDocTxt: 'This field is empty.',
        searchInput: search,
        getProperties: true,
        closeable: true,
        callback: function(elementOb) {
            let data = {
                elementOb: elementOb,
                commitId: 'latest'
            };
            eventSvc.$broadcast('elementSelected', data);
            if (typeof rootScopeSvc.mmsPaneClosed() === 'boolean' && rootScopeSvc.mmsPaneClosed())
                eventSvc.$broadcast('mms-pane-toggle');
        },
        relatedCallback: function (doc, view, elem) {//siteId, documentId, viewId) {
            $state.go('project.ref.document.view', {projectId: doc._projectId, documentId: doc.id, viewId: view.id, refId: doc._refId, search: undefined});
        }
    };
    $scope.views = [];
    // api to communicate with borderlayout library
    $scope.scrollApi = {
        notifyOnScroll: notifyOnScroll,
        isScrollVisible: function(){}, // pane's directive (in borderlayout) resets this to the right function
        throttleRate: 500, // how often should the wheel event triggered
        threshold : 3000, // how far from the bottom of the page before adding more views
        frequency: 100 // how fast to add more views
    };


    var views = [];
    var view2children = {};
    var num = 1;
    var seenViewIds = {};
    view2children[documentOb.id] = [];
    var fullDocumentService;
    _createViews().then(function() {
        // The Controller codes get executed before all the directives'
        // code in its template ( full-doc.html ). As a result, use $timeout here
        // to let them finish first because in this case
        // we rely on fa-pane directive to setup isScrollVisible
        $timeout(function() {
            fullDocumentService = new FullDocumentService(views);
            fullDocumentService.addInitialViews($scope.scrollApi.isScrollVisible);
            $scope.views = fullDocumentService.viewsBuffer;
        });
    });

    _initializeDocLibLink();

    $scope.subs.push(eventSvc.$on('mms-tree-click', function(branch) {
        fullDocumentService.handleClickOnBranch(branch, function() {
            $location.hash(branch.data.id);
            $anchorScroll();
        });
    }));

    $scope.subs.push(eventSvc.$on('mms-full-doc-view-deleted', function(deletedBranch) {
       fullDocumentService.handleViewDelete(deletedBranch);
    }));

    $scope.subs.push(eventSvc.$on('mms-new-view-added', function(data) {
        fullDocumentService.handleViewAdd(_buildViewElement(data.vId, data.curSec), data.prevSibId);
    }));

   $scope.subs.push(eventSvc.$on('show-comments', function() {
        for (var i = 0; i < $scope.views.length; i++) {
            $scope.views[i].api.toggleShowComments();
        }
        $scope.bbApi.toggleButtonState('show-comments');
        rootScopeSvc.veCommentsOn(!rootScopeSvc.veCommentsOn());
    }));

   $scope.subs.push(eventSvc.$on('show-elements', function() {
        for (var i = 0; i < $scope.views.length; i++) {
            $scope.views[i].api.toggleShowElements();
        }
        $scope.bbApi.toggleButtonState('show-elements');
        rootScopeSvc.veElementsOn(!rootScopeSvc.veElementsOn());
    }));

   $scope.subs.push(eventSvc.$on('show-edits', function() {
        var i = 0;
        if ((rootScopeSvc.veElementsOn() && rootScopeSvc.veEditMode()) || (!rootScopeSvc.veElementsOn() && !rootScopeSvc.veEditMode()) ){
            for (i = 0; i < $scope.views.length; i++) {
                $scope.views[i].api.toggleShowElements();
            }
            $scope.bbApi.toggleButtonState('show-elements');
            rootScopeSvc.veElementsOn(!rootScopeSvc.veElementsOn());
        }
        $scope.bbApi.toggleButtonState('show-edits');
        rootScopeSvc.veEditMode(!rootScopeSvc.veEditMode());
        for (i = 0; i < $scope.views.length; i++) {
            $scope.views[i].api.toggleShowEdits();
        }
    }));

   $scope.subs.push(eventSvc.$on('convert-pdf', function() {
        fullDocumentService.loadRemainingViews(function() {
            MmsAppUtils.printModal(documentOb, refOb, true, 3)
            .then(function(ob) {
                growl.info('Exporting as PDF file. Please wait for a completion email.',{ttl: -1});
            }, function(reason){
                growl.error("Exporting as PDF file Failed: " + reason.message);
            });
        });
    }));

   $scope.subs.push(eventSvc.$on('print', function() {
        fullDocumentService.loadRemainingViews(function() {
            MmsAppUtils.printModal(documentOb, refOb, true, 1);
        });
    }));

   $scope.subs.push(eventSvc.$on('word', function() {
        fullDocumentService.loadRemainingViews(function() {
            MmsAppUtils.printModal(documentOb, refOb, true, 2)
            .then(function(ob) {
                growl.info('Exporting as Word file. Please wait for a completion email.',{ttl: -1});
            }, function(reason){
                growl.error("Exporting as Word file Failed: " + reason.message);
            });
        });
    }));

   $scope.subs.push(eventSvc.$on('tabletocsv', function() {
        fullDocumentService.loadRemainingViews(function() {
            MmsAppUtils.tableToCsv(true);
        });
    }));

   $scope.subs.push(eventSvc.$on('refresh-numbering', function() {
        fullDocumentService.loadRemainingViews(function() {
            MmsAppUtils.refreshNumbering(tree.get_rows(), angular.element("#print-div"));
        });
    }));

    // Share URL button settings
    $scope.dynamicPopover = ShortenUrlService.dynamicPopover;
    $scope.copyToClipboard = ShortenUrlService.copyToClipboard;
    $scope.handleShareURL = ShortenUrlService.getShortUrl.bind(null, $location.absUrl(), $scope);

    function _createViews() {
        var loadingViewsFromServer = growl.info('Loading data from server!', {ttl: -1});
        views.push({id: documentOb.id, api: {
            init: function(dis) {
                if (rootScopeSvc.veCommentsOn()) {
                    dis.toggleShowComments();
                }
                if (rootScopeSvc.veElementsOn()) {
                    dis.toggleShowElements();
                }
                if (rootScopeSvc.veEditMode()) {
                    dis.toggleShowEdits();
                }
            },
            elementTranscluded: _elementTranscluded,
            elementClicked: _elementClicked
        }});
        if (!documentOb._childViews) {
            documentOb._childViews = [];
        }
        return MmsAppUtils.handleChildViews(documentOb, 'composite', undefined, projectOb.id, refOb.id, _handleSingleView, _handleChildren)
            .then(function(childIds) {
                for (var i = 0; i < childIds.length; i++) {
                    _constructViews(childIds[i], num);
                    num = num + 1;
                }
            }).finally(loadingViewsFromServer.destroy);
    }

    function _initializeDocLibLink() {
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

    function _elementTranscluded(elementOb, type) {
        if (elementOb && type !== 'Comment') {
            if (elementOb._modified > $scope.latestElement)
                $scope.latestElement = elementOb._modified;
        }
    }

    function _elementClicked(elementOb) {
        let data = {
            elementOb: elementOb,
            commitId: 'latest'
        };
        eventSvc.$broadcast('elementSelected', data);
    }

    function _buildViewElement(vId, curSec) {
        return {id: vId, api: {
            init: function(dis) {
                if (rootScopeSvc.veCommentsOn()) {
                    dis.toggleShowComments();
                }
                if (rootScopeSvc.veElementsOn()) {
                    dis.toggleShowElements();
                }
                if (rootScopeSvc.veEditMode()) {
                    dis.toggleShowEdits();
                }
            },
            elementTranscluded: _elementTranscluded,
            elementClicked: _elementClicked
        }, number: curSec, topLevel: (curSec ? (curSec.toString().indexOf('.') === -1) : false), first: curSec == 1};
    }

    function _constructViews(viewId, curSection) {
        views.push(_buildViewElement(viewId, curSection));

        if (view2children[viewId]) {
            var num = 1;
            for (var i = 0; i < view2children[viewId].length; i++) {
                _constructViews(view2children[viewId][i], curSection + '.' + num);
                num = num + 1;
            }
        }
    }

    function _handleSingleView(v, aggr) {
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

    function _handleChildren(childIds, childNodes) {
        return childIds;
    }

    function notifyOnScroll() {
        return fullDocumentService.handleDocumentScrolling();
    }
}]);
