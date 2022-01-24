'use strict';

angular.module('mms')
    .factory('SessionService', ['$window', 'EventService', '_', SessionService]);

function SessionService($window, EventService) {

    let sessionStorage = $window.sessionStorage;
    let eventSvc = EventService;

    let setStorage = (key, value) => {
        value = value === void 0 ? null : JSON.stringify(value);
        return sessionStorage.setItem(key, value);
    };

    const getStorage = (key) => {
        let sessionValue = sessionStorage.getItem(key);
        if (sessionValue === "undefined") {
            return null;
        }
        return JSON.parse(sessionValue);
    };

    const removeStorage = (key) => {
        return sessionStorage.removeItem(key);
    };

    const clear = () => {
        let key, results;
        results = [];
        for (key in sessionStorage) {
            results.push(setStorage(key, null));
        }
        return results;
    };

    const accessor = (name, value, emit) => {
        if (value == null) {
            return getStorage(name);
        }
        if (value === constants.DELETEKEY) {
            return removeStorage(name);
        }
        const result = setStorage(name, value);
        if (emit === undefined || emit === true)
            eventSvc.$broadcast(name,value);

        return result;
    };

    const constants = {
        DELETEKEY: 'session-delete',
        VETITLE: 've-title',
        VEFN: 've-fn',
        VEVIEWCONTENTLOADING: 've-view-content-loading',
        TREEINITIAL: 'tree-initial',
        TREEDATA: 'tree-data',
        TREEROWS: 'tree-rows',
        TREEOPTIONS: 'tree-options',
        TREEINITIALSELECTION: 'tree-initialSelection',
        TREEICONS: 'tree-icons'
    };


    const mmsRefOb = (value=null) => {
        return accessor('mms-ref-ob', value);
    };

    const mmsPaneToggleable = (value=null) => {
        return accessor('mms-pane-toggleable', value);
    };

    const mmsPaneClosed = (value=null) => {
        return accessor('mms-pane-closed', value);
    };

    const veTitle = (value=null) => {
        return accessor(constants.VETITLE, value);
    };

    const veFn = (value=null) => {
        return accessor(constants.VEFN, value);
    };


    const veStateChanging = (value=null) => {
        return accessor('ve-state-changing', value);
    };

    const veViewContentLoading = (value=null) => {
        return accessor(constants.VEVIEWCONTENTLOADING, value);
    };

    const veRedirect = (value=null) => {
        return accessor('ve-redirect', value);
    };

    const redirectFromOld = (value=null) => {
        return accessor('redirect-old', value);
    };

    const crushUrl = (value=null) => {
        return accessor('crush-url', value);
    };

    const diffPerspective = (value=null) => {
        return accessor('diff-perspective', value);
    };

    const veTreeShowPe = (value=null) => {
        return accessor('ve-tree-show-pe', value);
    };
    const veFullDocMode = (value=null) => {
        if (!value) {
            let fullDoc = accessor('ve-full-doc-mode', value);
            if (!fullDoc) {
                fullDoc = false;
                accessor('ve-full-doc-mode', fullDoc, false);
            }
            return fullDoc;
        }
        return accessor('ve-full-doc-mode', value);
    };

    const veCommentsOn = (value=null) => {
        return accessor('ve-comments-on', value);
    };

    const veElementsOn = (value=null) => {
        return accessor('ve-elements-on', value);
    };

    const veEditMode = (value=null) => {
        return accessor('ve-edit-mode', value);
    };

    const treeRows  = (value=null) => {
        return accessor(constants.TREEROWS, value);
    };
    const treeOptions = (value=null) => {
        if (!value) {
            var topts = accessor(constants.TREEOPTIONS, value);
            if (!topts) {
                topts = {};
                accessor(constants.TREEOPTIONS, topts, false);
            }
            return topts;
        }
        return accessor(constants.TREEOPTIONS, value);
    };

    const treeInitialSelection  = (value=null) => {
        return accessor(constants.TREEINITIALSELECTION, value);
    };

    const treeIcons = (value=null) => {
        return accessor(constants.TREEICONS, value);
    };

    const treePaneClosed = (value=null) => {
        return accessor('tree-pane-closed', value);
    };

    return {
        clear: clear,
        accessor: accessor,
        mmsRefOb: mmsRefOb,
        mmsPaneToggleable: mmsPaneToggleable,
        mmsPaneClosed: mmsPaneClosed,
        veTitle: veTitle,
        veFn: veFn,
        veStateChanging: veStateChanging,
        veViewContentLoading: veViewContentLoading,
        veRedirect: veRedirect,
        redirectFromOld: redirectFromOld,
        crushUrl: crushUrl,
        diffPerspective: diffPerspective,
        veTreeShowPe: veTreeShowPe,
        veFullDocMode: veFullDocMode,
        veCommentsOn: veCommentsOn,
        veElementsOn: veElementsOn,
        veEditMode: veEditMode,
        treeRows: treeRows,
        treeOptions: treeOptions,
        treeInitialSelection: treeInitialSelection,
        treeIcons: treeIcons,
        treePaneClosed: treePaneClosed,
        constants: constants
    };
}