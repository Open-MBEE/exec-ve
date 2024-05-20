import { veCore } from '@ve-core/ve-core.module';
import { BrandingService, BrandingStyle } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import {
    AuthService,
    ElementService,
    GroupService,
    OrgService,
    PermissionCache,
    PermissionService,
    ProjectService,
    UserService,
    ViewService,
} from '@ve-utils/mms-api-client';

import { VePromise, VeQService } from '@ve-types/angular';
import {
    AdminObject,
    CheckAuthResponse,
    DocumentObject,
    GenericResponse,
    ProjectGroupObject,
    MountObject,
    OrgObject,
    OrgsResponse,
    PackageObject,
    ParamsObject,
    PermissionResponse,
    ProjectObject,
    ProjectsResponse,
    RefObject,
    RefsResponse,
    UserGroupsResponse,
    UserObject,
    UsersResponse,
    ViewObject,
    ProjectGroupsResponse,
    GroupObject,
} from '@ve-types/mms';

export class ResolveService {
    static $inject = [
        '$q',
        'growl',
        'BrandingService',
        'AuthService',
        'UserService',
        'GroupService',
        'ProjectService',
        'OrgService',
        'ViewService',
        'ElementService',
        'PermissionService',
        'EventService',
    ];

    constructor(
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private brandingSvc: BrandingService,
        private authSvc: AuthService,
        private userSvc: UserService,
        private groupSvc: GroupService,
        private projectSvc: ProjectService,
        private orgSvc: OrgService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private permissionSvc: PermissionService,
        private eventSvc: EventService
    ) {}

