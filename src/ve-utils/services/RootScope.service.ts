import * as angular from 'angular'
import {SessionService} from "./Session.service";
var veUtils = angular.module('veUtils');

export class RootScopeService {
    
    public constants = {
        LOGINMODALOPEN: 'login-modal-open',
        MMSREFOB: 'mms-ref-ob',
        RIGHTPANETOGGLEABLE: 'mms-pane-toggleable',
        RIGHTPANECLOSED: 'mms-pane-closed',
        VETITLE: 've-title',
        VEFN: 've-fn',
        VESTATECHANGING: 've-state-changing',
        VEVIEWCONTENTLOADING: 've-view-content-loading',
        VEREDIRECT: 've-redirect',
        VEREDIRECTFROMOLD: 've-redirect-old',
        VECRUSHURL: 've-crush-url',
        VECOMMENTSON: 've-comments-on',
        VEFULLDOCMODE: 've-full-doc-mode',
        VEELEMENTSON: 've-elements-on',
        VEEDITMODE: 've-edit-mode',
        VEHIDEPANES: 've-hide-panes',
        VESHOWMANAGEREFS: 've-show-manage-refs',
        VESHOWLOGIN: 've-show-login',
        TREESHOWPE: 'tree-show-pe',
        TREEOPTIONS: 'tree-options',
        TREEINITIALSELECTION: 'tree-initialSelection',
        TREEICONS: 'tree-icons',
        LEFTPANECLOSED: 'tree-pane-closed',
        DELETEKEY: this.sessionSvc.constants.DELETEKEY
    };

    constructor(private sessionSvc: SessionService) {
    }

    loginModalOpen(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.LOGINMODALOPEN, value, false);
    }

    mmsRefOb(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.MMSREFOB, value);
    };

    rightPaneToggleable(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.RIGHTPANETOGGLEABLE, value, true);
    };

    rightPaneClosed(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.RIGHTPANECLOSED, value, false);
    };

    veTitle(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VETITLE, value, 'View Editor', true);
    };

    veFn(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEFN, value, false);
    };

    veStateChanging(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VESTATECHANGING, value, false);
    };

    veViewContentLoading(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEVIEWCONTENTLOADING, value, false, true);
    };

    veRedirect(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEREDIRECT, value, null);
    };

    veRedirectFromOld(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEREDIRECTFROMOLD, value, null, true);
    };

    veCrushUrl(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VECRUSHURL, value, null);
    };

    veFullDocMode(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEFULLDOCMODE, value, false);
    };

    veCommentsOn(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VECOMMENTSON, value, false);
    };

    veElementsOn(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEELEMENTSON, value, false);
    };

    veEditMode(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEEDITMODE, value, false);
    };

    veHidePanes(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VEHIDEPANES, value, false, true)
    };

    veShowManageRefs(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VESHOWMANAGEREFS, value, false, true);
    }

    veShowLogin(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.VESHOWLOGIN, value, false, true);
    }

    treeShowPe(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.TREESHOWPE, value, false);
    };

    treeOptions(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.TREEOPTIONS, value, {});
    };

    treeInitialSelection(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.TREEINITIALSELECTION, value, null, true);
    };

    treeIcons(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.TREEICONS, value, {});
    };

    leftPaneClosed(value?:any | undefined) {
        return this.sessionSvc.accessor(this.constants.LEFTPANECLOSED, value, false);
    };

}

RootScopeService.$inject = ['SessionService'];

veUtils.service('RootScopeService', RootScopeService);