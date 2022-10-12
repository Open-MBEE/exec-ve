import * as angular from "angular";

import {
    AuthService,
    CacheService,
    ElementService,
    PermissionsService,
    URLService,
    ViewService
} from "@ve-utils/mms-api-client"
import {
    EventService,
    AutosaveService,
    RootScopeService,
    UtilsService
} from "@ve-utils/services";
import {ElementObject} from "@ve-types/mms";
import {veCore} from "@ve-core";

export class CoreUtilsService {



    static $inject = ['$q', '$uibModal', '$timeout', '$compile', '$window', 'growl',
        'URLService', 'CacheService', 'ElementService', 'ViewService',  'UtilsService', 'AuthService',
        'PermissionsService', 'RootScopeService', 'EventService', 'AutosaveService']

    constructor(private $q, private $uibModal, private $timeout, private $compile, private $window, private growl,
                private uRLSvc : URLService, private cacheSvc : CacheService, private elementSvc : ElementService,
                private viewSvc : ViewService, private utilsSvc : UtilsService, private authSvc : AuthService,
                private permissionsSvc : PermissionsService, private rootScopeSvc : RootScopeService,
                private eventSvc : EventService, private autosaveSvc : AutosaveService) {

    }



    public successUpdates(elemType, id) {
        this.eventSvc.$broadcast('content-reorder.refresh');
        this.eventSvc.$broadcast('content-reorder-saved', {id: id});
        this.growl.success("Adding " + elemType + " Successful");
        // Show comments when creating a comment PE
        if (elemType === 'Comment' && !this.rootScopeSvc.veCommentsOn()) {
            this.$timeout(() => {
                $('.show-comments').click();
            }, 0, false);
        }
    }




}

veCore.service('CoreUtilsService', CoreUtilsService)
