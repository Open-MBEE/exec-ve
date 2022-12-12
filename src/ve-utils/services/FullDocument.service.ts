import angular from 'angular'
import _ from 'lodash'

import { veUtils } from '@ve-utils'

import { ViewObject } from '@ve-types/mms'
import { TreeBranch } from '@ve-types/tree'

export class FullDocumentService {
    public viewsBuffer: ViewObject[] = []

    private _isLoadingRemaingViews: boolean = false
    _isFullDocFullyLoaded: boolean = false
    _loadingRemainingViewsMessage: angular.growl.IGrowlMessage

    constructor(
        private _views: ViewObject[],
        private $timeout: angular.ITimeoutService,
        private $interval: angular.IIntervalService,
        private $http: angular.IHttpService,
        private growl: angular.growl.IGrowlService
    ) {}

    public handleClickOnBranch(
        branch: TreeBranch,
        callback: () => void
    ): boolean {
        const viewId: string =
            branch.type === 'view' ? branch.data.id : branch.viewId
        const isViewLoadedBefore = this._loadViewsUntilViewWith(viewId) // load some views if necessary
        if (isViewLoadedBefore) {
            callback()
        } else {
            const message = this.growl.info('Loading more views!', { ttl: -1 })
            this._waitTillAfterDigestCycle(() => {
                // wait for digest to finish and for content to finish rendering
                message.destroy()
                callback()
            })
        }
        return isViewLoadedBefore
    }

    public loadRemainingViews(callback: () => void): void {
        if (this._isFullDocFullyLoaded) {
            callback()
        } else {
            let handler: angular.IPromise<unknown>
            if (!this._loadingRemainingViewsMessage) {
                this._loadingRemainingViewsMessage = this.growl.info(
                    'Loading more views!',
                    {
                        ttl: -1,
                        onclose: () => {
                            delete this._loadingRemainingViewsMessage
                        },
                    }
                )
            }
            if (!this._isLoadingRemaingViews) {
                this._isLoadingRemaingViews = true
                handler = this.$interval(() => {
                    let nextIndex = this.viewsBuffer.length + 9
                    if (nextIndex >= this._views.length) {
                        nextIndex = this._views.length - 1
                    }
                    this._pushNewViewsToBuffer(
                        this.viewsBuffer.length,
                        nextIndex
                    )
                    if (nextIndex === this._views.length - 1) {
                        this.$interval.cancel(handler)
                        this._waitTillAfterDigestCycle(() => {
                            callback()
                            this._isLoadingRemaingViews = false
                            if (this._loadingRemainingViewsMessage) {
                                this._loadingRemainingViewsMessage.destroy()
                                delete this._loadingRemainingViewsMessage
                            }
                        })
                    }
                }, 1000)
            }
        }
    }

    public handleDocumentScrolling(): boolean {
        return this._pushNewViewsToBuffer(
            this.viewsBuffer.length,
            this.viewsBuffer.length
        )
    }

    public addInitialViews = (isScrollbarVisible: () => boolean): void => {
        const message = this.growl.info('Loading initial view!', { ttl: -1 })
        const destroyMessage = (): void => {
            message.destroy()
        }
        this._incrementallyAddViewTillScroll(destroyMessage, isScrollbarVisible)
    }

    public handleViewAdd(view: ViewObject, prevSiblingViewId: string): void {
        // load the new view into the original views right after its sibling
        const siblingIndex = this._findViewFromOriginalViews(prevSiblingViewId)
        this._views.splice(siblingIndex + 1, 0, view)

        // load the new view into the viewsBuffer
        const siblingIndexFromLoadedViews =
            this._findViewFromLoadedViews(prevSiblingViewId)
        if (siblingIndexFromLoadedViews === -1) {
            // load all views up until the sibling view plus the new view
            this._pushNewViewsToBuffer(
                this.viewsBuffer.length,
                siblingIndex + 1
            )
        } else {
            // load the new view right after its sibling
            this._addNewViewToBufferAt(siblingIndexFromLoadedViews + 1)
        }
    }

