import { CacheService } from '@ve-utils/core';
import { ApiService, ElementService, ProjectService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { BrandingStyle } from './Branding.service';

import { VePromise, VeQService } from '@ve-types/angular';
import { ElementObject, UsersRequest } from '@ve-types/mms';
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
    banner?: BrandingStyle;
    footer?: BrandingStyle;
}

export interface UserSettingsObject extends ElementObject {
    pinned?: string[];
}

export interface VeApplicationState {
    inDoc: boolean;
    fullDoc: boolean;
    currentDoc: string;
    user: string;
}

export class ApplicationService {
    private state: VeApplicationState = {
        inDoc: false,
        fullDoc: false,
        currentDoc: null,
        user: null,
    };

    public PROJECT_URL_PREFIX = '#/projects/';

    static $inject = ['$q', 'ProjectService', 'ElementService', 'ApiService', 'CacheService'];

    constructor(
        private $q: VeQService,
        private projectSvc: ProjectService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService
    ) {}

    public getState(): VeApplicationState {
        return this.state;
    }

    public copyToClipboard(target: JQuery<HTMLElement>, $event: JQuery.ClickEvent): VePromise<void, unknown> {
        const deferred = this.$q.defer<void>();
        $event.stopPropagation();

        navigator.clipboard.writeText(target[0].childNodes[0].textContent).then(
            () => {
                deferred.resolve();
            },
            (reason) => {
                deferred.reject(reason);
            }
        );
        return deferred.promise;
    }

    public getUserSettings = (
        reqOb: UsersRequest,
        refresh?: boolean,
        weight?: number
    ): VePromise<UserSettingsObject> => {
        const cacheKey = this.apiSvc.makeCacheKey(reqOb, '_hidden_' + reqOb.username + '_ve_settings', false);
        const cached = this.cacheSvc.get<UserSettingsObject>(cacheKey);
        if (cached && !refresh) {
            return this.$q.resolve(cached);
        }
        return new this.$q<UserSettingsObject>((resolve, reject) => {
            this.elementSvc
                .getElement<UserSettingsObject>(
                    {
                        projectId: reqOb.projectId,
                        refId: reqOb.refId,
                        elementId: '_hidden_' + reqOb.username + '_settings',
                    },
                    weight,
                    refresh,
                    true
                )
                .then((result) => {
                    if (result === null) {
                        this.elementSvc
                            .createElement<UserSettingsObject>({
                                projectId: reqOb.projectId,
                                refId: reqOb.refId,
                                elements: [
                                    {
                                        id: '_hidden_' + reqOb.username + '_settings',
                                        name: 'View Editor' + reqOb.username + 'Project Settings',
                                        _projectId: reqOb.projectId,
                                        _refId: reqOb.refId,
                                        type: 'Class',
                                    },
                                ],
                            })
                            .then(resolve, reject);
                    } else resolve(result);
                }, reject);
        });
    };

    public updateUserSettings = (
        reqOb: UsersRequest,
        settingsOb: UserSettingsObject
    ): VePromise<UserSettingsObject> => {
        return this.elementSvc.updateElement<UserSettingsObject>(settingsOb);
    };

    public getSettings = (
        projectId: string,
        refId?: string,
        refresh?: boolean,
        weight?: number
    ): VePromise<ProjectSettingsObject> => {
        if (!refId) refId = 'master';
        const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '_hidden_' + projectId + '_settings', false);
        const cached = this.cacheSvc.get<ProjectSettingsObject>(cacheKey);
        if (cached && !refresh) {
            return this.$q.resolve(cached);
        }
        return new this.$q<ProjectSettingsObject>((resolve, reject) => {
            this.elementSvc
                .getElement<ProjectSettingsObject>(
                    {
                        projectId,
                        refId,
                        elementId: '_hidden_' + projectId + '_settings',
                    },
                    weight,
                    refresh,
                    true
                )
                .then((result) => {
                    if (result === null) {
                        this.createSettings(projectId, refId, null).then(resolve, reject);
                    } else resolve(result);
                }, reject);
        });
    };

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
                type: 'Class',
            };
        }
        return this.elementSvc.createElement<ProjectSettingsObject>({
            elementId: '_hidden_' + projectId + '_settings',
            projectId,
            refId,
            elements: [settingsOb],
        });
    };

    addPins(username: string, projectId: string, refId: string, pinned: string[]): VePromise<UserSettingsObject> {
        return new this.$q((resolve, reject) => {
            this.getUserSettings({ username, projectId, refId }).then((result) => {
                if (result.pinned) {
                    pinned = [...new Set([...result.pinned, ...pinned])];
                }
                this.elementSvc
                    .updateElement<UserSettingsObject>({
                        id: result.id,
                        _refId: result._refId,
                        _projectId: result._projectId,
                        pinned,
                    })
                    .then(resolve, reject);
            }, reject);
        });
    }

    removePins(username: string, projectId: string, refId: string, unpinned: string[]): VePromise<UserSettingsObject> {
        return new this.$q((resolve, reject) => {
            this.getUserSettings({ username, projectId, refId }).then((response) => {
                if (response.pinned) {
                    const pinned = response.pinned.filter((pin) => {
                        return unpinned.includes(pin);
                    });
                    this.elementSvc
                        .updateElement<UserSettingsObject>({
                            id: response.id,
                            _refId: response._refId,
                            _projectId: response._projectId,
                            pinned,
                        })
                        .then(resolve, reject);
                } else resolve(response);
            }, reject);
        });
    }
}

veUtils.service('ApplicationService', ApplicationService);
