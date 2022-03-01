import * as angular from "angular";
import * as _ from "lodash";
import {ApplicationService} from "./ApplicationService.service";
import {CacheService} from "./CacheService.factory";
import {ElementService} from "./ElementService.factory";
import {URLService} from "./URLService.provider";
var mms = angular.module('mms');





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
    /**
     * List of appliedSterotypes and types to not include in metatype search dropdown
     */
    private metatypeFilterMustNotList = [
        {
            "terms": {
                "_appliedStereotypeIds": ["_17_0_5_407019f_1336584858932_290814_11897", "_17_0_2_407019f_1354126823633_971278_12922", "_17_0_2_3_407019f_1390932205525_919663_29081", "_17_0_1_407019f_1328144768208_151103_11611", "_18_5_8bf0285_1486490948776_422870_16475", "_17_0_2_3_407019f_1380044908011_537162_29414", "_18_0_6_8bf0285_1480702282066_678566_13974", "_18_0_5_407019f_1470005595314_374414_14088", "_17_0_1_407019f_1320688868391_878682_2122", "_17_0_5_407019f_1334873987130_64195_11860", "_17_0_1_244d03ea_1319490838789_76536_23321", "_17_0_1_244d03ea_1319490696098_585884_23244", "_17_0_1_244d03ea_1319490675924_494597_23220", "_17_0_2_3_e81034b_1378849795852_475880_29502", "_17_0_1_244d03ea_1319490856319_735016_23345", "_17_0_5_407019f_1346952773459_128964_11915", "_17_0_1_244d03ea_1319492675769_542703_24690", "_17_0_1_244d03ea_1319490805237_397889_23292", "_17_0_1_244d03ea_1319491813759_405316_23859", "_17_0_1_22b603cd_1319577320837_597116_24044", "_17_0_1_244d03ea_1319490870282_714178_23369", "_17_0_1_244d03ea_1319490921274_829705_23417", "_17_0_2_3_e81034b_1378849355455_639118_29417", "_17_0_1_244d03ea_1319490658057_783239_23196", "_17_0_1_244d03ea_1319490607459_890787_23148", "_17_0_1_244d03ea_1319490639053_446661_23172", "_17_0_1_24c603f9_1318965749289_636288_15241", "_17_0_1_244d03ea_1319490721410_468874_23268", "_17_0_1_244d03ea_1319490880431_889010_23393", "_17_0_2_3_407019f_1377878750778_198079_29401", "_17_0_2_3_407019f_1377881591361_754431_29966", "_17_0_5_407019f_1337970852079_693660_12393", "_17_0_2_3_407019f_1377878719961_37575_29374", "_17_0_1_24c603f9_1318965764947_847626_15265", "_17_0_2_1_407019f_1358445062164_196970_12977", "_17_0_1_244d03ea_1319496225382_275996_25443", "_17_0_1_244d03ea_1319498258297_961829_27083", "_17_0_1_244d03ea_1319496302084_771803_25570", "_17_0_1_244d03ea_1319496280368_246829_25514", "_18_5_2_8bf0285_1506039168690_925234_16001", "_17_0_1_407019f_1326235066484_404532_2489", "_17_0_1_244d03ea_1319512564304_251824_28229", "_18_0_5_ef50357_1480453603002_831462_13966", "_17_0_2_3_407019f_1383246724224_41450_29079", "_17_0_2_3_407019f_1375477696989_696093_29350", "_17_0_2_3_407019f_1375478079564_152907_29404", "_17_0_2_3_407019f_1392933505529_270043_29089", "_17_0_2_3_e9f034d_1375474838719_217024_29345", "_17_0_2_3_eac0346_1374702066208_763130_29330", "_17_0_2_3_eac0346_1374701945748_238477_29309", "_17_0_2_3_407019f_1383165357327_898985_29071", "_9_0_be00301_1108044380615_150487_0", "_10_0_622020d_1127207234373_259585_1", "_12_1_8f90291_1173963323875_662612_98", "_16_0_62a020a_1227788740027_441955_240", "_17_0_2_3_ff3038a_1383749269646_31940_44489", "_16_5beta1_8ba0276_1232443673758_573873_267", "_9_0_be00301_1108044563999_784946_1", "_11_5EAPbeta_be00301_1151484491369_618395_1", "_15_5EAPbeta1_8f90291_1207743469046_796042_162", "_18_0beta_8e8028e_1384177586203_506524_3245", "_9_0_be00301_1108044721245_236588_411", "_17_0_2beta_903028d_1330931963982_116619_1920", "_18_5beta_8ba0279_1468931052415_679497_4210", "_17_0_2beta_903028d_1330931963978_770627_1918", "_18_1_8760276_1416414449210_764904_3981", "_17_0_5beta_f720368_1373961709543_89140_3280", "_9_0_be00301_1108044705753_203399_228"]
            }
        },
        {
            "terms": {
                "type": ["Dependency", "Abstraction", "ComponentRealization", "InterfaceRealization", "Deployment", "Manifestation", "Realization", "Substitution", "Usage", "ElementImport", "Extend", "Include", "InformationFlow", "PackageImport", "ProfileApplication", "ProtocolConformance", "TemplateBinding", "Generalization", "Association", "Connector", "ConnectorEnd", "ControlFlow", "ObjectFlow", "Mount", "FinalNode", "JoinNode", "ForkNode", "MergeNode", "FlowFinalNode", "InitialNode", "ActivityFinalNode", "ActivityPartition", "DecisionNode", "Transition"]
            }
        }
    ];
    
    constructor(private $q, private $http, private applicationSvc : ApplicationService, private cacheSvc : CacheService, private elementSvc : ElementService, private uRLSvc : URLService) {
        
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
    public getOrg(orgId) {
        var deferred = this.$q.defer();
        var key = ['org', orgId];
        var urlkey = this.uRLSvc.getOrgURL(orgId);
        if (this.inProgress.hasOwnProperty(urlkey)) {
            return this.inProgress[urlkey];
        }
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get(key));
        } else {
            this.inProgress[urlkey] = deferred.promise;
            this.$http.get(urlkey)
            .then((response) => {
                if (!response.data.orgs || response.data.orgs.length < 1) {
                    deferred.reject({status: 404, data: '', message: 'Org not found'});
                } else {
                    this.cacheSvc.put(key, response.data.orgs[0], true);
                    deferred.resolve(this.cacheSvc.get(key));
                }
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[urlkey];
            });
        }
        return deferred.promise;
    };

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
    public getOrgs() {
        var key = 'orgs';
        if (this.inProgress.hasOwnProperty(key)) {
            return this.inProgress[key];
        }
        var deferred = this.$q.defer();
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get(key));
        } else {
            this.inProgress[key] = deferred.promise;
            this.$http.get(this.uRLSvc.getOrgsURL())
            .then((response) => {
                var orgs = [];
                for (var i = 0; i < response.data.orgs.length; i++) {
                    var org = response.data.orgs[i];
                    this.cacheSvc.put(['org', org.id], org, true);
                    orgs.push(this.cacheSvc.get(['org', org.id]));
                }
                this.cacheSvc.put(key, orgs, false);
                deferred.resolve(this.cacheSvc.get(key));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[key];
            });
        }
        return deferred.promise;
    };

    public getProjects(orgId) {
        var deferred = this.$q.defer();
        var url = this.uRLSvc.getProjectsURL(orgId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        var cacheKey = !orgId ? 'projects' : ['projects', orgId];
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!angular.isArray(response.data.projects)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var orgProjects = {};
                for (var i = 0; i < response.data.projects.length; i++) {
                    var project = response.data.projects[i];
                    var porg = project.orgId;
                    this.cacheSvc.put(['project', project.id], project, true);
                    if(orgProjects[porg] === undefined) {
                        orgProjects[porg] = [];
                    }
                    orgProjects[porg].push(this.cacheSvc.get(['project', project.id]));
                }
                $.each(orgProjects, (i, val) => {
                    var orgCacheKey = ['projects', i];
                    this.cacheSvc.put(orgCacheKey, val, false);
                });
                deferred.resolve(this.cacheSvc.get(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    };

    public getProject(projectId) {
        var deferred = this.$q.defer();
        var url = this.uRLSvc.getProjectURL(projectId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        var cacheKey = ['project', projectId];
        if (this.cacheSvc.exists(cacheKey))
            deferred.resolve(this.cacheSvc.get(cacheKey));
        else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!angular.isArray(response.data.projects) || response.data.projects.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                this.cacheSvc.put(cacheKey, response.data.projects[0], true);
                deferred.resolve(this.cacheSvc.get(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    };

    public getProjectMounts(projectId, refId) {
        var deferred = this.$q.defer();
        var url = this.uRLSvc.getProjectMountsURL(projectId, refId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        var cacheKey = ['project', projectId, refId];
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!angular.isArray(response.data.projects) || response.data.projects.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                this.cacheSvc.put(cacheKey, response.data.projects[0], true);
                deferred.resolve(this.cacheSvc.get(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    };

    public getRefs(projectId) {
        var cacheKey = ['refs', projectId];
        var url = this.uRLSvc.getRefsURL(projectId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        var deferred = this.$q.defer();
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!angular.isArray(response.data.refs)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var refs = [];
                for (var index = 0; index < response.data.refs.length; index++) {
                    var ref = response.data.refs[index];
                    if (ref.id === 'master') {
                        ref.type = 'Branch';
                    }
                    this.cacheSvc.put(['ref', projectId, ref.id], ref, true);
                    refs.push(this.cacheSvc.get(['ref', projectId, ref.id]));
                }
                this.cacheSvc.put(cacheKey, refs, false);
                deferred.resolve(this.cacheSvc.get(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    };

    public getRef(refId, projectId) {
        var deferred = this.$q.defer();
        this.getRefs(projectId).then((data) => {
            var result = this.cacheSvc.get(['ref', projectId, refId]);
            if (result) {
                deferred.resolve(result);
            } else {
                deferred.reject({status: 404, data: '', message: "Ref not found"});
            }
        }, (reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    public getRefHistory(refId, projectId, timestamp) {
        var deferred = this.$q.defer();
        var url;
        if (timestamp !== null) {
            url = this.uRLSvc.getRefHistoryURL(projectId, refId, timestamp);
        } else {
            url = this.uRLSvc.getRefHistoryURL(projectId, refId);
        }
        this.inProgress[url] = deferred.promise;
        this.$http.get(url).then((response) => {
            if (!angular.isArray(response.data.commits) || response.data.commits.length === 0) {
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
    };

    public createRef(refOb, projectId) {
        var deferred = this.$q.defer();
        var url = this.uRLSvc.getRefsURL(projectId);
        this.$http.post(url, {'refs': [refOb], 'source': this.applicationSvc.getSource()})
        .then((response) => {
            if (!angular.isArray(response.data.refs) || response.data.refs.length === 0) {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                return;
            }
            var createdRef = response.data.refs[0];
            var list = this.cacheSvc.get(['refs', projectId]);
            if (list) {
                list.push(createdRef);
            }
            deferred.resolve(this.cacheSvc.put(['ref', projectId, createdRef.id], createdRef));
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    };

    public updateRef(refOb, projectId) {
        var deferred = this.$q.defer();
        var url = this.uRLSvc.getRefsURL(projectId);
        this.$http.post(url, {'refs': [refOb], 'source': this.applicationSvc.getSource()})
        .then((response) => {
            if (!angular.isArray(response.data.refs) || response.data.refs.length === 0) {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                return;
            }
            var resp = response.data.refs[0];
            deferred.resolve(this.cacheSvc.put(['ref', projectId, resp.id], resp, true));
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    };

    public deleteRef(refId, projectId) {
        var deferred = this.$q.defer();
        var url = this.uRLSvc.getRefURL(projectId, refId);
        this.$http.delete(url).then((response) => {
            var key = ['ref', projectId, refId];
            var refOb = this.cacheSvc.get(key);
            if (refOb) {
                this.cacheSvc.remove(key);
                var list = this.cacheSvc.get(['refs', projectId]);
                if (list) {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].id === refOb.id) {
                            list.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            deferred.resolve('');
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    };

    public getGroups(projectId, refId) {
        refId = refId ? refId : 'master';
        var cacheKey = ['groups', projectId, refId];
        var url = this.uRLSvc.getGroupsURL(projectId, refId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        var deferred = this.$q.defer();
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            this.$http.get(url).then((response) => {
                if (!angular.isArray(response.data.groups)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var groups = [];
                var reqOb = {projectId: projectId, refId: refId, commitId: 'latest', elementId: ''};
                for (var i = 0; i < response.data.groups.length; i++) {
                    var group = response.data.groups[i];
                    reqOb.elementId = group.id;
                    group = this.elementSvc.cacheElement(reqOb, group, false);
                    this.cacheSvc.put(['group', projectId, refId, group.id], group, true);
                    groups.push(this.cacheSvc.get(['group', projectId, refId, group.id]));
                }
                this.cacheSvc.put(cacheKey, groups, false);
                deferred.resolve(this.cacheSvc.get(cacheKey));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    };

    public getGroup(id, projectId, refId) {
        var deferred = this.$q.defer();
        this.getGroups(projectId, refId).then((data) => {
            var result = this.cacheSvc.get(['group', projectId, refId, id]);
            if (result) {
                deferred.resolve(result);
            } else {
                deferred.reject({status: 404, data: '', message: "Group not found"});
            }
        }, (reason) => {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    public getMetatypes(projectId, refId) {
        refId = refId ? refId : 'master';
        var cacheKey = ['metatypes', projectId, refId];
        var url = this.uRLSvc.getSearchURL(projectId, refId);
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url];
        }
        var deferred = this.$q.defer();
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get(cacheKey));
        } else {
            this.inProgress[url] = deferred.promise;
            var query = this._getMetatypeFilter(projectId, refId);
            this.$http.put(url, query).then((response) => {
                var aggregations = response.data.aggregations;
                if (!angular.isDefined(aggregations)) {
                    deferred.reject({status: 500, data: '', message: "Could not find metatypes"});
                    return;
                }
                var metatypeList = [];
                // Get metatype buckets for `types` and add to metatype list
                var typeIds = aggregations.elements.types.buckets;
                var typeKeyList = _.map(typeIds, (obj) =>{ return {id: obj.key, name: obj.key}; });
                metatypeList = typeKeyList;
                // Get metatype buckets for `stereotypedElements` and get elements
                // before adding to metatype list (need name for dropdown)
                var stereotypeIds = aggregations.stereotypedElements.stereotypeIds.buckets;
                var stereotypeKeyList = _.pluck(stereotypeIds, 'key');
                var reqOb = {elementIds: stereotypeKeyList, projectId: projectId, refId: refId};
                this.elementSvc.getElements(reqOb,2).then((data) => {
                    var steroObjList = _.map(data, (obj) =>{ return {id: obj.id, name: obj.name}; });
                    metatypeList = metatypeList.concat(steroObjList);
                    this.cacheSvc.put(cacheKey, metatypeList, false);
                    deferred.resolve(this.cacheSvc.get(cacheKey));
                });
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(() => {
                delete this.inProgress[url];
            });
        }
        return deferred.promise;
    };

    private _getMetatypeFilter(projectId, refId) {
        return {
        "size": 0,
        "aggs": {
          "stereotypedElements": {
              "filter": { "bool": {
                  "must": [
                      {"term": {"_projectId": projectId}},
                      {"term": {"_inRefIds": refId}},
                      {"exists": {"field": "_appliedStereotypeIds"}}
                  ],
                  "must_not": this.metatypeFilterMustNotList
              }},
              "aggs": {
                  "stereotypeIds": {
                      "terms": {
                          "field": "_appliedStereotypeIds",
                          "size": 20
                      }
                  }
              }
          },
         "elements": {
              "filter": { "bool": {
                  "must": [
                      {"term": {"_projectId": projectId}},
                      {"term": {"_inRefIds": refId}}
                  ],
                 "must_not" : this.metatypeFilterMustNotList
              }},
              "aggs": {
                  "types": {
                      "terms": {
                          "field": "type",
                          "size": 20
                      }
                  }
              }
          }
        }
      };
    };

    public reset() {
        this.inProgress = {};
    };

}

mms.factory('ProjectService', ['this.$q','this.$http','ApplicationService','CacheService','ElementService','URLService',ProjectService]);