import * as angular from "angular";
import * as _ from "lodash";
import {CacheService, ElementService, URLService} from "@ve-utils/mms-api-client";
import {
    CommitObject,
    CommitResponse,
    ElementObject, ElementsResponse,
    OrgObject,
    OrgsResponse,
    ProjectObject,
    RefObject,
    RequestObject
} from "@ve-types/mms";
import {veUtils} from "@ve-utils";
import {ApplicationService} from "@ve-utils/services";


/**
 * @ngdoc service
 * @name ProjectService
 * @requires $q
 * @requires $http
 * @requires ApplicationService
 * @requires CacheService
 * @requires ElementService
 * @requires URLService
 * @requires _
 *
 * @description
 * This is a utility service for getting project, ref, commit information
 */
export class ProjectService {

    private inProgress = {};

    static $inject = ['$q','$http','ApplicationService','CacheService','ElementService','URLService'];
    constructor(private $q, private $http, private applicationSvc : ApplicationService, private cacheSvc : CacheService,
                private elementSvc : ElementService, private uRLSvc : URLService) {

    }


    /**
     * @ngdoc method
     * @name ProjectService#getOrg
     * @methodOf ProjectService
     *
     * @description
     * Gets org information from mms
     *
     * @param {string} orgId id of org
     * @returns {Promise} Resolves to the org object.
     */
    public getOrg(orgId: string): angular.IPromise<OrgObject> {
        const deferred: angular.IDeferred<OrgObject> = this.$q.defer();
        const key = ['org', orgId];
        const urlkey = this.uRLSvc.getOrgURL(orgId);
        if (this.inProgress.hasOwnProperty(urlkey)) {
            return this.inProgress[urlkey];
        }
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get<OrgObject>(key));
        } else {
            this.inProgress[urlkey] = deferred.promise;
            this.$http.get(urlkey)
            .then((response: angular.IHttpResponse<OrgsResponse>) => {
                if (!response.data.orgs || response.data.orgs.length < 1) {
                    deferred.reject({status: 404, data: '', message: 'Org not found'});
                } else {
                    this.cacheSvc.put(key, response.data.orgs[0], true);
                    deferred.resolve(this.cacheSvc.get<OrgObject>(key));
                }
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[urlkey];
            });
        }
        return deferred.promise;
    }

    /**
     * @ngdoc method
     * @name ProjectService#getOrgs
     * @methodOf ProjectService
     *
     * @description
     * Gets orgs information
     *
     * @returns {Promise} Resolves into array of org objects.
     */
    public getOrgs(ignoreCache?: boolean): angular.IPromise<OrgObject[]> {
        const key = 'orgs';
        if (this.inProgress.hasOwnProperty(key)) {
            return this.inProgress[key];
        }
        const deferred = this.$q.defer();
        if (this.cacheSvc.exists(key) && !ignoreCache) {
            deferred.resolve(this.cacheSvc.get<OrgObject[]>(key));
        } else {
            this.inProgress[key] = deferred.promise;
            this.$http.get(this.uRLSvc.getOrgsURL())
            .then((response: angular.IHttpResponse<OrgsResponse>) => {
                const orgs: OrgObject[] = [];
                for (let i = 0; i < response.data.orgs.length; i++) {
                    const org = response.data.orgs[i];
                    this.cacheSvc.put(['org', org.id], org, true);
                    orgs.push(<OrgObject>this.cacheSvc.get<OrgObject>(['org', org.id]));
                }
                this.cacheSvc.put(key, orgs, false);
                deferred.resolve(this.cacheSvc.get<OrgObject[]>(key));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[key];
            });
        }
        return deferred.promise;
    }

    public createOrg(name: string): angular.IPromise<OrgObject> {
        const deferred: angular.IDeferred<OrgObject> = this.$q.defer()
        const url = this.uRLSvc.getOrgsURL();
        this.$http.post(url, {'orgs': {'name': name}, 'source': this.applicationSvc.getSource()})
            .then((response: angular.IHttpResponse<OrgsResponse>) => {
                const org = response.data.orgs[0];
                const key = ['org', org.id];
                this.cacheSvc.put(key, response.data.orgs[0], true);
                deferred.resolve(this.cacheSvc.get<OrgObject>(key));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            });
        return deferred.promise;
    }

    public getProjects(orgId?: string, ignoreCache?: boolean): angular.IPromise<ProjectObject[]> {
        const deferred: angular.IDeferred<ProjectObject[]> = this.$q.defer();
        const url = this.uRLSvc.getProjectsURL(orgId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        const cacheKey = !orgId ? 'projects' : ['projects', orgId];
        if (this.cacheSvc.exists(cacheKey) && !ignoreCache) {
            deferred.resolve(this.cacheSvc.get<ProjectObject[]>(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!Array.isArray(response.data.projects)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                const orgProjects = {};
                for (let i = 0; i < response.data.projects.length; i++) {
                    const project = response.data.projects[i];
                    const porg = project.orgId;
                    this.cacheSvc.put(['project', project.id], project, true);
                    if(orgProjects[porg] === undefined) {
                        orgProjects[porg] = [];
                    }
                    orgProjects[porg].push(this.cacheSvc.get<ProjectObject>(['project', project.id]));
                }
                $.each(orgProjects, (i, val) => {
                    const orgCacheKey = ['projects', i];
                    this.cacheSvc.put(orgCacheKey, val, false);
                });
                deferred.resolve(this.cacheSvc.get<ProjectObject[]>(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    }

    public getProject(projectId): angular.IPromise<ProjectObject> {
        const deferred: angular.IDeferred<ProjectObject> = this.$q.defer();
        const url = this.uRLSvc.getProjectURL(projectId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        const cacheKey = ['project', projectId];
        if (this.cacheSvc.exists(cacheKey))
            deferred.resolve(this.cacheSvc.get<ProjectObject>(cacheKey));
        else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!Array.isArray(response.data.projects) || response.data.projects.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                this.cacheSvc.put(cacheKey, response.data.projects[0], true);
                deferred.resolve(this.cacheSvc.get<ProjectObject>(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    }

    public getProjectMounts(projectId: string, refId: string, resolve?: boolean): angular.IPromise<ProjectObject> {
        const deferred: angular.IDeferred<ProjectObject> = this.$q.defer();
        if (resolve) {
            var projPromise: angular.IPromise<ProjectObject> = this.getProject(projectId);
        }
        const url = this.uRLSvc.getProjectMountsURL(projectId, refId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        const cacheKey = ['project', projectId, refId];
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get<ProjectObject>(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!Array.isArray(response.data.projects) || response.data.projects.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                let projectOb;
                if (resolve) {
                    projPromise.then((projResponse) => {
                        projectOb = projResponse;
                        projectOb._mounts = response.data.projects[0]._mounts;
                        this.cacheSvc.put(cacheKey, projectOb, true);
                        deferred.resolve(this.cacheSvc.get<ProjectObject>(cacheKey));
                    })
                }else {
                    projectOb = response.data.projects[0];
                    this.cacheSvc.put(cacheKey, projectOb, true);
                    deferred.resolve(this.cacheSvc.get<ProjectObject>(cacheKey));
                }
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    }

    public getRefs(projectId: string): angular.IPromise<RefObject[]> {
        const cacheKey = ['refs', projectId];
        const url = this.uRLSvc.getRefsURL(projectId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        const deferred: angular.IDeferred<RefObject[]> = this.$q.defer();
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get<RefObject[]>(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!Array.isArray(response.data.refs)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                const refs: RefObject[] = [];
                for (let index = 0; index < response.data.refs.length; index++) {
                    const ref: RefObject = response.data.refs[index];
                    if (ref.id === 'master') {
                        ref.type = 'Branch';
                    }
                    this.cacheSvc.put(['ref', projectId, ref.id], ref, true);
                    refs.push(<RefObject>this.cacheSvc.get<RefObject>(['ref', projectId, ref.id]));
                }
                this.cacheSvc.put(cacheKey, refs, false);
                deferred.resolve(this.cacheSvc.get<RefObject[]>(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    }

    public getRef(refId: string, projectId: string): angular.IPromise<RefObject> {
        const deferred: angular.IDeferred<RefObject> = this.$q.defer();
        this.getRefs(projectId).then((data) => {
            const result = this.cacheSvc.get<RefObject>(['ref', projectId, refId]);
            if (result) {
                deferred.resolve(result);
            } else {
                deferred.reject({status: 404, data: '', message: "Ref not found"});
            }
        }, (reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }

    public getRefHistory(refId: string, projectId: string, timestamp: string): angular.IPromise<CommitObject[]> {
        const deferred: angular.IDeferred<CommitObject[]> = this.$q.defer();
        let url;
        if (timestamp !== null) {
            url = this.uRLSvc.getRefHistoryURL(projectId, refId, timestamp);
        } else {
            url = this.uRLSvc.getRefHistoryURL(projectId, refId);
        }
        this.inProgress[url] = deferred.promise;
        this.$http.get(url).then((response: angular.IHttpResponse<CommitResponse>) => {
            if (!Array.isArray(response.data.commits) || response.data.commits.length === 0) {
                deferred.reject({status: 500, data: '', message: "Error: Project does not exist at specified time."});
                return;
            }
            deferred.resolve(response.data.commits);
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        }).finally(() => {
            delete this.inProgress[url];
        });
        return deferred.promise;
    }

    public createRef(refOb: RefObject, projectId: string): angular.IPromise<RefObject> {
        const deferred: angular.IDeferred<RefObject> = this.$q.defer();
        const url = this.uRLSvc.getRefsURL(projectId);
        this.$http.post(url, {'refs': [refOb], 'source': this.applicationSvc.getSource()})
        .then((response) => {
            if (!Array.isArray(response.data.refs) || response.data.refs.length === 0) {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                return;
            }
            const createdRef = response.data.refs[0];
            const list = this.cacheSvc.get<RefObject[]>(['refs', projectId]);
            if (list) {
                list.push(createdRef);
            }
            this.cacheSvc.put(['ref', projectId, createdRef.id], createdRef)
            deferred.resolve(this.cacheSvc.get<RefObject>(['ref', projectId, createdRef.id]));
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    }

    public updateRef(refOb:RequestObject, projectId: string): angular.IPromise<RefObject> {
        const deferred: angular.IDeferred<RefObject> = this.$q.defer();
        const url = this.uRLSvc.getRefsURL(projectId);
        this.$http.post(url, {'refs': [refOb], 'source': this.applicationSvc.getSource()})
        .then((response) => {
            if (!Array.isArray(response.data.refs) || response.data.refs.length === 0) {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                return;
            }
            const resp = response.data.refs[0];
            this.cacheSvc.put(['ref', projectId, resp.id], resp, true)
            deferred.resolve(this.cacheSvc.get<RefObject>(['ref', projectId, resp.id]));
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    }

    public deleteRef(refId: string, projectId: string): angular.IPromise<boolean> {
        const deferred: angular.IDeferred<boolean> = this.$q.defer();
        const url = this.uRLSvc.getRefURL(projectId, refId);
        this.$http.delete(url).then((response) => {
            const key = ['ref', projectId, refId];
            const refOb = this.cacheSvc.get<RefObject>(key);
            if (refOb) {
                this.cacheSvc.remove(key);
                const list = this.cacheSvc.get<RefObject[]>(['refs', projectId]);
                if (list) {
                    for (let i = 0; i < list.length; i++) {
                        if (list[i].id === refOb.id) {
                            list.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            deferred.resolve(true);
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    }

    public getGroups(projectId: string, refId: string, ignoreCache?: boolean): angular.IPromise<ElementObject[]> {
        refId = refId ? refId : 'master';
        const cacheKey = ['groups', projectId, refId];
        const url = this.uRLSvc.getGroupsURL(projectId, refId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        const deferred: angular.IDeferred<ElementObject[]> = this.$q.defer();
        if (this.cacheSvc.exists(cacheKey) && !ignoreCache) {
            deferred.resolve(this.cacheSvc.get<ElementObject[]>(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!Array.isArray(response.data.groups)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                const groups: ElementObject[] = [];
                const reqOb = {projectId: projectId, refId: refId, commitId: 'latest', elementId: ''};
                for (let i = 0; i < response.data.groups.length; i++) {
                    let group: ElementObject = response.data.groups[i];
                    reqOb.elementId = group.id;
                    group = this.elementSvc.cacheElement(reqOb, group, false);
                    this.cacheSvc.put(['group', projectId, refId, group.id], group, true);
                    groups.push(<ElementObject>this.cacheSvc.get<ElementObject>(['group', projectId, refId, group.id]));
                }
                const cachedGroups = this.cacheSvc.put(cacheKey, groups, false);
                deferred.resolve(this.cacheSvc.get<ElementObject[]>(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    }

    public getGroup(id: string, projectId: string, refId: string): angular.IPromise<ElementObject> {
        const deferred: angular.IDeferred<ElementObject> = this.$q.defer();
        this.getGroups(projectId, refId).then((data) => {
            const result = this.cacheSvc.get<ElementObject>(['group', projectId, refId, id]);
            if (result) {
                deferred.resolve(result);
            } else {
                deferred.reject({status: 404, data: '', message: "Group not found"});
            }
        }, (reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    }

    public reset() {
        this.inProgress = {};
    }

}

veUtils.service('ProjectService', ProjectService);