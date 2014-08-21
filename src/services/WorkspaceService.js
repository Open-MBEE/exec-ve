'use strict';

angular.module('mms')
.factory('WorkspaceService', ['$http', '$q', 'URLService', 'ElementService', 'CacheService', WorkspaceService]);

/**
 * @ngdoc service
 * @name mms.WorkspaceService
 * @requires $http
 * @requires $q
 * 
 * @description
 */
function WorkspaceService($http, $q, URLService, ElementService, CacheService) {
    var inProgress = null;

    var dummy = { 
        "workspace1":{ 
            creator: 'dlam',
            created: '2014-07-30T09:21:29.032-0700',
            id: 'master',
            name: 'base',
            parent: null,
            elements:[ 
             { 
                documentation:'Lorem ipsum dolor set amit.',
                sysmlid:'_123_394241_12',
                name:'',
                owner:'Lunch',
                specialization:{ 
                   type:'Property',
                   isDerived:'false',
                   value:[ 
                      { 
                         type:'LiteralString',
                         string:'binada_string'
                      }
                   ]
                }
             },
             { 
                "documentation":"Bacon ipsum pork set amit.",
                "sysmlid":"_456_93419_14",
                "name":"Burger",
                "owner":"Lunch",
                "specialization":{ 
                   "type":"Property",
                   "isDerived":"false",
                   "value":[ 
                      { 
                         "type":"LiteralString",
                         "string":"binada_string"
                      }
                   ]
                }
             },
             { 
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"_789_18919_19",
                "name":"Pad Thai",
                "owner":"Lunch",
                "specialization":{ 
                   "type":"Property",
                   "isDerived":"false",
                   "value":[ 
                      { 
                         "type":"LiteralString",
                         "string":"binada_string"
                      }
                   ]
                }
             },
             { 
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"Lunch",
                "name":"Lunch",
                "owner":"Meals",
                "specialization":{ 
                   "type":"Element"
                }
             },
             { 
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"Dinner",
                "name":"Dinner",
                "owner":"Meals",
                "specialization":{ 
                   "type":"Element"
                }
             },
             { 
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"Meals",
                "name":"Meals",
                "owner":"null",
                "specialization":{ 
                   "type":"Package"
                }
             }
          ],
          "graph":[ 
             { 
                "sysmlid":"Meals",
                "edges":[ 
                   "Lunch",
                   "Dinner"
                ]
             },
             { 
                "sysmlid":"Lunch",
                "edges":[ 
                   "_123_394241_12",
                   "_456_93419_14",
                   "_789_18919_19"
                ]
             },
             { 
                "sysmlid":"Dinner",
                "edges":[ 

                ]
             }
          ]
       },
       "workspace2":{ 
          creator: 'raffi',
          created: '2014-07-31T09:21:29.032-0700',
          id: 'test',
          name: 'test',
          parent: 'master',
          updatedElements:[ 
             { 
                sysmlid:'_123_394241_12',
                name:'Skewer'
             }
          ],
          addedElements:[ 
             { 
                documentation:'Salad ipsum dolor set amit.',
                sysmlid:'_192_19342_22',
                name:'Salad',
                owner:'Lunch',
                specialization:{ 
                   type:'Property',
                   isDerived:'false',
                   value:[ 
                      { 
                         type:'LiteralString',
                         string:'binada_string'
                      }
                   ]
                }
             }
          ],
          deletedElements:[ 
             { 
                sysmlid:'_456_93419_14'
             }
          ],
          movedElements:[ 
             { 
                sysmlid:'_789_18919_19',
                owner:'Dinner'
             }
          ],
          conflicts:[ 

          ]
       }
    };

    var getAll = function() {
        if (inProgress)
            return inProgress;
        
        var deferred = $q.defer();
        var cacheKey = ['workspaces', 'master'];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress = deferred.promise;
            $http.get(URLService.getWorkspacesURL())
            .success(function(data, status, headers, config) {
                CacheService.put(cacheKey, data.workspaces, true, function(workspace, i) {
                    return {key: ['workspaces', workspace.parent, workspace.name, workspace.creator], value: workspace, merge: true};
                });
                deferred.resolve(CacheService.get(cacheKey));
                inProgress = null;
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
                inProgress = null;
            });
        }
        return deferred.promise;

        /*var deferred = $q.defer();
        deferred.resolve([
            {
                creator: 'dlam',
                created: '2014-07-30T09:21:29.032-0700',
                id: 'master',
                name: 'base',
                parent: null
            },
            {
                creator: 'raffi',
                created: '2014-07-31T09:21:29.032-0700',
                id: 'test',
                name: 'test',
                parent: 'master'
            }
        ]);
        return deferred.promise; */
    };

    var get = function(ws) {

    };

    var diff = function(ws1, ws2, ws1time, ws2time) {
        /* var deferred = $q.defer();
        deferred.resolve(dummy);
        return deferred.promise; */

        if (inProgress)
          return inProgress;
        
        var deferred = $q.defer();
        
        inProgress = deferred.promise;
        $http.get(URLService.getWsDiffURL(ws1, ws2, ws1time, ws2time))
        .success(function(data, status, headers, config) {
            deferred.resolve(data);
            inProgress = null;
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            inProgress = null;
        });

        return deferred.promise;
    };

    var merge = function(changes, targetWs) {
        var deferred = $q.defer();
        deferred.resolve('ok');
        return deferred.promise;
    };

    var remove = function(ws) {

    };

    var create = function(name, parentWs) {

    };
    

    return {
        getAll: getAll,
        get: get,
        diff: diff,
        merge: merge,
        remove: remove,
        create: create
    };

}