    public getBanner(params?: ParamsObject): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getBanner(params);
    }

    public getLoginBanner(): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getLoginBanner();
    }

    public getFooter(params?: ParamsObject): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getFooter(params);
    }

    public getToken(): VePromise<string, CheckAuthResponse> {
        return new this.$q<string, CheckAuthResponse>((resolve, reject) => {
            this.authSvc.checkLogin().then(
                () => {
                    resolve(this.authSvc.getToken());
                },
                (rejection) => {
                    reject(rejection);
                }
            );
        });
    }

    public getCurrentUser(): VePromise<UserObject, UsersResponse> {
        return this.userSvc.getCurrentUser();
    }

    public getUser(username: string, refresh?: boolean): VePromise<UserObject, UsersResponse> {
        return this.userSvc.getUser(username, refresh);
    }

    public getUserGroups(username: string, refresh?: boolean): VePromise<GroupObject[], UserGroupsResponse> {
        return new this.$q((resolve, reject) => {
            this.userSvc.getUserGroups(username, refresh).then((result) => {
                this.groupSvc.getGroups(result).then((groups) => {
                    resolve(groups);
                }, reject);
            }, reject);
        });
    }

    public getUsers(refresh?: boolean): VePromise<UserObject[], UsersResponse> {
        return this.userSvc.getUsers(refresh);
    }

    public getOrg(orgId: string, refresh?: boolean): VePromise<OrgObject, OrgsResponse> {
        return this.orgSvc.getOrg(orgId, refresh);
    }

    public getProjectOrg(projectOb: ProjectObject, refresh?: boolean): VePromise<OrgObject, OrgsResponse> {
        return this.getOrg(projectOb.orgId, refresh);
    }

    public getOrgs(refresh?: boolean): VePromise<OrgObject[], OrgsResponse> {
        return this.orgSvc.getOrgs(refresh);
    }
    public getProject(params: ParamsObject, refresh?: boolean): VePromise<ProjectObject, ProjectsResponse> {
        const promise = this.projectSvc.getProject(params.projectId, refresh);
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsProject', result);
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message);
            }
        );
        return promise;
    }

    public getProjects(projectOb?: ProjectObject, refresh?: boolean): VePromise<ProjectObject[], ProjectsResponse> {
        const orgId = projectOb ? projectOb.orgId : null;
        const promise = this.projectSvc.getProjects(orgId, refresh);
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsProjects', result);
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message);
            }
        );
        return promise;
    }

    public getProjectMounts(params: ParamsObject, refresh?: boolean): VePromise<MountObject, ProjectsResponse> {
        const promise = this.projectSvc.getProjectMounts(params.projectId, params.refId, refresh);

        promise.then(
            (result) => {
                this.eventSvc.resolve<MountObject>('mmsProject', result);
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message);
            }
        );
        return promise;
    }

    public getRef(params: ParamsObject): VePromise<RefObject, RefsResponse> {
        const promise = this.projectSvc.getRef(params.refId, params.projectId);
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsRef', result);
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message);
            }
        );
        return promise;
    }

    public getRefs(params: ParamsObject): VePromise<RefObject[], RefsResponse> {
        const promise = this.projectSvc.getRefs(params.projectId);
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsRefs', result);
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message);
            }
        );
        return promise;
    }

    public getProjectGroups(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<ProjectGroupObject[], ProjectGroupsResponse> {
        return this.$q<ProjectGroupObject[], ProjectGroupsResponse>((resolve, reject) => {
            this.projectSvc.getGroups(params.projectId, params.refId, refresh).then(
                (result) => {
                    resolve(result);
                    this.eventSvc.resolve('mmsGroups', result);
                },
                (reason) => {
                    reject(reason);
                }
            );
        });
    }

    public getProjectGroup(groupObs: ProjectGroupObject[], documentOb: DocumentObject): ProjectGroupObject {
        let group: ProjectGroupObject = null;
        if (documentOb) {
            for (let i = 0; i < groupObs.length; i++) {
                if (groupObs[i].id == documentOb._groupId) {
                    group = groupObs[i];
                    break;
                }
            }
        }
        this.eventSvc.resolve('mmsGroup', group);
        return group;
    }

    public getProjectRoot(params: ParamsObject): VePromise<PackageObject> {
        return this.elementSvc.getElement({
            projectId: params.projectId,
            refId: params.refId,
            elementId: params.projectId + '_pm',
        });
    }

    public getServerRoot(): VePromise<AdminObject> {
        return this.$q.resolve({ id: 'server', name: 'MMS Server' });
    }

    public getCoverDocument(
        params: ParamsObject,
        refOb: RefObject,
        projectOb: ProjectObject,
        refresh?: boolean
    ): VePromise<DocumentObject> {
        const deferred = this.$q.defer<DocumentObject>();
        const eid = params.projectId + '_cover';
        this.elementSvc
            .getElement<DocumentObject>(
                {
                    projectId: params.projectId,
                    refId: params.refId,
                    elementId: eid,
                },
                2,
                refresh
            )
            .then(
                (data) => {
                    this.eventSvc.resolve<DocumentObject>('mmsDocument', data);
                    if (!data._groupId) data._groupId = params.projectId + '_pm';
                    deferred.resolve(data);
                },
                (reason) => {
                    if (reason.status === 404) {
                        if (refOb.type === 'Tag') {
                            deferred.resolve(null);
                        } else {
                            this.viewSvc
                                .createView(
                                    {
                                        _projectId: params.projectId,
                                        _refId: params.refId,
                                        id: 'holding_bin_' + params.projectId,
                                    },
                                    {
                                        name: projectOb.name + ' Cover Page',
                                        id: eid,
                                        _projectId: params.projectId,
                                        _refId: params.refId,
                                        documentation: '',
                                        _groupId: params.projectId + '_pm',
                                    }
                                )
                                .then(
                                    (data) => {
                                        this.eventSvc.resolve('mmsDocument', data);
                                        deferred.resolve(data);
                                    },
                                    (reason2) => {
                                        deferred.resolve(null);
                                    }
                                );
                        }
                    } else if (reason.status === 410) {
                        //resurrect
                        let name = projectOb.name + ' Cover Page ';
                        if (reason.data.deleted && reason.data.deleted.length > 0 && reason.data.deleted[0].name) {
                            name = reason.data.deleted[0].name;
                        }
                        this.elementSvc
                            .updateElements([
                                {
                                    _projectId: params.projectId,
                                    _refId: params.refId,
                                    id: eid,
                                    name: name,
                                    type: 'Class',
                                },
                            ])
                            .then(
                                (data) => {
                                    let resolved = false;
                                    if (data.length > 0) {
                                        data.forEach((e) => {
                                            if (e.id == eid) {
                                                deferred.resolve(e);
                                                resolved = true;
                                            }
                                        });
                                    }
                                    if (!resolved) {
                                        deferred.resolve(null);
                                    }
                                },
                                () => {
                                    deferred.resolve(null);
                                }
                            );
                    } else {
                        deferred.resolve(null); //let user get into project
                    }
                }
            );
        return deferred.promise;
    }

    public getPreviewDocument(params: ParamsObject, refOb: RefObject, refresh?: boolean): VePromise<DocumentObject> {
        const deferred = this.$q.defer<DocumentObject>();
        const eid: string = params.preview;
        const coverIndex = eid.indexOf('_cover');
        if (coverIndex > 0) {
            const groupId = eid.substring(5, coverIndex);
            this.elementSvc
                .getElement(
                    {
                        projectId: params.projectId,
                        refId: params.refId,
                        extended: true,
                        elementId: eid,
                    },
                    2,
                    refresh
                )
                .then(
                    (data) => {
                        this.eventSvc.resolve('mmsDocument', data);
                        deferred.resolve(data);
                    },
                    (reason) => {
                        if (reason.status === 404) {
                            if (refOb.type === 'Tag') {
                                deferred.resolve(null);
                            } else {
                                const viewDoc =
                                    '<transclude-group-docs mms-group-id="' +
                                    groupId +
                                    '">[cf:group docs]</transclude-group-docs>';
                                this.elementSvc
                                    .getElement(
                                        {
                                            projectId: params.projectId,
                                            refId: params.refId,
                                            elementId: groupId,
                                        },
                                        2,
                                        refresh
                                    )
                                    .then(
                                        (groupElement) => {
                                            this.viewSvc
                                                .createView(
                                                    {
                                                        _projectId: params.projectId,
                                                        _refId: params.refId,
                                                        id: groupId,
                                                    },
                                                    {
                                                        name: groupElement.name + ' Cover Page',
                                                        id: eid,
                                                        _projectId: params.projectId,
                                                        _refId: params.refId,
                                                        type: 'Class',
                                                        documentation: viewDoc,
                                                    }
                                                )
                                                .then(
                                                    (data) => {
                                                        this.eventSvc.resolve('mmsDocument', data);
                                                        deferred.resolve(data);
                                                    },
                                                    (reason3) => {
                                                        deferred.reject(reason);
                                                    }
                                                );
                                        },
                                        (reason2) => {
                                            deferred.reject(reason2);
                                        }
                                    );
                            }
                        } else {
                            deferred.reject(reason);
                        }
                    }
                );
        } else {
            this.getProjectDocument(params, refresh).then(
                (data) => {
                    deferred.resolve(data);
                },
                (reason) => {
                    deferred.reject(reason);
                }
            );
        }
        return deferred.promise;
    }

    public getProjectDocument(params: ParamsObject, refresh?: boolean): VePromise<ViewObject> {
        const promise = this.elementSvc.getElement(
            {
                projectId: params.projectId,
                refId: params.refId,
                elementId: params.preview ? params.preview : params.documentId,
            },
            2,
            refresh
        );

        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsDocument', result);
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message);
            }
        );
        return promise;
    }

    public getProjectDocuments(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<DocumentObject[], GenericResponse<DocumentObject>> {
        return new this.$q((resolve, reject) => {
            this.viewSvc
                .getProjectDocuments(
                    {
                        projectId: params.projectId,
                        refId: params.refId,
                    },
                    2,
                    refresh
                )
                .then(
                    (result) => {
                        resolve(result);
                        this.eventSvc.resolve('mmsDocuments', result);
                    },
                    (reason) => {
                        reject(reason);
                    }
                );
        });
    }

    public getView(params: ParamsObject, refresh?: boolean): VePromise<ViewObject> {
        const promise = this.elementSvc.getElement(
            {
                projectId: params.projectId,
                refId: params.refId,
                elementId: params.viewId,
            },
            2,
            refresh
        );

        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsView', result);
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message);
            }
        );
        return promise;
    }

    public getSearch = (params: ParamsObject): string => {
        if (params.search === undefined) {
            return null;
        }
        return params.search;
    };

    public getField = (params: ParamsObject): string => {
        if (params.field === undefined) {
            return 'all';
        }
        return params.field;
    };

    public getAdmin = (params: ParamsObject): VePromise<AdminObject> => {
        return new this.$q((resolve, reject) => {
            if (!params.type || !params.modify) {
                reject();
            } else {
                switch (params.type) {
                    case 'org':
                        this.orgSvc.getOrg(params.modify).then(resolve, reject);
                        break;
                    case 'project':
                        this.projectSvc.getProject(params.modify).then(resolve, reject);
                        break;
                    default:
                        reject();
                }
            }
        });
    };

    public initializePermission(
        orgId: string,
        projectId: string,
        refId: string
    ): VePromise<PermissionCache, PermissionResponse> {
        return this.permissionSvc.initializePermission(orgId, projectId, refId);
    }
}

veCore.service('ResolveService', ResolveService);
