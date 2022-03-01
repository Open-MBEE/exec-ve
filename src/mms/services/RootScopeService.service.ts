import * as angular from 'angular'
var mms = angular.module('mms');

export class RootScopeService {
    private sessionSvc;
    
    public constants = {
        MMSREFOB: 'mms-ref-ob',
        MMSPANETOGGLEABLE: 'mms-pane-togglable',
        MMSPANECLOSED: 'mms-pane-closed',
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
        TREESHOWPE: 'tree-show-pe',
        TREEOPTIONS: 'tree-options',
        TREEINITIALSELECTION: 'tree-initialSelection',
        TREEICONS: 'tree-icons',
        TREEPANECLOSED: 'tree-pane-closed'
    };

    constructor(SessionService) {
        this.sessionSvc = SessionService;
    }

    mmsRefOb(value=null) {
        return this.sessionSvc.accessor(this.constants.MMSREFOB, value);
    };

    mmsPaneToggleable(value=null) {
        return this.sessionSvc.accessor(this.constants.MMSPANETOGGLEABLE, value, true);
    };

    mmsPaneClosed(value=null) {
        return this.sessionSvc.accessor(this.constants.MMSPANECLOSED, value, false);
    };

    veTitle(value=null) {
        return this.sessionSvc.accessor(this.constants.VETITLE, value, 'View Editor', true);
    };

    veFn(value=null) {
        return this.sessionSvc.accessor(this.constants.VEFN, value, false);
    };

    veStateChanging(value=null) {
        return this.sessionSvc.accessor(this.constants.VESTATECHANGING, value, false);
    };

    veViewContentLoading(value=null) {
        return this.sessionSvc.accessor(this.constants.VEVIEWCONTENTLOADING, value, false, true);
    };

    veRedirect(value=null) {
        return this.sessionSvc.accessor(this.constants.VEREDIRECT, value, null);
    };

    veRedirectFromOld(value=null) {
        return this.sessionSvc.accessor(this.constants.VEREDIRECTFROMOLD, value, null, true);
    };

    veCrushUrl(value=null) {
        return this.sessionSvc.accessor(this.constants.VECRUSHURL, value, null);
    };

    veFullDocMode(value=null) {
        return this.sessionSvc.accessor(this.constants.VEFULLDOCMODE, value, false);
    };

    veCommentsOn(value=null) {
        return this.sessionSvc.accessor(this.constants.VECOMMENTSON, value, false);
    };

    veElementsOn(value=null) {
        return this.sessionSvc.accessor(this.constants.VEELEMENTSON, value, false);
    };

    veEditMode(value=null) {
        return this.sessionSvc.accessor(this.constants.VEEDITMODE, value, false);
    };

    treeShowPe(value=null) {
        return this.sessionSvc.accessor(this.constants.TREESHOWPE, value, false);
    };

    treeOptions(value=null) {
        return this.sessionSvc.accessor(this.constants.TREEOPTIONS, value, {});
    };

    treeInitialSelection(value=null) {
        return this.sessionSvc.accessor(this.constants.TREEINITIALSELECTION, value, null, true);
    };

    treeIcons(value=null) {
        return this.sessionSvc.accessor(this.constants.TREEICONS, value, {});
    };

    leftPaneClosed(value=null) {
        return this.sessionSvc.accessor(this.constants.TREEPANECLOSED, value, false);
    };

}

RootScopeService.$inject = ['SessionService'];

mms.service('RootScopeService', RootScopeService);