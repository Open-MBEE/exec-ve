'use strict';
angular.module('slideShowExample', ['simple-slideshow'])
    .controller('slideShowCtrl', ['$scope', function($scope){
        $scope.slides = [
            {name: 'Not my cat.', url: 'https://farm2.staticflickr.com/1318/5114665665_e55b2c2169_n.jpg'},
            {name: 'Again, not my cat.', url: 'https://farm2.staticflickr.com/1079/901626554_8bc51ec160_n.jpg'}];
    }]);