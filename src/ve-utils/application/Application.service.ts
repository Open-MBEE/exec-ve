import {
    ApiService,
    CacheService,
    ProjectService,
} from '@ve-utils/mms-api-client'

import { veUtils } from '@ve-utils'

import { BrandingStyle } from './Branding.service'

import { VePromise, VeQService } from '@ve-types/angular'
import { ProjectsResponse, RefObject } from '@ve-types/mms'
/**
 * @ngdoc service
 * @name veUtils/ApplicationService
 * @requires $q
 * @requires $http
 * @requires URLService
 * * Provide general applications functions such as getting MMS Version, getting username,
 * creating unique IDs, etc...
 */

export interface VePreferencesObject {
    pinnedIds?: string[]
}

export interface VeRefObject extends RefObject {
    pinnedIds?: string[]
    banner?: BrandingStyle
}

export interface VeApplicationState {
    inDoc: boolean
    fullDoc: boolean
    currentDoc: string
}

export class ApplicationService {
    private state: VeApplicationState = {
        inDoc: false,
        fullDoc: false,
        currentDoc: null,
    }

    public PROJECT_URL_PREFIX = '#/projects/'

    static $inject = ['$q', 'ProjectService', 'ApiService', 'CacheService']

    constructor(
        private $q: VeQService,
        private projectSvc: ProjectService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService
    ) {}

    public getState(): VeApplicationState {
        return this.state
    }

    public copyToClipboard(
        target: JQuery<HTMLElement>,
        $event: JQuery.ClickEvent
    ): VePromise<void, void> {
        const deferred = this.$q.defer<void>()
        $event.stopPropagation()

        navigator.clipboard.writeText(target[0].childNodes[0].textContent).then(
            () => {
                deferred.resolve()
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    public getPins = (
        projectId: string,
        refId?: string,
        refresh?: boolean
    ): VePromise<VePreferencesObject, ProjectsResponse> => {
        if (!refId) refId = 'master'
        const deferred = this.$q.defer<VePreferencesObject>()
        const cacheKey = this.apiSvc.makeCacheKey(
            { projectId, refId },
            '',
            false,
            'preferences'
        )
        const cached = this.cacheSvc.get<VePreferencesObject>(cacheKey)
        if (cached && cached.pinnedIds && !refresh) {
            deferred.resolve(cached)
        } else {
            let prefs: VePreferencesObject = {}
            if (cached && !refresh) {
                prefs = cached
            }
            prefs.pinnedIds = []
            this.projectSvc.getRef(projectId, refId, refresh).then(
                (ref: VeRefObject) => {
                    if (ref.pinnedIds) {
                        prefs.pinnedIds.push(...ref.pinnedIds)
                    }
                    this.cacheSvc.put<VePreferencesObject>(cacheKey, prefs)
                    deferred.resolve(
                        this.cacheSvc.get<VePreferencesObject>(cacheKey)
                    )
                },
                (response) => {
                    deferred.reject(response)
                }
            )
        }

        return deferred.promise
    }

    public updatePins = (
        projectId: string,
        refId: string,
        prefs: VePreferencesObject
    ): VePromise<VePreferencesObject, ProjectsResponse> => {
        const deferred = this.$q.defer<VePreferencesObject>()
        const cacheKey = this.apiSvc.makeCacheKey(
            { projectId, refId },
            '',
            false,
            'preferences'
        )
        this.projectSvc.getRef(projectId, refId).then(
            (ref) => {
                if (prefs.pinnedIds) {
                    ref.pinnedIds = prefs.pinnedIds
                    this.projectSvc.updateRef(ref, projectId).then(
                        (result: VeRefObject) => {
                            prefs.pinnedIds = result.pinnedIds
                            this.cacheSvc.put(cacheKey, prefs)
                            deferred.resolve(this.cacheSvc.get(cacheKey))
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                } else {
                    deferred.resolve(prefs)
                }
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }
}

veUtils.service('ApplicationService', ApplicationService)
