import { CacheService } from '@ve-utils/core';
import { ApiService, ElementService, OrgService, ProjectService, UserService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { BrandingStyle } from './Branding.service';

import { VePromise, VeQService } from '@ve-types/angular';
import { ElementObject, OrgObject, OrgsResponse, ProjectObject, ProjectsResponse, UsersRequest } from '@ve-types/mms';

export interface ProjectSettingsObject extends ElementObject {
    banner?: BrandingStyle;
    footer?: BrandingStyle;
}

export interface UserSettingsObject extends ElementObject {
    pinned?: string[];
}

export class SettingsService implements angular.IComponentController {
    static $inject = [
        '$q',
        'ElementService',
        'UserService',
        'OrgService',
        'ProjectService',
        'ApiService',
        'CacheService',
    ];

    constructor(
        private $q: VeQService,
        private elementSvc: ElementService,
        private userSvc: UserService,
        private orgSvc: OrgService,
        private projectSvc: ProjectService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService
    ) {}

    getUserOrg(updateCache?: boolean): VePromise<OrgObject, OrgsResponse> {
        return new this.$q((resolve, reject) => {
            this.orgSvc.getOrg(this.userSvc.getUsername(), updateCache).then(
                (data) => {
                    resolve(data);
                },
                (reason) => {
                    if (reason.status == 404) {
                        this.userSvc.getUser(this.userSvc.getUsername()).then((user) => {
                            const reqOb: OrgObject = {
                                id: `${this.userSvc.getUsername()}-personal`,
                                name: `${user.fullName != '' ? user.fullName : user.username}'s Personal Org`,
                                public: false,
                            };
                            this.orgSvc.createOrg(reqOb).then(resolve, reject);
                        }, reject);
                    } else {
                        reject(reason);
                    }
                }
            );
        });
    }

    getUserHome(updateCache?: boolean): VePromise<ProjectObject, ProjectsResponse> {
        return new this.$q((resolve, reject) => {
            this.projectSvc.getProject(`${this.userSvc.getUsername()}-home`, updateCache).then(resolve, (reason) => {
                if (reason.status == 404) {
                    this.userSvc.getUser(this.userSvc.getUsername()).then((user) => {
                        const reqOb: ProjectObject = {
                            id: `${this.userSvc.getUsername()}-home`,
                            orgId: `${this.userSvc.getUsername()}-personal`,
                            name: `${user.fullName != '' ? user.fullName : user.username}'s Home`,
                            public: false,
                        };
                        this.projectSvc.createProject(reqOb).then(resolve, reject);
                    }, reject);
                } else {
                    reject(reason);
                }
            });
        });
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

    public updateUserSettings = (settingsOb: UserSettingsObject): VePromise<UserSettingsObject> => {
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

    addPins(projectId: string, refId: string, pinned: string[]): VePromise<UserSettingsObject> {
        const username = this.userSvc.getUsername();
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

    removePins(projectId: string, refId: string, unpinned: string[]): VePromise<UserSettingsObject> {
        const username = this.userSvc.getUsername();
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

veUtils.service('SettingsService', SettingsService);
