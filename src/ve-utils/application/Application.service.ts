import { ApiService, CacheService, ElementService, ProjectService } from '@ve-utils/mms-api-client'

import { veUtils } from '@ve-utils'

import { BrandingStyle } from './Branding.service'

import { VePromise, VeQService } from '@ve-types/angular'
import { ElementObject } from '@ve-types/mms'
/**
 * @ngdoc service
 * @name veUtils/ApplicationService
 * @requires $q
 * @requires $http
 * @requires URLService
 * * Provide general applications functions such as getting MMS Version, getting username,
 * creating unique IDs, etc...
 */

export interface ProjectSettingsObject extends ElementObject {
    pinnedIds?: { [key: string]: string[] }
    banner?: BrandingStyle
    footer?: BrandingStyle
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

    static $inject = ['$q', 'ProjectService', 'ElementService', 'ApiService', 'CacheService']

    constructor(
        private $q: VeQService,
        private projectSvc: ProjectService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService
    ) {}

    public getState(): VeApplicationState {
        return this.state
    }

    public copyToClipboard(target: JQuery<HTMLElement>, $event: JQuery.ClickEvent): VePromise<void, unknown> {
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

    public getSettings = (projectId: string, refId?: string, refresh?: boolean): VePromise<ProjectSettingsObject> => {
        if (!refId) refId = 'master'
        const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '_hidden_' + projectId + '_settings', false)
        const cached = this.cacheSvc.get<ProjectSettingsObject>(cacheKey)
        if (cached && !refresh) {
            return this.$q.resolve(cached)
        }
        return new this.$q<ProjectSettingsObject>((resolve, reject) => {
            this.elementSvc
                .getElement<ProjectSettingsObject>({
                    projectId,
                    refId,
                    elementId: '_hidden_' + projectId + '_settings',
                })
                .then((result) => {
                    if (result === null) {
                        this.updateSettings(projectId, refId, null).then(resolve, reject)
                    } else resolve(result)
                }, reject)
        })
    }

    public createSettings = (
        projectId: string,
        refId: string,
        settingsOb?: ProjectSettingsObject
    ): VePromise<ProjectSettingsObject> => {
        if (!settingsOb) {
            settingsOb = {
                id: '_hidden_' + projectId + '_settings',
                name: 'View Editor Project Settings',
                _projectId: projectId,
                _refId: refId,
                ownerId: 'holding_bin_' + projectId,
                type: 'Class',
            }
        }
        return this.elementSvc.createElement<ProjectSettingsObject>({
            elementId: '_hidden_' + projectId + '_settings',
            projectId,
            refId,
            elements: [settingsOb],
        })
    }

    public updateSettings = (
        projectId: string,
        refId: string,
        settingsOb: ProjectSettingsObject
    ): VePromise<ProjectSettingsObject> => {
        return new this.$q<ProjectSettingsObject>((resolve, reject) => {
            this.elementSvc
                .getElement<ProjectSettingsObject>({
                    projectId,
                    refId,
                    elementId: '_hidden_' + projectId + '_settings',
                })
                .then((result) => {
                    if (!result) {
                        this.createSettings(projectId, refId, settingsOb).then(resolve, reject)
                        return
                    }

                    if (
                        settingsOb.pinnedIds &&
                        Object.keys(result.pinnedIds).length > 0 &&
                        Object.keys(settingsOb.pinnedIds).length > 0
                    ) {
                        Object.keys(settingsOb.pinnedIds).forEach((username) => {
                            if (result.pinnedIds[username]) {
                                const newIds = [
                                    ...new Set([...result.pinnedIds[username], ...settingsOb.pinnedIds[username]]),
                                ]
                                settingsOb.pinnedIds[username].length = 0
                                settingsOb.pinnedIds[username].push(...newIds)
                            }
                        })
                    }
                    this.elementSvc.updateElement<ProjectSettingsObject>(settingsOb).then(resolve, reject)
                }, reject)
        })
    }
}

veUtils.service('ApplicationService', ApplicationService)
