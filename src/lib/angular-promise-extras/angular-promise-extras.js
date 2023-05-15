(function (angular) {
    'use strict';

    /**
     * Called with an array this acts like map, otherwise it acts like _.mapValues
     * in lodash.
     * @return {Array|Object} The same type as the input argument.
     */
    var mapValues = function (obj, callback) {
        if (Array.isArray(obj)) return obj.map(callback);

        var ret = {};
        Object.keys(obj).forEach(function (key, val) {
            ret[key] = callback(obj[key], key);
        });
        return ret;
    };

    angular
        .module('ngPromiseExtras', [])
        .config([
            '$provide',
            function ($provide) {
                $provide.decorator('$q', [
                    '$delegate',
                    function ($delegate) {
                        var $q = $delegate;

                        $q.allSettled = function (promises) {
                            return $q.all(
                                mapValues(promises, function (promiseOrValue) {
                                    if (!promiseOrValue.then)
                                        return {
                                            state: 'pending',
                                            value: promiseOrValue,
                                        };

                                    return promiseOrValue.then(
                                        function (value) {
                                            return {
                                                state: 'fulfilled',
                                                value: value,
                                            };
                                        },
                                        function (reason) {
                                            return {
                                                state: 'rejected',
                                                reason: reason,
                                            };
                                        }
                                    );
                                })
                            );
                        };

                        $q.map = function (values, callback) {
                            return $q.all(mapValues(values, callback));
                        };

                        $q.mapSettled = function (values, callback) {
                            return $q.allSettled(mapValues(values, callback));
                        };

                        if (!$q.resolve) {
                            /**
                             * Like Bluebird.resolve (was introduced in angular 1.4).
                             */
                            $q.resolve = function (value) {
                                if (value && value.then) return value;
                                else
                                    return $q(function (resolve) {
                                        resolve(value);
                                    });
                            };
                        }

                        return $q;
                    },
                ]);
            },
        ])
        .run([
            '$q',
            '$window',
            function ($q, $window) {
                $window.Promise = function (executor) {
                    return $q(executor);
                };

                $window.Promise.all = $q.all.bind($q);
                $window.Promise.reject = $q.reject.bind($q);
                $window.Promise.resolve = $q.when.bind($q);
                $window.Promise.allSettled = $q.allSettled.bind($q);

                $window.Promise.race = function (promises) {
                    var promiseMgr = $q.defer();

                    for (var i = 0; i < promises.length; i++) {
                        promises[i].then(function (result) {
                            if (promiseMgr) {
                                promiseMgr.resolve(result);
                                promiseMgr = null;
                            }
                        });

                        promises[i].catch(function (result) {
                            if (promiseMgr) {
                                promiseMgr.reject(result);
                                promiseMgr = null;
                            }
                        });
                    }

                    return promiseMgr.promise;
                };
            },
        ]);
})(window.angular);
