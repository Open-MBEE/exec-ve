'use strict';

angular.module('mms.directives')
.directive('tmsTimely', ['$http', '$q', tmsTimely]);

function tmsTimely($http, $q) {
    
    var buildChart = function(scope, element, spec) {
        spec.element = element[0];
        scope.spec = spec;
        scope.chart = new Timely.Chart(spec);
        if (scope.tmsApi) {
            scope.tmsApi.api = scope.chart;
        }
        scope.chart.setHeight(600);
        scope.chart.setWidth(600);
        scope.chart.draw();
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
            angular.element('head').append('<script> function __timely() {return {' + js + '};} </script>');
            spec = __timely();
            //spec = eval(js);
            if (angular.isObject(spec.data)) {
                var promises = [];
                angular.forEach(spec.data, function(value, key) {
                    var defer = $q.defer();
                    promises.push(defer.promise);
                    $http.get(value).then(function(data) {
                        defer.resolve({'key': key, 'data': data});
                    });
                });
                $q.all(promises).then(function(datas) {
                    var count = 1;
                    datas.forEach(function(data) {
                        spec.data[data.key] = data.data.data['Timeline Data'];
                        count++;
                    });
                    buildChart(scope, element, spec);
                });
            }
            return;
        }
        if (spec) {
            buildChart(scope, element, spec);
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