    public handleViewDelete(deletedBranch: TreeBranch): void {
        const viewIdsToDelete: string[] = []
        this._getAllViewsStartingAt(deletedBranch, viewIdsToDelete)
        this._deleteViewsFrom(this._views, viewIdsToDelete)
        this._deleteViewsFrom(this.viewsBuffer, viewIdsToDelete)
    }

    private _addNewViewToBufferAt(index: number): void {
        this.viewsBuffer.splice(index, 0, this._views[index])
    }

    private _pushNewViewsToBuffer(
        startIndex: number,
        endIndex: number
    ): boolean {
        let isLoadedBefore = true
        if (startIndex < this._views.length && endIndex < this._views.length) {
            Array.prototype.push.apply(
                this.viewsBuffer,
                this._views.slice(startIndex, endIndex + 1)
            )
            isLoadedBefore = false
            if (endIndex === this._views.length - 1) {
                this._waitTillAfterDigestCycle(() => {
                    this._isFullDocFullyLoaded = true
                })
            }
        }
        return isLoadedBefore
    }

    private _loadViewsUntilViewWith(viewId: string): boolean {
        let isViewLoadedBefore = true
        // if not, find the index of that view and load starting from lastLoadedViewIndex till that view + 1
        if (this._findViewFromLoadedViews(viewId) === -1) {
            const index = this._findViewFromOriginalViews(viewId)
            if (index !== -1) {
                this._pushNewViewsToBuffer(this.viewsBuffer.length, index)
            }
            isViewLoadedBefore = false
        }
        return isViewLoadedBefore
    }

    private _incrementallyAddViewTillScroll = (
        callback: () => void,
        isScrollbarVisible: () => boolean
    ): void => {
        const isNoMoreToLoad = this._pushNewViewsToBuffer(
            this.viewsBuffer.length,
            this.viewsBuffer.length
        )
        this._waitTillAfterDigestCycle(() => {
            const isScrollBarVisible = isScrollbarVisible()
            if (isScrollBarVisible || isNoMoreToLoad) {
                callback()
            } else {
                this._incrementallyAddViewTillScroll(
                    callback,
                    isScrollbarVisible
                )
            }
        })
    }

    private _getAllViewsStartingAt(
        branch: TreeBranch,
        results: string[]
    ): void {
        if (branch.type === 'view') {
            results.push(branch.data.id)
            branch.children.forEach((childBranch) => {
                this._getAllViewsStartingAt(childBranch, results)
            })
        }
    }

    private _deleteViewsFrom(
        viewListToDeleteFrom: ViewObject[],
        viewIdsToDelete: string[]
    ): void {
        _.remove(viewListToDeleteFrom, (view: ViewObject) => {
            return viewIdsToDelete.indexOf(view.id) !== -1
        })
    }

    private _findViewFromLoadedViews(viewId: string): number {
        return _.findIndex(this.viewsBuffer, { id: viewId })
    }

    private _findViewFromOriginalViews(viewId: string): number {
        return _.findIndex(this._views, { id: viewId })
    }

    private _waitTillAfterDigestCycle(callback: () => void): void {
        this.$timeout(() => {
            if (this._isViewsFullyLoaded()) {
                callback()
            } else {
                this._waitTillAfterDigestCycle(callback)
            }
        }, 500).then(
            () => {
                /* Do Nothing */
            },
            () => {
                /* Do Nothing */
            }
        )
    }

    private _isViewsFullyLoaded(): boolean {
        return this.$http.pendingRequests.length === 0
    }
}

export class FullDocumentServiceFactory {
    static $inject = ['$timeout', '$interval', '$http', 'growl']

    constructor(
        private $timeout: angular.ITimeoutService,
        private $interval: angular.IIntervalService,
        private $http: angular.IHttpService,
        private growl: angular.growl.IGrowlService
    ) {}

    get(views: ViewObject[]): FullDocumentService {
        return new FullDocumentService(
            views,
            this.$timeout,
            this.$interval,
            this.$http,
            this.growl
        )
    }
}

veUtils.service('FullDocumentService', FullDocumentServiceFactory)
