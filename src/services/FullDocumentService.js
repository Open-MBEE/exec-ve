'use strict';

angular.module('mms')
    .factory('FullDocumentService', ['$timeout', '$http', '_', 'growl', FullDocumentService]);

function FullDocumentService($timeout, $http, _, growl) {
    return function (views) {
        var self = this;
        // public api
        this.viewsBuffer = [];
        this.handleClickOnBranch = handleClickOnBranch;
        this.loadRemainingViews = loadRemainingViews;
        this.handleDocumentScrolling = handleDocumentScrolling;
        this.addInitialViews = addInitialViews;
        this.handleViewAdd = handleViewAdd;

        // internal states
        this._views = views;
        this._isLoadingRemaingViews = false;

        function handleClickOnBranch(branch, callback) {
            var viewId = branch.type === 'view' ? branch.data.id : branch.viewId;
            var isViewLoadedBefore =_loadViewsUntilViewWith(viewId); // load some views if neccessary
            if (isViewLoadedBefore) {
                callback();
            } else {
                var message = growl.info('Preparing Views!', {ttl: -1});
                _waitTillAfterDigestCycle(function() { // wait for digest to finish and for content to finish rendering
                    message.destroy();
                    callback();
                });
            }
        }

        function loadRemainingViews(callback) {
            if (!self._isLoadingRemaingViews) {
                self._isLoadingRemaingViews = true;
                var isAlreadyLoaded = _pushNewViewsToBuffer(self.viewsBuffer.length, self._views.length - 1); // load all the views if necessary
                if (isAlreadyLoaded) {
                    callback();
                    self._isLoadingRemaingViews = false;
                } else {
                    var message = growl.info('Preparing Views!', {ttl: -1});
                    _waitTillAfterDigestCycle(function() {
                        self._isLoadingRemaingViews = false;
                        message.destroy();
                        callback();
                    });
                }
            }
        }

        function handleDocumentScrolling() {
            console.log('handle document scrolling');
            return _pushNewViewsToBuffer(self.viewsBuffer.length, self.viewsBuffer.length);
        }

        function addInitialViews(isScrollbarVisible) {
            var message = growl.info('Load initial view!', {ttl: -1});
            _incrementallyAddViewTillScroll(message.destroy, isScrollbarVisible);
        }

        function handleViewAdd(view, prevSiblingViewId) {
            // load the new view into the original views right after its sibling
            var siblingIndex = _findViewFromOriginalViews(prevSiblingViewId);
            self._views.splice(siblingIndex + 1, 0, view);

            // load the new view into the viewsBuffer
            var siblingIndexFromLoadedViews = _findViewFromLoadedViews(prevSiblingViewId);
            if (siblingIndexFromLoadedViews === -1) {
                // load all views up until the sibling view plus the new view
                _pushNewViewsToBuffer(self.viewsBuffer.length, siblingIndex + 1);
            } else {
                // load the new view right after its sibling
                _addNewViewToBufferAt(siblingIndexFromLoadedViews + 1);
            }
        }

        function _addNewViewToBufferAt(index) {
            console.log('load new view at #' + index);
            self.viewsBuffer.splice(index, 0, self._views[index]);
        }

        /** Add to the viewsBuffer views staring at startIndex to endIndex(inclusive) **/
        function _pushNewViewsToBuffer(startIndex, endIndex) {
            var isLoadedBefore = true;
            if (startIndex < self._views.length && endIndex < self._views.length) {
                console.log('loading views from: ' + startIndex + 'to:' + (endIndex));
                Array.prototype.push.apply(self.viewsBuffer, self._views.slice(startIndex, endIndex + 1));
                isLoadedBefore = false;
            }
            return isLoadedBefore;
        }

        function _loadViewsUntilViewWith(viewId) {
            var isViewLoadedBefore = true;
            // if not, find the index of that view and load starting from lastLoadedViewIndex till that view + 1
            if (_findViewFromLoadedViews(viewId) === -1) {
                var index = _findViewFromOriginalViews(viewId);
                if (index !== -1) {
                    _pushNewViewsToBuffer(self.viewsBuffer.length, index);
                }
                isViewLoadedBefore = false;
            }
            return isViewLoadedBefore;
        }

        function _incrementallyAddViewTillScroll(callback, isScrollbarVisible) {
            _pushNewViewsToBuffer(self.viewsBuffer.length, self.viewsBuffer.length);
            _waitTillAfterDigestCycle(function() {
                var isScrollBarVisible = isScrollbarVisible();
                if (!isScrollBarVisible) {
                    _incrementallyAddViewTillScroll(callback, isScrollbarVisible);
                } else {
                    callback();
                }
            });
        }

        function _findViewFromLoadedViews(viewId) {
            return _.findIndex(self.viewsBuffer, {id: viewId});
        }

        function _findViewFromOriginalViews(viewId) {
            return _.findIndex(self._views, {id: viewId});
        }

        function _waitTillAfterDigestCycle(callback) {
            $timeout(function () {
                if (_isViewsFullyLoaded()) {
                    callback();
                } else {
                    _waitTillAfterDigestCycle(callback);
                }
            }, 0);
        }

        function _isViewsFullyLoaded() {
            return $http.pendingRequests.length === 0;
        }
    };
}