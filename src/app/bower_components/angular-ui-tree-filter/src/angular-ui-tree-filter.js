(function (angular) {
    'use strict';

    angular.module('ui.tree-filter', [])
    /**
     * @ngdoc object
     * @name ui.tree-filter.provider:uiTreeFilterSettings
     */
        .provider('uiTreeFilterSettings', function () {

            const uiTreeFilterSettings = this;

            this.addresses = ['title'];
            this.regexFlags = 'gi';
            this.descendantCollection = 'items';

            this.$get = function () {
                return {
                    addresses: uiTreeFilterSettings.addresses,
                    regexFlags: uiTreeFilterSettings.regexFlags,
                    descendantCollection: uiTreeFilterSettings.descendantCollection,
                };
            };
        })
    /**
     * @ngdoc function
     * @name ui.tree-filter.factory:uiTreeFilter
     */
        .filter('uiTreeFilter', function (uiTreeFilterSettings) {
            /**
             * Iterates through given collection if flag is not true and sets a flag to true on first match.
             *
             * @param {Array}   collection
             * @param {string}  pattern
             * @param {string}  address
             *
             * @returns {boolean}
             */
            function visit(collection, pattern, address) {
                collection = collection || [];
                let foundSoFar = false;

                collection.forEach(function (collectionItem) {
                    foundSoFar = foundSoFar || testForField(collectionItem, pattern, address);
                });

                return foundSoFar;
            }

            /**
             * Resolves object value from dot-delimited address.
             *
             * @param object
             * @param path
             * @returns {*}
             */
            function resolveAddress(object, path) {
                const parts = path.split('.');

                if (object === undefined) {
                    return;
                }

                return parts.length < 2 ? object[parts[0]] : resolveAddress(object[parts[0]], parts.slice(1).join('.'));
            }

            /**
             * Checks if object or its children matches a pattern on a given field
             *
             * First it resolves the property address and gets the value.
             * If the value is a string it matches it against provided pattern.
             * If item matches because its property matches it's children are not checked.
             * Otherwise all item descendants are checked as well
             *
             * @param {Object} item
             * @param {string} pattern
             * @param {string} address property name or dot-delimited path to property.
             *
             * @returns {boolean}
             */
            function testForField(item, pattern, address) {
                const value = resolveAddress(item, address);
                const found = typeof value === 'string' ?
                    !!value.match(new RegExp(pattern, uiTreeFilterSettings.regexFlags)) :
                    false;
                return found || visit(item[uiTreeFilterSettings.descendantCollection], pattern, address);
            }

            /**
             * Checks if pattern matches any of addresses
             *
             * @param {object} item
             * @param {string} pattern
             *
             * @returns {boolean}
             */
            return function (item, pattern, addresses) {
                addresses = addresses || uiTreeFilterSettings.addresses;
                return pattern === undefined || addresses.reduce(function (foundSoFar, fieldName) {
                    return foundSoFar || testForField(item, pattern, fieldName);
                }, false);
            };
        });
})(angular);
