'use strict';

angular.module('mms.directives')
.directive('mmsViewPlot', ['$compile',mmsViewPlot]);

function mmsViewPlot($compile) {
    //var template = '<mms-c3-plot mms-plot = "{{plot}}" mms-table="{{plot.table}}"  mms-options="{{plot.options}}" mms-functions="{{plot.functions}}"></mms-c3-plot>';
    //var template = '<mms-c3-plot splot="{{plot}}"></mms-c3-plot>';
        //<figcaption>{{image.title}}</figcaption></figure>';
    return {
        restrict: 'E',
        require: '?^mmsView',
        //template: template,
        scope: {
            plot: '<mmsPlot'

        },
        link: function(scope, domElement, element, attrs) {
            /*console.log("!!!!!!!!!!!mmsViewPlot!!!!!!!!!!!!!!!!");
            console.log(scope.plot);
            console.log("======domElement=============");
            console.log(domElement);
            console.log(domElement[0]);
            */
            console.log("===============scope.plot============");
            console.log(scope.plot);
            if ( scope.plot.type === "Plot") {
                //if (scope.mmsCfType) {
                //domElement[0].innerHTML = '<mms-transclude-'+scope.mmsCfType+' mms-element-id="{{mmsElementId}}" mms-project-id="{{projectId}}" mms-ref-id="{{refId}}" mms-commit-id="{{commitId}}" non-editable="nonEditable"></<mms-transclude-'+scope.mmsCfType+'>';
                //if (scope.plot.ptype)
                //    domElement[0].innerHTML = '<mms-c3-plot splot="{{plot}}"></mms-c3-plot>';
                //else
                console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMM");
                console.log('<mms-' + scope.plot.ptype + '-plot');
                //domElement[0].innerHTML = '<mms-d3-radar splot="{{plot}}"></mms-d3-radar>';
                //mms-c3-plot
                //mms-d3-radar-plot
                domElement[0].innerHTML = '<figure><mms-' + scope.plot.ptype + '-plot splot="{{plot}}"></mms-' + scope.plot.ptype + '-plot><figcaption>{{plot.title}}</figcaption></figure>';
                $compile(domElement.contents())(scope);
                console.log("plot title................");
                console.log(scope.plot.title);
                //<figure><mms-cf mms-cf-type="img" mms-element-id="{{image.id}}"></mms-cf><figcaption>{{image.title}}</figcaption></figure>';
            }

        }
    };
}