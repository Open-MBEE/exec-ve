import * as angular from 'angular'
import {URLService} from "./URL.provider";
var veUtils = angular.module('veUtils');

/**
 * @ngdoc service
 * @name PermissionsService
 *
 * @requires $q
 * @requires $http
 * @requires URLService
 *
 * @description
 * This utility service handles permissions inquiries
 */
export class PermissionsService {
    
    private permissions = {project: {}, ref:{}};

    constructor(private $q, private $http, private uRLSvc : URLService) {}

    public initializePermissions(projectOb, refOb) {
        var url = this.uRLSvc.getPermissionsLookupURL();
       
        var deferred = this.$q.defer();                

        this.$http.put(url, { "lookups" : [ 
            {
                "type" : "PROJECT",
                "projectId": projectOb.id,
                "privilege": "PROJECT_EDIT"
            },
            {
                "type" : "BRANCH",
                "projectId": refOb._projectId,
                "refId": refOb.id,
                "privilege": "BRANCH_EDIT_CONTENT"
            }
         ] })
        .then((response) => {
            var data = response.data.lookups;
            if (angular.isArray(data) && data.length > 0) {
                for(var i in data) {
                    var d = data[i];                    
                    if(d.type == 'PROJECT'){
                        this.permissions.project[d.projectId] = d.hasPrivilege;                        
                    } else {
                        this.permissions.ref[d.projectId + '/' + d.refId] = d.hasPrivilege;
                    }                    
                }                
                deferred.resolve(this.permissions);
            } else {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
            }
        }, (response) => {
            this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });   
        
        return deferred.promise;
    };

    public hasProjectEditPermission(projectOb) {
        return this.permissions.project[projectOb];
    };

    public hasBranchEditPermission(refOb) {
        return this.hasProjectIdBranchIdEditPermission(refOb._projectId, refOb.id);
    };

    public hasProjectIdBranchIdEditPermission(projectId, refId) {
        return this.permissions.ref[projectId + "/" + refId];
    };

}

PermissionsService.$inject = ['$q', '$http', 'URLService'];


veUtils.service('PermissionsService', PermissionsService);