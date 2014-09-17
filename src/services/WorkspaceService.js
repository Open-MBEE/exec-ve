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
                documentation: "Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec id elit non mi porta gravida at eget metus.",
                sysmlid:'_123_394241_12',
                name:'Garlic Rye with Fish Sauce',
                owner:'A Horrid & Offensive Lunch',
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
                "owner":"A Horrid & Offensive Lunch",
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
                "owner":"A Horrid & Offensive Lunch",
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
                "sysmlid":"A Horrid & Offensive Lunch",
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
                name:'Fish Sauce ... yeah, just fish sauce'
             }
          ],
          addedElements:[ 
             { 
                documentation:'Salad ipsum dolor set amit.',
                sysmlid:'_192_19342_22',
                name:'Salad with Soil',
                owner:'A Horrid & Offensive Lunch',
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
        // if (inProgress)
        //     return inProgress;
        
        // var deferred = $q.defer();
        // var cacheKey = ['workspaces', 'master'];
        // if (CacheService.exists(cacheKey)) {
        //     deferred.resolve(CacheService.get(cacheKey));
        // } else {
        //     inProgress = deferred.promise;
        //     $http.get(URLService.getWorkspacesURL())
        //     .success(function(data, status, headers, config) {
        //         CacheService.put(cacheKey, data.workspaces, true, function(workspace, i) {
        //             return {key: ['workspaces', workspace.parent, workspace.name, workspace.creator], value: workspace, merge: true};
        //         });
        //         deferred.resolve(CacheService.get(cacheKey));
        //         inProgress = null;
        //     }).error(function(data, status, headers, config) {
        //         URLService.handleHttpStatus(data, status, headers, config, deferred);
        //         inProgress = null;
        //     });
        // }
        // return deferred.promise;

        var deferred = $q.defer();
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
        return deferred.promise; 
    };

    var get = function(ws) {

    };

    var diff = function(ws1, ws2, ws1time, ws2time) {
        var deferred = $q.defer();
        deferred.resolve(dummy);
        return deferred.promise;

      /*  if (inProgress)
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

        return deferred.promise; */
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