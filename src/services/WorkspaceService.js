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
    var inProgress = {};
    var dummy = { 
        "workspace1":{ 
            creator: 'dlam',
            created: '2014-07-30T09:21:29.032-0700',
            id: 'master',
            name: 'base',
            parent: null,
            elements:[ 
             { 
                documentation: "Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec id elit non mi porta gravida at eget metus.",
                sysmlid:'_123_394241_12',
                name:'Garlic Rye with Fish Sauce',
                owner:'A',
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
                "documentation":"Curabitur blandit tempus porttitor. Maecenas sed diam eget risus varius blandit sit amet non magna. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
                "sysmlid":"_456_93419_14",
                "name":"Durian Burger",
                "owner":"A",
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
                "documentation":"Sed posuere consectetur est at lobortis. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit.",
                "sysmlid":"_789_18919_19",
                "name":"10 Year-old Pad Thai",
                "owner":"A",
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
                "documentation":"Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Aenean lacinia bibendum nulla sed consectetur. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.",
                "sysmlid":"A",
                "name":"A Horrid & Offensive Lunch",
                "owner":"Meal Plan of the Ages",
                "specialization":{ 
                   "type":"Element"
                }
             },
             { 
                "documentation":"Nulla vitae elit libero, a pharetra augue. Sed posuere consectetur est at lobortis. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Maecenas sed diam eget risus varius blandit sit amet non magna. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Cras mattis consectetur purus sit amet fermentum. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.",
                "sysmlid":"Dinner",
                "name":"Dinner",
                "owner":"Meal Plan of the Ages",
                "specialization":{ 
                   "type":"Element"
                }
             },
             { 
                "documentation":"Foobar baz foo spam.",
                "sysmlid":"Meal Plan of the Ages",
                "name":"Meal Plan of the Ages",
                "owner":"null",
                "specialization":{ 
                   "type":"Package"
                }
             }
          ],
          "graph":[ 
             { 
                "sysmlid":"Meal Plan of the Ages",
                "edges":[ 
                   "A Horrid & Offensive Lunch",
                   "Dinner"
                ]
             },
             { 
                "sysmlid":"A Horrid & Offensive Lunch",
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
                name:'Fish Sauce ... yeah, just fish sauce',
                documentation: 'changed doc'
             },
             {
               sysmlid:"_456_93419_14",
               specialization:{ 
                   type:'Property',
                   isDerived:'false',
                   value:[ 
                      { 
                         type:'LiteralString',
                         string:'some value'
                      }
                   ]
                }
             }
          ],
          addedElements:[ 
             { 
                documentation:'Salad ipsum dolor set amit.',
                sysmlid:'_192_19342_22',
                name:'Salad with Soil',
                owner:'A',
                specialization:{ 
                   type:'Property',
                   isDerived:'false',
                   value:[ 
                      { 
                         type:'LiteralString',
                         string:'binada_string'
                      },
                      { 
                         type:'LiteralString',
                         string:'raffi_string'
                      }
                   ]
                }
             }
          ],
          deletedElements:[ 
             { 
                sysmlid:'_789_18919_19'
             }
          ],
          movedElements:[ 
             { 
                sysmlid:'Dinner',
                owner:'A'
             }
          ],
          conflicts:[ 

          ]
       }
    };

    var getWorkspaces = function(update) {
        var u = !update ? false : update;
        if (inProgress.hasOwnProperty('getWorkspaces'))
            return inProgress.getWorkspaces;
        
        var deferred = $q.defer();
        var cacheKey = ['workspaces'];
        if (CacheService.exists(cacheKey) && !u) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        } 
        inProgress.getWorkspaces = deferred.promise;
        $http.get(URLService.getWorkspacesURL())
        .success(function(data, status, headers, config) {
            CacheService.put(cacheKey, data.workspaces, false, function(workspace, i) {
                return {key: ['workspaces', workspace.id], value: workspace, merge: false};
            });
            deferred.resolve(CacheService.get(cacheKey));
            delete inProgress.getWorkspaces;
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress.getWorkspaces;
        });
        return deferred.promise;

        /* var deferred = $q.defer();
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

    var getWorkspace = function(wid) {
        var deferred = $q.defer();
        var cacheKey = ['workspaces', wid];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        } 
        $http.get(URLService.getWorkspaceURL(wid))
        .success(function(data, status, headers, config) {
            CacheService.put(cacheKey, data.workspaces[0]);
            deferred.resolve(CacheService.get(cacheKey));
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var diff = function(ws1, ws2, ws1time, ws2time) {
        /*var deferred = $q.defer();
        deferred.resolve(dummy);
        return deferred.promise;*/

        var w1time = !ws1time ? 'latest' : ws1time;
        var w2time = !ws2time ? 'latest' : ws2time;
        var key = 'diff' + ws1 + ws2 + w1time + w2time;
        if (inProgress.hasOwnProperty(key))
            return inProgress[key];
        var deferred = $q.defer();
        inProgress[key] = deferred.promise;
        $http.get(URLService.getWsDiffURL(ws1, ws2, w1time, w2time))
        .success(function(data, status, headers, config) {
            deferred.resolve(data);
            delete inProgress[key];
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[key];
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

    var create = function(name, parentId) {
        var deferred = $q.defer();
        $http.post(URLService.getCreateWorkspaceURL(name, parentId))
        .success(function(data, status, headers, config) {
            var workspace = data.workspaces[0];
            var cacheKey = ['workspaces', workspace.id];
            CacheService.put(cacheKey, workspace, false);
            var workspaces = CacheService.get(['workspaces']);
            if (workspaces)
                workspaces.push(workspace);
            deferred.resolve(workspace);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };
    

    return {
        getWorkspaces: getWorkspaces,
        getWorkspace: getWorkspace,
        diff: diff,
        merge: merge,
        remove: remove,
        create: create
    };

}