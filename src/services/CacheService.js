'use strict';

angular.module('mms')
.factory('CacheService', ['_', CacheService]);

/**
 * @ngdoc service
 * @name mms.CacheService
 * @requires _
 * 
 * @description
 * Provides cache of key value pairs. Key can be a string or an array of strings.
 */
function CacheService(_) {
    
    var cache = {};

    /**
     * @ngdoc method
     * @name mms.CacheService#get
     * @methodOf mms.CacheService
     * 
     * @description
     * Get value from cache
     * 
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {Object} Value if found, null if not found
     */
    var get = function(key) {
        var realkey = key;
        if (angular.isArray(key))
            realkey = makeKey(key);
        if (cache.hasOwnProperty(realkey))
            return cache[realkey];
        return null;
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#getElements
     * @methodOf mms.CacheService
     * 
     * @description
     * Get the latest elements in the cache with the parameter workspace ID
     * 
     * @param {string} mmsWs The workspace id
     * @returns {Object} Value if found, null if not found
     */
    var getLatestElements = function(mmsWs) {
        var latestElements = [];

        for (var item in cache) {
            if (!cache.hasOwnProperty(item)) {
                continue;
            }

            if (item.indexOf('|latest') >= 0 && item.indexOf('elements|') >= 0 && item.indexOf(mmsWs) >= 0) {
                latestElements.push(cache[item]);
            }
        }

        return latestElements;
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#put
     * @methodOf mms.CacheService
     * 
     * @description
     * Put value into cache
     * 
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @param {Object} value The value to save
     * @param {boolean} [merge=false] Whether to replace the value or do a merge if value already exists
     * @param {function} [func=null] Optional function that take in value and key based on iteration of the original value
     *      and returns an object with the same signature as arguments to the put function. For example, 
     *      {key: ['key'], value: 'value', merge: false, func: null}
     * @returns {Object} the original value
     */
    var put = function(key, value, merge, func) {
        var m = !merge ? false : merge;
        var realkey = key;
        if (angular.isArray(key))
            realkey = makeKey(key);
        if (cache.hasOwnProperty(realkey) && m) {
            _.merge(cache[realkey], value, function(a,b,id) {
                if ((id === 'contents' || id === 'contains') && a)
                    return a; //handle contains and contents updates manually at higher level
                if (angular.isArray(a) && angular.isArray(b) && b.length < a.length) {
                    return b; 
                }
                return undefined;
            });
        }
        else
            cache[realkey] = value;
        if (func) {
            angular.forEach(value, function(v, k) {
                var ob = func(v, k);
                put(ob.key, ob.value, ob.merge, ob.func);
            });
        }
        return cache[realkey];
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#remove
     * @methodOf mms.CacheService
     * 
     * @description
     * Remove value from cache and return it
     * 
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {Object} value that was removed or undefined
     */
    var remove = function(key) {
        var realkey = key;
        if (angular.isArray(key))
            realkey = makeKey(key);
        var result = null;
        if (cache.hasOwnProperty(realkey)) {
            result = cache[realkey];
            delete cache[realkey];
        }
        return result;
    };

    /**
     * @ngdoc method
     * @name mms.CacheService#exists
     * @methodOf mms.CacheService
     * 
     * @description
     * Check if value exists with a specific key
     * 
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {boolean} whether value exists for key
     */
    var exists = function(key) {
        var realkey = key;
        if (angular.isArray(key))
            realkey = makeKey(key);
        return cache.hasOwnProperty(realkey);
    };

    var makeKey = function(keys) {
        return keys.join('|');
    };

    return {
        get: get,
        getLatestElements: getLatestElements,
        put: put,
        exists: exists,
        remove: remove,
    };

}