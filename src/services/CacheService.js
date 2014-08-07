'use strict';

angular.module('mms')
.factory('CacheService', ['_', CacheService]);

/**
 * @ngdoc service
 * @name mms.CacheService
 * @requires _
 * 
 * @description
 * Generic Caching Service
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
     * @name mms.CacheService#put
     * @methodOf mms.CacheService
     * 
     * @description
     * Put value into cache
     * 
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @param {Object} value The value to save
     * @param {boolean} [merge=false] Whether to replace the value or do a merge if value already exists
     * @param {function} [func] Optional function that take in value and key based on iteration of the original value
     *      and returns an object with the same signature as arguments to the put function. For example, 
     *      {key: ['key'], value: 'value', merge: false, func: null}
     */
    var put = function(key, value, merge, func) {
        var m = !merge ? false : merge;
        var realkey = key;
        if (angular.isArray(key))
            realkey = makeKey(key);
        if (cache.hasOwnProperty(realkey) && m)
            _.merge(cache[realkey], value);
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

    var remove = function(key) {
        var realkey = key;
        if (angular.isArray(key))
            realkey = makeKey(key);
        var result = cache[realkey];
        delete cache[realkey];
        return result;
    };

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
        put: put,
        exists: exists,
        remove: remove,
    };

}