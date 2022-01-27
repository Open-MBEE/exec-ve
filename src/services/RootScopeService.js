'use strict';

angular.module('mms')
    .factory('RootScopeService', ['SessionService', '_', RootScopeService]);

function RootScopeService(SessionService) {

    let session = SessionService;

    const constants = {
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


    const mmsRefOb = (value=null) => {
        return session.accessor(constants.MMSREFOB, value);
    };

    const mmsPaneToggleable = (value=null) => {
        return session.accessor(constants.MMSPANETOGGLEABLE, value, true);
    };

    const mmsPaneClosed = (value=null) => {
        return session.accessor(constants.MMSPANECLOSED, value, false);
    };

    const veTitle = (value=null) => {
        return session.accessor(constants.VETITLE, value, 'View Editor');
    };

    const veFn = (value=null) => {
        return session.accessor(constants.VEFN, value, false);
    };

    const veStateChanging = (value=null) => {
        return session.accessor(constants.VESTATECHANGING, value, false);
    };

    const veViewContentLoading = (value=null) => {
        return session.accessor(constants.VEVIEWCONTENTLOADING, value, false);
    };

    const veRedirect = (value=null) => {
        return session.accessor(constants.VEREDIRECT, value, null);
    };

    const veRedirectFromOld = (value=null) => {
        return session.accessor(constants.VEREDIRECTFROMOLD, value, null);
    };

    const veCrushUrl = (value=null) => {
        return session.accessor(constants.VECRUSHURL, value, null);
    };

    const veFullDocMode = (value=null) => {
        return session.accessor(constants.VEFULLDOCMODE, value, false);
    };

    const veCommentsOn = (value=null) => {
        return session.accessor(constants.VECOMMENTSON, value, false);
    };

    const veElementsOn = (value=null) => {
        return session.accessor(constants.VEELEMENTSON, value, false);
    };

    const veEditMode = (value=null) => {
        return session.accessor(constants.VEEDITMODE, value, false);
    };

    const treeShowPe = (value=null) => {
        return session.accessor(constants.TREESHOWPE, value, false);
    };

    const treeOptions = (value=null) => {
        return session.accessor(constants.TREEOPTIONS, value, {});
    };

    const treeInitialSelection  = (value=null) => {
        return session.accessor(constants.TREEINITIALSELECTION, value, null);
    };

    const treeIcons = (value=null) => {
        return session.accessor(constants.TREEICONS, value, {});
    };

    const treePaneClosed = (value=null) => {
        return session.accessor(constants.TREEPANECLOSED, value, false);
    };

    return {
        mmsRefOb: mmsRefOb,
        mmsPaneToggleable: mmsPaneToggleable,
        mmsPaneClosed: mmsPaneClosed,
        veTitle: veTitle,
        veFn: veFn,
        veStateChanging: veStateChanging,
        veViewContentLoading: veViewContentLoading,
        veRedirect: veRedirect,
        veRedirectFromOld: veRedirectFromOld,
        veCrushUrl: veCrushUrl,
        treeShowPe: treeShowPe,
        veFullDocMode: veFullDocMode,
        veCommentsOn: veCommentsOn,
        veElementsOn: veElementsOn,
        veEditMode: veEditMode,
        treeOptions: treeOptions,
        treeInitialSelection: treeInitialSelection,
        treeIcons: treeIcons,
        treePaneClosed: treePaneClosed,
        constants: constants
    };
}