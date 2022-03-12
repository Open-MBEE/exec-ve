import * as angular from 'angular';
import {UIRouter, Transition} from "@uirouter/angularjs";
var mmsApp = angular.module('mmsApp');

import {BrandingService} from "../../mms/services/BrandingService.service"
import {URLService} from "../../mms/services/URLService.provider";
import {AuthService} from "../../mms/services/AuthorizationService.service";
import {ApplicationService} from "../../mms/services/ApplicationService.service";
import {ProjectService} from "../../mms/services/ProjectService.service";
import {ViewService} from "../../mms/services/ViewService.service";
import {ElementService} from "../../mms/services/ElementService.service";
import {PermissionsService} from "../../mms/services/PermissionsService.service";
import {ngStorage} from "ngstorage";

export class ResolveService {

    constructor(private $window: angular.IWindowService, private $q: angular.IQService, private $cookies: angular.cookies.ICookiesService, private $uiRouter : UIRouter, private brandingSvc : BrandingService,
                private uRLSvc : URLService, private authSvc: AuthService, private projectSvc: ProjectService,
                private applicationSvc: ApplicationService, private viewSvc: ViewService,
                private elementSvc: ElementService, private permissionsSvc: PermissionsService
    ) {

    }

    public getBanner() {
        return this.brandingSvc.getBanner();
    }

    public getLoginBanner() {
        return this.brandingSvc.getLoginBanner();
    }
    public getToken() {
        var deferred = this.$q.defer();
        this.authSvc.checkLogin().then((data) => {
            this.applicationSvc.setUserName(data);
            this.uRLSvc.setToken(this.$window.localStorage.getItem('token'));
            deferred.resolve(this.$window.localStorage.getItem('token'));
            this.$cookies.put('com.tomsawyer.web.license.user', data, {path: '/'});
        }, (rejection) => {
            deferred.reject(rejection);
        });
        return deferred.promise;
    }

    public getOrg(projectOb) {
        return this.projectSvc.getOrg(projectOb.orgId);
    }

    public getOrgs() {
        return this.projectSvc.getOrgs();
    }

    public getProject($transition$: Transition) {
        return this.projectSvc.getProject($transition$.params().projectId);
    }

    public getProjects(projectOb) {
        return this.projectSvc.getProjects(projectOb.orgId);
    }

    public getProjectMounts($transition$) {
        let params = $transition$.params();
        return this.projectSvc.getProjectMounts(params.projectId, params.refId, true)
    }

    public getRef($transition$) {
        let params = $transition$.params()
        return this.projectSvc.getRef(params.refId, params.projectId);
    }

    public getRefs($transition$) {
        return this.projectSvc.getRefs($transition$.params().projectId);
    }

    private _filterRefs(refType: string, refObs: Array<any>) {
        let ret = [];
        refObs.forEach((ref) => {
                if (ref.type === refType) {
                    ret.push(ref);
                }
            }

        )
        return ret;
    }

    public getTag(refOb) {
        return this._filterRefs("Tag", [refOb]);
    }

    public getTags(refObs) {
        return this._filterRefs("Tag", refObs);
    }

    public getBranch(refOb) {
        return this._filterRefs("Branch", [refOb]);
    }

    public getBranches(refObs) {
        return this._filterRefs("Branch", refObs);
    }

    public getGroups($transition$) {
        let params = $transition$.params();
        return this.projectSvc.getGroups(params.projectId, params.refId)
    }

    public getDocument($transition$, refOb, projectOb) {
        var deferred = this.$q.defer();
        var params = $transition$.params();
        var eid = params.projectId + '_cover';
        this.elementSvc.getElement({
            projectId: params.projectId,
            refId: params.refId,
            extended: true,
            elementId: eid
        }, 2).then((data) => {
            deferred.resolve(data);
        }, (reason) => {
            if (reason.status === 404) {
                if (refOb.type === 'Tag') {
                    deferred.resolve(null);
                } else {
                    this.viewSvc.createView({
                        _projectId: params.projectId,
                        _refId: params.refId,
                        id: 'holding_bin_' + params.projectId
                    },{
                        viewName: projectOb.name + ' Cover Page',
                        viewId: eid
                    }, 2).then((data) => {
                        deferred.resolve(data);
                    }, (reason2) => {
                        deferred.resolve(null);
                    });
                }
            } else if (reason.status === 410) { //resurrect
                var name = projectOb.name + ' Cover Page ';
                try {
                    name = reason.data.deleted[0].name + ' ';
                } catch(e) {}
                this.elementSvc.updateElements([
                    {
                        _projectId: params.projectId,
                        _refId: params.refId,
                        id: eid,
                        name: name
                    },
                    {
                        _projectId: params.projectId,
                        _refId: params.refId,
                        id: eid + "_asi",
                        name: ' '
                    }
                ]).then((data) => {
                    var resolved = false;
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
                }, () => {
                    deferred.resolve(null);
                });
            } else {
                deferred.resolve(null); //let user get into project
            }
        });
        return deferred.promise;
    }

    public getDocumentPreview($transition$, refOb) {
        let params = $transition$.params();
        var deferred = this.$q.defer();
        var eid = params.documentId;
        var coverIndex = eid.indexOf('_cover');
        if (coverIndex > 0) {
            var groupId = eid.substring(5, coverIndex);
            this.elementSvc.getElement({
                projectId: params.projectId,
                refId: params.refId,
                extended: true,
                elementId: eid
            }, 2).then(function(data) {
                deferred.resolve(data);
            }, function(reason) {
                if (reason.status === 404) {
                    if (refOb.type === 'Tag') {
                        deferred.resolve(null);
                    } else {
                        var viewDoc = '<mms-group-docs mms-group-id="' + groupId + '">[cf:group docs]</mms-group-docs>';
                        this.elementSvc.getElement({projectId: params.projectId, refId: params.refId, elementId: groupId})
                            .then(function(groupElement) {
                                this.viewSvc.createView({
                                    _projectId: params.projectId,
                                    _refId: params.refId,
                                    id: groupId
                                },{
                                    viewName: groupElement.name + ' Cover Page',
                                    viewId: eid
                                }, viewDoc)
                                    .then(function(data) {
                                        deferred.resolve(data);
                                    }, function(reason3) {
                                        deferred.resolve(null);
                                    });
                            }, function(reason2) {
                                deferred.resolve(null);
                            });
                    }
                } else {
                    deferred.reject(reason);
                }
            });
        } else {
            this.viewSvc.getProjectDocument({
                projectId: params.projectId,
                refId: params.refId,
                extended: false,
                documentId: params.documentId
            }, 2).then(function(data){
                deferred.resolve(data);
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    }

    public getSearch($transition$) {
        var params = $transition$.params();
        if (params.search === undefined) {
            return null;
        }
        return params.search;
    }

    public getFooter() {
        return this.brandingSvc.getFooter();
    }

    public initializePermissions(projectOb, refOb) {
        return this.permissionsSvc.initializePermissions(projectOb,refOb)
    }

}

ResolveService.$inject = ['$window', '$q', '$cookies', '$uiRouter', 'BrandingService', 'URLService',
    'AuthService', 'ProjectService', 'ApplicationService', 'ViewService', 'ElementService', 'PermissionsService'];

mmsApp.service('ResolveService',ResolveService);