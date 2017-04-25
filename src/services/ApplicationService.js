'use strict';
// angular.module('mms')//can be use on application intialization for stomp
// .provider('ApplicationService', function() {
//     //alternate would be to use Date.now()
//     var source = null;
//     this.setSource = function() {
//         function s4() {
//             return Math.floor((1 + Math.random()) * 0x10000)
//                         .toString(16)
//                         .substring(1);
//         }
//         var s = [];
//         var hexDigits = "0123456789abcdef";
//         for (var i = 0; i < 36; i++) {
//             s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
//         }
//         s[14] = "4"; 
//         s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
//         s[8] = s[13] = s[18] = s[23] = "-";
//         return s.join("");
//     };
//     return {
//         setSource: function () {
//             source = this.setSource;
//         },
//         $get: function () {
//             return {
//                 src: source
//             };
//         }
//     };
// });

angular.module('mms')
.factory('ApplicationService', ['$q', '$http', 'URLService', ApplicationService]);

/**
 * @ngdoc service
 * @name mms.ApplicationService
 * @requires $q
 * @requires $http
 * @requires URLService
 *
 * @description
 * Provide general applications functions such as getting MMS Version, getting username,
 * creating unique IDs, etc...
 */
function ApplicationService($q, $http, URLService) {
    var source = createUniqueId();
    var username;

    function createUniqueId() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }

        s[14] = "4";
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    }

    var getSource = function () {
        return source;
    };

    var getMmsVersion = function () {
        var deferred = $q.defer();
        $http.get(URLService.getMmsVersionURL())
            .then(function (response) {
                deferred.resolve(response.data.mmsVersion);
            }, function (response) {
                URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            });
        return deferred.promise;
    };

    var setUserName = function (user) {
        username = user;
    };

    var getUserName = function () {
        return username;
    };

    return {
        getSource: getSource,
        getMmsVersion: getMmsVersion,
        setUserName: setUserName,
        getUserName: getUserName
    };

}