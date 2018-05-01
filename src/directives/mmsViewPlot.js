'use strict';

angular.module('mms.directives')
.directive('mmsViewPlot', ['$compile','$window', mmsViewPlot]);

function mmsViewPlot($compile, $window) {
    var mmsViewLink = function(scope, domElement, element, attrs, mmsViewCtrl) {
        if ( scope.plot.type === "Plot") {
            if ( scope.plot.config !== undefined  && scope.plot.config.trim().length !== 0){
                console.log(scope.plot.config);
                console.log(typeof scope.plot.config);
                console.log(scope.plot.ptype);
                try{
                    scope.plot.config = JSON.parse(scope.plot.config.replace(/'/g, '"'));
                    console.log("parsed ok");
                    console.log(scope.plot.config);
                    if( scope.plot.config.ptype !== undefined) {
                        scope.plot.ptype = scope.plot.config.ptype;
                    }
                }
                catch (err){
                   console.log(err);
                   console.log("error ignored"); 
                }
                console.log(scope.plot.ptype);                
            }
            else
                console.log("scope.plot.config is undefined.");
            domElement[0].innerHTML = '<figure><mms-' + scope.plot.ptype + '-plot plot="plot"></mms-' + scope.plot.ptype + '-plot><figcaption>{{plot.title}}</figcaption></figure>';
            $compile(domElement.contents())(scope);
        }
    };
    return {
        restrict: 'E',
        require: '?^mmsView',
        scope: {
            plot: '<mmsPlot'
        },
        link: mmsViewLink
            /*function(scope, domElement, element, attrs) {
            if ( scope.plot.type === "Plot") {
                console.log(scope.plot.ptype);
                console.log("A");

                var temp = JSON.stringify(scope.plot.config);
                console.log("B");
                temp = (temp).replace(/'/g, '"');
                console.log("C-string-jquery");
                console.log(temp.toString());
                temp = jQuery.parseJSON(scope.plot.config.toString());
                //temp = JSON.parse(temp.toString());
                console.log("temp-------------------");
                console.log(temp);
                console.log(temp !== undefined);
                console.log(temp.length);
                temp = JSON.parse(temp);
                console.log(temp);
                console.log(temp.ptype);

                if ( temp !== undefined && temp.length !== 0){
                    if ( temp.ptype !== undefined){
                        scope.plot.ptype = scope.plot.config.options.ptype;
                        console.log("reset to: " + scope.plot.ptype);
                    }

                }
                
                domElement[0].innerHTML = '<figure><mms-' + scope.plot.ptype + '-plot plot="plot"></mms-' + scope.plot.ptype + '-plot><figcaption>{{plot.title}}</figcaption></figure>';
                $compile(domElement.contents())(scope);
            }
        }*/
    };
}