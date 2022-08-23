import * as _ from 'lodash'
import {ViewObject} from "@ve-types/mms";
import {veUtils} from "@ve-utils";

export class FullDocumentService {
    public viewsBuffer = [];
    
    private _isLoadingRemaingViews = false;
            _isFullDocFullyLoaded = false;
            _loadingRemainingViewsMessage
    
    constructor(private _views, private $timeout, private $interval, private $http, private growl) {
        
    }
        

    public handleClickOnBranch(branch, callback) {
        var viewId = branch.type === 'view' ? branch.data.id : branch.viewId;
        var isViewLoadedBefore =this._loadViewsUntilViewWith(viewId); // load some views if necessary
        if (isViewLoadedBefore) {
            callback();
        } else {
            var message = this.growl.info('Loading more views!', {ttl: -1});
            this._waitTillAfterDigestCycle(() => { // wait for digest to finish and for content to finish rendering
                message.destroy();
                callback();
            });
        }
        return isViewLoadedBefore;
    }

    public loadRemainingViews(callback) {
        if (this._isFullDocFullyLoaded) {
            callback();
        } else {
            var handler;
            if (!this._loadingRemainingViewsMessage) {
                this._loadingRemainingViewsMessage = this.growl.info('Loading more views!', { ttl: -1, onclose: () => { delete this._loadingRemainingViewsMessage; } } );
            }
            if (!this._isLoadingRemaingViews) {
                this._isLoadingRemaingViews = true;
                handler = this.$interval(() => {
                    var nextIndex = this.viewsBuffer.length + 9;
                    if (nextIndex >= this._views.length) {
                        nextIndex = this._views.length - 1;
                    }
                    this._pushNewViewsToBuffer(this.viewsBuffer.length, nextIndex);
                    if (nextIndex === this._views.length - 1) {
                        this.$interval.cancel(handler);
                        this._waitTillAfterDigestCycle(() => {
                            callback();
                            this._isLoadingRemaingViews = false;
                            if (this._loadingRemainingViewsMessage) {
                                this._loadingRemainingViewsMessage.destroy();
                                delete this._loadingRemainingViewsMessage;
                            }
                        });
                    }
                }, 1000);
            }
        }
    }

    public handleDocumentScrolling() {
        return this._pushNewViewsToBuffer(this.viewsBuffer.length, this.viewsBuffer.length);
    }

    public addInitialViews(isScrollbarVisible) {
        var message = this.growl.info('Loading initial view!', {ttl: -1});
        this._incrementallyAddViewTillScroll(message.destroy, isScrollbarVisible);
    }

    public handleViewAdd(view, prevSiblingViewId) {
        // load the new view into the original views right after its sibling
        var siblingIndex = this._findViewFromOriginalViews(prevSiblingViewId);
        this._views.splice(siblingIndex + 1, 0, view);

        // load the new view into the viewsBuffer
        var siblingIndexFromLoadedViews = this._findViewFromLoadedViews(prevSiblingViewId);
        if (siblingIndexFromLoadedViews === -1) {
            // load all views up until the sibling view plus the new view
            this._pushNewViewsToBuffer(this.viewsBuffer.length, siblingIndex + 1);
        } else {
            // load the new view right after its sibling
            this._addNewViewToBufferAt(siblingIndexFromLoadedViews + 1);
        }
    }

    public handleViewDelete(deletedBranch) {
        var viewIdsToDelete = [];
        this._getAllViewsStartingAt(deletedBranch, viewIdsToDelete);
        this._deleteViewsFrom(this._views, viewIdsToDelete);
        this._deleteViewsFrom(this.viewsBuffer, viewIdsToDelete);
    }

    private _addNewViewToBufferAt(index) {
        this.viewsBuffer.splice(index, 0, this._views[index]);
    }

    private _pushNewViewsToBuffer(startIndex, endIndex) {
        var isLoadedBefore = true;
        if (startIndex < this._views.length && endIndex < this._views.length) {
            Array.prototype.push.apply(this.viewsBuffer, this._views.slice(startIndex, endIndex + 1));
            isLoadedBefore = false;
            if (endIndex === this._views.length - 1) {
                this._waitTillAfterDigestCycle(() => {
                    this._isFullDocFullyLoaded = true;
                });
            }
        }
        return isLoadedBefore;
    }

    private _loadViewsUntilViewWith(viewId) {
        var isViewLoadedBefore = true;
        // if not, find the index of that view and load starting from lastLoadedViewIndex till that view + 1
        if (this._findViewFromLoadedViews(viewId) === -1) {
            var index = this._findViewFromOriginalViews(viewId);
            if (index !== -1) {
                this._pushNewViewsToBuffer(this.viewsBuffer.length, index);
            }
            isViewLoadedBefore = false;
        }
        return isViewLoadedBefore;
    }

    private _incrementallyAddViewTillScroll(callback, isScrollbarVisible) {
        var isNoMoreToLoad = this._pushNewViewsToBuffer(this.viewsBuffer.length, this.viewsBuffer.length);
        this._waitTillAfterDigestCycle(() => {
            var isScrollBarVisible = isScrollbarVisible();
            if (isScrollBarVisible || isNoMoreToLoad) {
                callback();
            } else {
                this._incrementallyAddViewTillScroll(callback, isScrollbarVisible);
            }
        });
    }

    private _getAllViewsStartingAt(branch, results) {
        if (branch.type === 'view') {
            results.push(branch.data.id);
            branch.children.forEach((childBranch) => {
                this._getAllViewsStartingAt(childBranch, results);
            });
        }
    }

    private _deleteViewsFrom(viewListToDeleteFrom, viewIdsToDelete) {
        _.remove(viewListToDeleteFrom, (view: ViewObject) => {
            return viewIdsToDelete.indexOf(view.id) !== -1;
        });
    }

    private _findViewFromLoadedViews(viewId) {
        return _.findIndex(this.viewsBuffer, {id: viewId});
    }

    private _findViewFromOriginalViews(viewId) {
        return _.findIndex(this._views, {id: viewId});
    }

    private _waitTillAfterDigestCycle(callback) {
        this.$timeout(() => {
            if (this._isViewsFullyLoaded()) {
                callback();
            } else {
                this._waitTillAfterDigestCycle(callback);
            }
        }, 500);
    }

    private _isViewsFullyLoaded() {
        return this.$http.pendingRequests.length === 0;
    }
}

export class FullDocumentServiceFactory {
    constructor(private $timeout, private $interval, private $http, private growl) {
    }
    
    get(views) {
        return new FullDocumentService(views, this.$timeout, this.$interval, this.$http, this.growl);
    }
    
}

FullDocumentServiceFactory.$inject = ['$timeout', "$interval", '$http', 'growl']

veUtils.service('FullDocumentService', FullDocumentServiceFactory);