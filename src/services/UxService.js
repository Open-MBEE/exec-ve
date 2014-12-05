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
		  	return {id: button, icon: 'fa fa-eye', selected: true, active: true, permission:true, tooltip: 'Preview Element', 
            		spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "element.editor":
		    return {id: button, icon: 'fa fa-edit', selected: false, active: true, permission:false, tooltip: 'Edit Element',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);},
		        	dynamic_buttons: [getToolbarButton("element.editor.save"), getToolbarButton("element.editor.cancel")]};
		  case "view.reorder":
	        return {id: button, icon: 'fa fa-arrows-v', selected: false, active: true, permission:false, tooltip: 'Reorder View',
	    	        spinner: false, onClick: function() {$rootScope.$broadcast(button);},
		        	dynamic_buttons: [getToolbarButton("view.reorder.save"), getToolbarButton("view.reorder.cancel")]};
		  case "document.snapshot":
		  	return  {id: button, icon: 'fa fa-camera', selected: false, active: true, permission:true, tooltip: 'Snapshots',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);},
		        	dynamic_buttons: [getToolbarButton("document.snapshot.refresh"), getToolbarButton("document.snapshot.create")]};
		  case "element.editor.save":
			return {id: button, icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
				        spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "element.editor.cancel":
			return {id: button, icon: 'fa fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
			            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "view.reorder.save":
			return {id: button, icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
			            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "view.reorder.cancel":
		    return {id: button, icon: 'fa fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "document.snapshot.refresh":
		    return {id: button, icon: 'fa fa-refresh', pullDown: true, dynamic: true, selected: false, active: false, permission:true, tooltip: 'Refresh',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "document.snapshot.create":
		    return {id: button, icon: 'fa fa-plus', dynamic: true, selected: false, active: false, permission:false, tooltip: 'Create Snapshot',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		}    
	};

	var getButtonBarButton = function(button) {
		switch (button) {
		  case "tree.expand":
		  	return {id: button, icon: 'fa-caret-square-o-down', selected: true, active: true, permission: true, tooltip: 'Expand All', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.collapse":
		  	return {id: button, icon: 'fa-caret-square-o-up', selected: true, active: true, permission: true, tooltip: 'Collapse All', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.filter":
		  	return {id: button, icon: 'fa-filter', selected: true, active: true, permission: true, tooltip: 'Filter', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.add.task":
		  	return {id: button, icon: 'fa-plus', selected: true, active: true, permission: true, tooltip: 'Add Task', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.add.configuration":
		  	return {id: button, icon: 'fa-tag', selected: true, active: true, permission: true, tooltip: 'Add Configuration', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.delete":
		  	return {id: button, icon: 'fa-times', selected: true, active: true, permission: true, tooltip: 'Delete', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.merge":
		  	return {id: button, icon: 'fa-share-alt fa-flip-horizontal', selected: true, active: true, permission: true, tooltip: 'Merge Task', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
        }
	};

    return {
    	getButtonBarButton: getButtonBarButton,
        getToolbarButton: getToolbarButton
    };
}