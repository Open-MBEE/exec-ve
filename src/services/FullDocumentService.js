'use strict';

angular.module('mms')
    .factory('FullDocumentService', ['$timeout', '$http', '_', FullDocumentService]);

function FullDocumentService($timeout, $http, _) {
    return function (views) {
        var self = this;
        // public api
        this.viewsBuffer = [];
        this.lazyLoadViews = lazyLoadViews;
        this.handleClickOnBranch = handleClickOnBranch;
        this.handleContentExport = handleContentExport;
        this.handleDocumentScrolling = handleDocumentScrolling;
        this.addInitialViews = addInitialViews;

        // internal states
        this._views = views;
        this._nextViewIndexToLoad = 0;
        this._isPreparingForExport = false;

        function lazyLoadViews() {

        }

        function handleClickOnBranch(branch, callback) {
            var viewId = branch.type === 'view' ? branch.data.id : branch.viewId;
            _loadViewsUntilViewWith(viewId); // load some views
            _waitTillAfterDigestCycle(callback); // wait for digest to finish and for content to finish rendering
        }

        function handleContentExport(callback) {
            if (!self._isPreparingForExport) {
                self._isPreparingForExport = true;
                _loadViewsBetween(self._nextViewIndexToLoad, self._views.length); // load all the views
                _waitTillAfterDigestCycle(function() {
                    self._isPreparingForExport = false;
                    callback();
                }); // after done call the callback
            }
        }

        function handleDocumentScrolling() {
            console.log('handle document scrolling');
            _loadViewsBetween(self._nextViewIndexToLoad, self._nextViewIndexToLoad + 1);
        }

        function addInitialViews(isScrollbarVisible) {
            var success = _loadViewsBetween(self._nextViewIndexToLoad, self._nextViewIndexToLoad + 1);
            if ( success ) {
                _waitTillAfterDigestCycle(function() {
                    var isScrollBarVisible = isScrollbarVisible();
                    if (!isScrollBarVisible) {
                        addInitialViews();
                    }
                });
            }
        }

        function _loadViewsBetween(startIndex, endIndex) {
            if (self._nextViewIndexToLoad < self._views.length && endIndex < self._views.length) {
                console.log('loading views');
                console.log('#' + startIndex);
                console.log('#' + endIndex - 1);

                Array.prototype.push.apply(self.viewsBuffer, self._views.slice(startIndex, endIndex));
                self._nextViewIndexToLoad = endIndex;
                return true;
            }
            return false;
        }

        function _loadViewsUntilViewWith(viewId) {
            // if not, find the index of that view and load starting from lastLoadedViewIndex till that view + 1
            if (!_isViewLoaded(viewId)) {
                var index = _findViewWith(viewId);
                if (index !== -1) {
                    _loadViewsBetween(self._nextViewIndexToLoad, index);
                }
            }
        }

        function _isViewLoaded(viewId) {
            return _.findIndex(self.viewsBuffer, function (view) {
                return viewId === view.id;
            }) !== -1;
        }

        function _findViewWith(viewId) {
            return _.findIndex(self._views, function (view) {
                return viewId === view.id;
            });
        }

        function _waitTillAfterDigestCycle(callback) {
            $timeout(function () {
                if (_isViewsFullyLoaded()) {
                    callback();
                } else {
                    _waitTillAfterDigestCycle(callback);
                }
            }, 0, false);
        }

        function _isViewsFullyLoaded() {
            return $http.pendingRequests.length === 0;
        }
    };
}