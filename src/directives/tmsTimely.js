'use strict';

angular.module('mms.directives')
.directive('tmsTimely', ['$http', '$q', '$window', tmsTimely]);

function tmsTimely($http, $q, $window) {
    
    var buildChart = function(scope, element, spec, attrs) {
        spec.element = element[0];
        scope.spec = spec;
        scope.chart = new Timely.Chart(spec);
        if (scope.tmsApi) {
            scope.tmsApi.api = scope.chart;
        }
        if (attrs.height) {
            scope.height = attrs.height;
            scope.chart.setHeight(parseInt(attrs.height));
        }
        if (attrs.width) {
            scope.width = attrs.width;
            scope.chart.setWidth(parseInt(attrs.width));
        }
        scope.$on('$destroy', function() {

        });
        scope.chart.draw();
        setResize(scope, element, attrs);
    };

    var setResize = function(scope, element, attrs) {
        if (attrs.fitToWindow === 'true' || attrs.fitToWindowWidth === 'true' || attrs.fitToWindowHeight === 'true') {
            angular.element($window).on('resize', function(e) {
                if (attrs.fitToWindow === 'true') {
                    scope.height = $window.innerHeight;
                    scope.width = $window.innerWidth;
                } else if (attrs.fitToWindowWidth === 'true')
                    scope.width = $window.innerWidth;
                else if (attrs.fitToWindowHeight === 'true')
                    scope.height = $window.innerHeight;
                scope.chart.setHeight(scope.height);
                scope.chart.setWidth(scope.width);
                scope.chart.draw();
            });
        }
    };

    var tmsTimelyLink = function(scope, element, attrs) {
        var spec = null;
        if (scope.tmsSpec) {
            spec = scope.tmsSpec;
        }
        var scriptElement = element.find('script');
        if (scriptElement.length == 1 && !spec) {
            var js = scriptElement[0].textContent;
            if (js.slice(-6) == '// ]]>' && js.slice(0, 12) == '// <![CDATA[') {
                js = js.slice(12, -6);
            }
            //angular.element('head').append('<script> function __timely() {return {' + js + '};} </script>');
            spec = eval('(' + js + ')');
            //spec = eval(js);
            if (angular.isObject(spec.data)) {
                var promises = [];
                angular.forEach(spec.data, function(value, key) {
                    var defer = $q.defer();
                    promises.push(defer.promise);
                    $http.get(value).then(function(data) {
                        defer.resolve({'key': key, 'data': data, 'success': true});
                    }, function(data) {
                        //getting timeline data failed
                        defer.resolve({'key': key, 'data': data, 'success': false});
                        console.log('getting timeline data failed for ' + key);
                    });
                });
                $q.all(promises).then(function(datas) {
                    datas.forEach(function(data) {
                        if (data.success)
                            spec.data[data.key] = data.data.data['Timeline Data'];
                    });
                    buildChart(scope, element, spec, attrs);
                });
            }
            return;
        }
        if (spec) {
            buildChart(scope, element, spec, attrs);
        }
    };

    return {
        restrict: 'E',
        scope: {
            tmsSpec: '=',
            tmsApi: '='
        },
        link: tmsTimelyLink
    };
}