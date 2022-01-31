import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');


mmsApp.directive('veFooter', veFooter);

function veFooter() {
    var template = 'partials/mms/veFooter.html';

    var veFooterLink = function(scope) {
        scope.ve_footer = scope.footer;
    };


    return {
        templateUrl: template,
        link: veFooterLink
    };
}