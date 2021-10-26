'use strict';

angular.module('mms')
    .factory('SessionService', ['$window', '$rootScope', '_', SessionService]);

function SessionService($window, $rootScope) {
    this.scopes = [];
    let sessionStorage = $window.sessionStorage;

    let setStorage = (key, value) => {
        let i, len, ref, scope;
        ref = this.scopes;
        for (i = 0; len = ref.length, i < len; i++) {
            scope = ref[i];
            scope[key] = value;
        }
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

    const register = (scope) => {
        let key, value;
        for (key in sessionStorage) {
            value = sessionStorage[key];
            scope[key] = ((value != null) && value !== "undefined" && typeof value !== 'function') ? JSON.parse(value) : null;
        }
        this.scopes.push(scope);
        return scope.$on('$destroy', (function(_this) {
            return function() {
                _this.scopes = _this.scopes.filter(function(s) {
                    return s.$id !== scope.$id;
                });
            };
        })(this));
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
        if (emit === undefined || emit === true)
            $rootScope.$broadcast(name);

        return setStorage(name, value);
    };

    const constants = {
        TREEDATA: 'tree-data',
        TREEROWS: 'tree-rows',
        TREEOPTIONS: 'tree-options',
        TREEINITIALSELECTION: 'tree-initialSelection',
        TREEICONS: 'tree-icons'
    };


    const mmsRefOb = (value=null) => {
        return accessor('mms-ref-ob', value);
    };

    const veTreeShowPe = (value=null) => {
        return accessor('ve-tree-show-pe', value);
    };
    const veFullDocMode = (value=null) => {
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

    const treeData = (value=null) => {
        if (!value) {
            var td = accessor(constants.TREEDATA, value);
            if (!td) {
                td = {};
                accessor(constants.TREEDATA, td, false);
            }
            return td;
        }

        return accessor(constants.TREEDATA, value);
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

    return {
        register: register,
        clear: clear,
        mmsRefOb: mmsRefOb,
        veTreeShowPe: veTreeShowPe,
        veFullDocMode: veFullDocMode,
        veCommentsOn: veCommentsOn,
        veElementsOn: veElementsOn,
        veEditMode: veEditMode,
        treeData: treeData,
        treeRows: treeRows,
        treeOptions: treeOptions,
        treeInitialSelection: treeInitialSelection,
        treeIcons: treeIcons,
        constants: constants
    };
}