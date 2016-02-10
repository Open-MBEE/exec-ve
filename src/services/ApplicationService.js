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
.factory('ApplicationService', ['URLService','$http', ApplicationService]);

function ApplicationService(URLService, $http) {
     var source = createUniqueId();
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

    var getSource = function(){
            return source;
    };

    var getMmsVersion = function() {
      $http.get(URLService.getMmsVersionURL())
      .success(function(data,status,headers,config) {
          return data;
      }).error(function(data,status,headers,config){
          URLService.handleHttpStatus(data, status, headers, config);
      });
    };
    
    return {
        getSource: getSource,
        getMmsVersion: getMmsVersion,
    };

}