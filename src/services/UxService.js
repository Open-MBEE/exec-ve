'use strict';

angular.module('mms')
.factory('UxService', ['$rootScope', UxService]);

/**
 * @ngdoc service
 * @name mms.UxService
 * 
 * @description
 * Ux Service
 */
function UxService($rootScope) {

    /**
     * @ngdoc method
     * @name mms.UxService#getToolbarButton
     * @methodOf mms.UxService
     * 
     * @description
     * Get pre-defined toolbar buttons
     * 
     * @param {<string>} id of button
     * @returns {Object} Button object
     */
    var getToolbarButton = function(button) {
		switch (button) {
		  case "element.viewer":
		  	return {id: 'element.viewer', icon: 'fa fa-eye', selected: true, active: true, permission:true, tooltip: 'Preview Element', 
            		spinner: false, onClick: function() {$rootScope.$broadcast('element.viewer');}};
		  case "element.editor":
		    return {id: 'element.editor', icon: 'fa fa-edit', selected: false, active: true, permission:false, tooltip: 'Edit Element',
		            spinner: false, onClick: function() {$rootScope.$broadcast('element.editor');},
		        	dynamic_buttons: [getToolbarButton("element.editor.save"), getToolbarButton("element.editor.cancel")]};
		  case "view.reorder":
	        return {id: 'view.reorder', icon: 'fa fa-arrows-v', selected: false, active: true, permission:false, tooltip: 'Reorder View',
	    	        spinner: false, onClick: function() {$rootScope.$broadcast('view.reorder');},
		        	dynamic_buttons: [getToolbarButton("view.reorder.save"), getToolbarButton("view.reorder.cancel")]};
		  case "document.snapshot":
		  	return  {id: 'document.snapshot', icon: 'fa fa-camera', selected: false, active: true, permission:true, tooltip: 'Snapshots',
		            spinner: false, onClick: function() {$rootScope.$broadcast('document.snapshot');},
		        	dynamic_buttons: [getToolbarButton("document.snapshot.refresh"), getToolbarButton("document.snapshot.create")]};
		  case "element.editor.save":
			return {id: 'element.editor.save', icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
				        spinner: false, onClick: function() {$rootScope.$broadcast('element.editor.save');}};
		  case "element.editor.cancel":
			return {id: 'element.editor.cancel', icon: 'fa fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
			            spinner: false, onClick: function() {$rootScope.$broadcast('element.editor.cancel');}};
		  case "view.reorder.save":
			return {id: 'view.reorder.save', icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
			            spinner: false, onClick: function() {$rootScope.$broadcast('view.reorder.save');}};
		  case "view.reorder.cancel":
		    return {id: 'view.reorder.cancel', icon: 'fa fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
		            spinner: false, onClick: function() {$rootScope.$broadcast('view.reorder.cancel');}};
		  case "document.snapshot.refresh":
		    return {id: 'document.snapshot.refresh', icon: 'fa fa-refresh', pullDown: true, dynamic: true, selected: false, active: false, permission:true, tooltip: 'Refresh',
		            spinner: false, onClick: function() {$rootScope.$broadcast('document.snapshot.refresh');}};
		  case "document.snapshot.create":
		    return {id: 'document.snapshot.create', icon: 'fa fa-plus', dynamic: true, selected: false, active: false, permission:false, tooltip: 'Create Snapshot',
		            spinner: false, onClick: function() {$rootScope.$broadcast('document.snapshot.create');}};
		}    
	};

    return {
        getToolbarButton: getToolbarButton
    };
}