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
		  	return {id: button, icon: 'fa-eye', selected: true, active: true, permission:true, tooltip: 'Preview Element', 
            		spinner: false, onClick: function() {$rootScope.$broadcast(button);},
                dynamic_buttons: [getToolbarButton("element.editor.saveall")]};
		  case "element.editor":
		    return {id: button, icon: 'fa-edit', selected: false, active: true, permission:false, tooltip: 'Edit Element',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);},
		        	dynamic_buttons: [getToolbarButton("element.editor.save"), getToolbarButton("element.editor.saveall"), getToolbarButton("element.editor.cancel")]};
		  case "view.reorder":
	        return {id: button, icon: 'fa-arrows-v', selected: false, active: true, permission:false, tooltip: 'Reorder View',
	    	        spinner: false, onClick: function() {$rootScope.$broadcast(button);},
		        	dynamic_buttons: [getToolbarButton("view.reorder.save"), getToolbarButton("view.reorder.cancel")]};
		  case "document.snapshot":
		  	return  {id: button, icon: 'fa-camera', selected: false, active: true, permission:true, tooltip: 'Snapshots',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);},
		            dynamic_buttons: [getToolbarButton("document.snapshot.create")]};
		  case "tags":
            return {id: button, icon: 'fa-tag', selected: false, active: true, permission: true, tooltip: 'Tags',
                    spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "element.editor.save":
			return {id: button, icon: 'fa-save', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
				        spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "element.editor.saveall":
			return {id: button, icon: 'fa-save-all', dynamic: true, selected: false, active: false, permission:false, tooltip: 'Save All',
				        spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "element.editor.cancel":
			return {id: button, icon: 'fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
			            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "view.reorder.save":
			return {id: button, icon: 'fa-save', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
			            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "view.reorder.cancel":
		    return {id: button, icon: 'fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "document.snapshot.refresh":
		    return {id: button, icon: 'fa-refresh', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Refresh',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		  case "document.snapshot.create":
		    return {id: button, icon: 'fa-plus', dynamic: true, selected: false, active: false, permission:false, tooltip: 'Create Tag',
		            spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
		}    
	};

	var getButtonBarButton = function(button, scope) {
		switch (button) {
		  case "tree.expand":
		  	return {id: button, icon: 'fa-caret-square-o-down', selected: true, active: true, permission: true, tooltip: 'Expand All', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.collapse":
		  	return {id: button, icon: 'fa-caret-square-o-up', selected: true, active: true, permission: true, tooltip: 'Collapse All', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.filter":
		  	return {id: button, icon: 'fa-filter', selected: true, active: true, permission: true, tooltip: 'Filter', 
            		spinner: false, togglable: true, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.add.document":
		  	return {id: button, icon: 'fa-plus', selected: true, active: true, permission: false, tooltip: 'Add Document', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.add.view":
		  	return {id: button, icon: 'fa-plus', selected: true, active: true, permission: false, tooltip: 'Add View', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.add.configuration":
		  	return {id: button, icon: 'fa-tag', selected: true, active: true, permission: true, tooltip: 'Add Tag', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.add.task":
		  	return {id: button, icon: 'fa-plus', selected: true, active: true, permission: true, tooltip: 'Add Task', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.delete":
		  	return {id: button, icon: 'fa-trash', selected: true, active: true, permission: true, tooltip: 'Delete', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.delete.view":
		  	return {id: button, icon: 'fa-trash', selected: true, active: true, permission: false, tooltip: 'Delete View', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.merge":
		  	return {id: button, icon: 'fa-share-alt fa-flip-horizontal', selected: true, active: true, permission: true, tooltip: 'Merge Task', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.reorder.view":
		  	return {id: button, icon: 'fa-arrows-v', selected: true, active: true, permission: false, tooltip: 'Reorder Views', 
            		spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
		  case "tree.full.document":
		  	return {id: button, icon: 'fa-file-text-o', selected: true, active: true, permission: true, tooltip: 'Full Document', 
            		spinner: false, togglable: true, toggle_icon: 'fa-file-text', toggle_tooltip: 'View Mode', action: function() {$rootScope.$broadcast(button);}};
          case "tree.showall.sites":
            return {id: button, icon: 'fa-eye', selected: true, active: true, permission: true, tooltip: 'Show Alfresco Sites', 
                    spinner: false, togglable: true, toggle_icon: 'fa-eye-slash', toggle_tooltip: 'Hide Alfresco Sites',
                    action: function() {$rootScope.$broadcast(button);}};
           case "show.comments":
            return {id: button, icon: 'fa-comment-o', selected: true, active: true, permission: true, tooltip: 'Show Comments', 
                    spinner: false, togglable: true, toggle_icon: 'fa-comment', toggle_tooltip: 'Hide Comments',
                    action: function() {$rootScope.$broadcast(button);}};
          case "show.elements":
            return {id: button, icon: 'fa-codepen', selected: true, active: true, permission: true, tooltip: 'Show Elements', 
                    spinner: false, togglable: true, toggle_icon: 'fa-cube', toggle_tooltip: 'Hide Elements',
                    action: function() {$rootScope.$broadcast(button);}};
          case "show.edits":
            return {id: button, icon: 'fa-pencil-square-o', selected: true, active: true, permission: true, tooltip: 'Enable Edits', 
                    spinner: false, togglable: true, toggle_icon: 'fa-pencil-square', toggle_tooltip: 'Disable Edits',
                    action: function() {$rootScope.$broadcast(button);}};
          case "center.previous":
            return {id: button, icon: 'fa-chevron-left', selected: true, active: true, permission: true, tooltip: 'Previous', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "center.next":
            return {id: button, icon: 'fa-chevron-right', selected: true, active: true, permission: true, tooltip: 'Next', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "download.pdf":
            return {id: button, icon: 'fa-file-pdf-o', selected: true, active: true, permission: true, tooltip: 'Download PDF', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "download.zip":
            return {id: button, icon: 'fa-file-zip-o', selected: true, active: true, permission: true, tooltip: 'Download ZIP', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "generate.pdf":
            return {id: button, icon: 'fa-file-pdf-o', selected: true, active: true, permission: true, tooltip: 'Generate PDF', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "generate.zip":
            return {id: button, icon: 'fa-file-zip-o', selected: true, active: true, permission: true, tooltip: 'Generate ZIP', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "view.add.dropdown":
            return {id: button, icon: 'fa-plus', selected: true, active: true, permission: true, tooltip: 'Add Item', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);},
                	dropdown_buttons: [getButtonBarButton("view.add.paragraph"), getButtonBarButton("view.add.table"),
                						getButtonBarButton("view.add.list"), getButtonBarButton("view.add.equation"), getButtonBarButton("view.add.image"),
                						getButtonBarButton("view.add.section")]};
          case "view.add.table":
            return {id: button, icon: 'fa-table', selected: true, active: true, permission: true, tooltip: 'Add Table', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "view.add.list":
            return {id: button, icon: 'fa-list', selected: true, active: true, permission: true, tooltip: 'Add List', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "view.add.equation":
            return {id: button, icon: 'fa-superscript', selected: true, active: true, permission: true, tooltip: 'Add Equation', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "view.add.paragraph":
            return {id: button, icon: 'fa-paragraph', selected: true, active: true, permission: true, tooltip: 'Add Text', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "view.add.image":
            return {id: button, icon: 'fa-image', selected: true, active: true, permission: true, tooltip: 'Add Figure', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "view.add.section":
            return {id: button, icon: 'fa-list-alt', selected: true, active: true, permission: true, tooltip: 'Add Section', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
          case "presentation.element.delete":
            return {id: button, icon: 'fa-trash', selected: true, active: true, permission: true, tooltip: 'Delete', 
                    spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.delete();}};
          case "presentation.element.save":
            return {id: button, icon: 'fa-save', selected: true, active: true, permission: true, tooltip: 'Save', 
                    spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.save();}};
          case "presentation.element.cancel":
            return {id: button, icon: 'fa-times', selected: true, active: true, permission: true, tooltip: 'Cancel', 
                    spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.cancel();}};
          case "presentation.element.preview":
            return {id: button, icon: 'fa-file-powerpoint-o', selected: true, active: true, permission: true, tooltip: 'Preview Changes', 
                    spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.preview();}};
          case "section.add.dropdown":
            return {id: button, icon: 'fa-plus', selected: true, active: true, permission: true, tooltip: 'Add Item', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);},
                    dropdown_buttons: [getButtonBarButton("section.add.paragraph",scope), getButtonBarButton("section.add.table",scope),
                                        getButtonBarButton("section.add.list",scope), getButtonBarButton("section.add.equation", scope), getButtonBarButton("section.add.image",scope),
                                        getButtonBarButton("section.add.section",scope)]};
          case "section.add.table":
            return {id: button, icon: 'fa-table', selected: true, active: true, permission: true, tooltip: 'Add Table', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button, scope.section);}};
          case "section.add.list":
            return {id: button, icon: 'fa-list', selected: true, active: true, permission: true, tooltip: 'Add List', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button, scope.section);}};
          case "section.add.equation":
            return {id: button, icon: 'fa-superscript', selected: true, active: true, permission: true, tooltip: 'Add Equation', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button, scope.section);}};
          case "section.add.paragraph":
            return {id: button, icon: 'fa-paragraph', selected: true, active: true, permission: true, tooltip: 'Add Text', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button, scope.section);}};
          case "section.add.image":
            return {id: button, icon: 'fa-image', selected: true, active: true, permission: true, tooltip: 'Add Figure', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button, scope.section);}};
          case "section.add.section":
            return {id: button, icon: 'fa-list-alt', selected: true, active: true, permission: true, tooltip: 'Add Section', 
                    spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button, scope.section);}};
        }
	};

	var MetaTypes = ['configuration', 'connector', 'dependency', 'directedrelationship', 'element', 'property', 'generalization', 'package', 'section', 'site', 'snapshot', 'view', 'workspace' ];

	var getTreeTypes = function() {
		var treeTypes = {};

		MetaTypes.forEach(function (type) {
			treeTypes[type] = "fa " + getTypeIcon(type) + " fa-fw";
		});

		return treeTypes;
	};

	var getTypeIcon = function(type) {
		type = type.toLowerCase();
		switch (type) {
		  case "configuration":
		  	return "fa-tag";
		  case "connector":
		  	return "fa-expand";
		  case "dependency":
		  	return "fa-long-arrow-right";
		  case "directedrelationship":
		  	return "fa-long-arrow-right";
		  case "element":
		  	return "fa-square";
		  case "property":
		  	return "fa-circle";
		  case "generalization":
		  	return "fa-chevron-right";
		  case "package":
		  	return "fa-folder";
		  case "section":
		  	return "fa-file-o";
		  case "site":
		  	return "fa-folder";
		  case "snapshot":
		  	return "fa-camera";
		  case "view":
		  	return "fa-file";
		  case "view":
		  	return "fa-file";
		  case "workspace":
		  	return "fa-tasks";
        }
	};

    return {
    	getButtonBarButton: getButtonBarButton,
        getToolbarButton: getToolbarButton,
        getTypeIcon: getTypeIcon,
        getTreeTypes: getTreeTypes
    };
}