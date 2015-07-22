'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ArrmHomeCtrl', '$scope', 'rootScope', '$document', '$window', '$setInterval',
	function($scope, $rootScope,$document, $window, $setInterval){

	$rootScope.mms_title = 'ARRM HOMEEEEEEE';

	var slideimages = new Array("arrmimages/orbitor.jpg","arrmimages/eva.jpg","arrmimages/commTerminal.jpg","arrmimages/arv_models.jpg","arrmimages/budget.jpg","arrmimages/boulder_capture.jpg","arrmimages/testbed.jpg");

// var titleArray = new Array('18 May 2015 story: NASA Seeks Additional Information for Asteroid Redirect Mission Spacecraft','Notional ARV Modules and Launch Adapter Design','NASA FY\u0026#39;16 Budget Summary Briefing Calls Our ARRM work','Boulder Capture Simulations Test-bed','Ground-based Optical Comm Terminal could support a secondary optical telecom system for high data rate downlink in lunar orbit and potentially, at the asteroid.','Astronaut EVA with tools at boulder','Announcement:  ARRM MCR rescheduled for March 24, 2015.')

	var titleArray = new Array("18 May 2015 story: NASA Seeks Additional Information for Asteroid Redirect Mission Spacecraft","Astronaut EVA with tools at boulder","Ground-based Optical Comm Terminal could support a secondary optical telecom system for high data rate downlink in lunar orbit and potentially, at the asteroid.","Notional ARV Modules and Launch Adapter Design","NASA FY\u0026#39;16 Budget Summary Briefing Calls Our ARRM work","Announcement:  ARRM MCR rescheduled for March 24, 2015.","Boulder Capture Simulations Test-bed");
	var image_number = 0;
	var image_length = slideimages.length -1;

	var change_image = function (num){

		// if(num = 0){
		// 	document.slidewhow.src= slideimages[image_number]
		// 	document.getElementById("description").innerHTML = titleArray[image_number];
		// 	setInterval(100000)
		// }

		image_number = image_number + num;

		if(image_number > image_length){
			image_number = 0;
		}

		if(image_number <0){
			image_number = image_length;
		}




		// document.write(image_number)
		$document.slidewhow.src= slideimages[image_number];
		$document.getElementById("description").innerHTML = titleArray[image_number];
		return false;
	};

	var auto = function(){
		$setInterval("change_image(1)", 2500);
	};

	// function getImageNum(){
	// 	return image_number
	// }

	$scope.pause = function(){
		// setInterval(5000)
		$setInterval("change_image(0)", 5000);
	};
	$window.onload = auto();

});