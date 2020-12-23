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
      case "element-viewer":
        return {id: button, icon: 'fa-eye', selected: true, active: true, permission:true, tooltip: 'Preview Element', 
                spinner: false, onClick: function() {$rootScope.$broadcast(button);},
                dynamic_buttons: [getToolbarButton("element-editor-saveall")]};
      case "element-history":
        return {id: button, icon: 'fa-history', selected: false, active: true, permission:true, tooltip: 'Element History',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);},
                dynamic_buttons: [getToolbarButton("element-editor-saveall")]};
      case "element-editor":
        return {id: button, icon: 'fa-edit', selected: false, active: true, permission:false, tooltip: 'Edit Element',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);},
                dynamic_buttons: [
                    getToolbarButton("element-editor-save"), getToolbarButton('element-editor-saveC'),
                    getToolbarButton("element-editor-saveall"), getToolbarButton("element-editor-cancel") ]};
      case "view-reorder":
        return {id: button, icon: 'fa-arrows-v', selected: false, active: true, permission:false, tooltip: 'Reorder Content',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);},
                dynamic_buttons: [getToolbarButton("view-reorder-save"), getToolbarButton("view-reorder-cancel")]};
      case "document-snapshot":
        return  {id: button, icon: 'fa-camera', selected: false, active: true, permission:true, tooltip: 'Snapshots',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);},
                dynamic_buttons: [getToolbarButton("document-snapshot-create")]};
      case "tags":
        return {id: button, icon: 'fa-code-fork', selected: false, active: true, permission: true, tooltip: 'Branches and Tags',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "jobs":
        return {id: button, icon: 'fa-sort-amount-desc', selected: false, active: true, permission:true, tooltip: 'Jobs',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "element-editor-save":
        return {id: button, icon: 'fa-save', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "element-editor-saveC":
        return {id: button, icon: 'fa-send-o', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save and Continue',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "element-editor-saveall":
        return {id: button, icon: 'fa-save-all', dynamic: true, selected: false, active: false, permission:false, tooltip: 'Save All (alt + a)',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "element-editor-cancel":
        return {id: button, icon: 'fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "view-reorder-save":
        return {id: button, icon: 'fa-save', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Save',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "view-reorder-cancel":
        return {id: button, icon: 'fa-times', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Cancel',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "document-snapshot-refresh":
        return {id: button, icon: 'fa-refresh', dynamic: true, selected: false, active: false, permission:true, tooltip: 'Refresh',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "document-snapshot-create":
        return {id: button, icon: 'fa-plus', dynamic: true, selected: false, active: false, permission:false, tooltip: 'Create Tag',
                spinner: false, onClick: function() {$rootScope.$broadcast(button);}};
      case "diff-perspective-detail":
        return {id: button, icon: 'fa-info-circle', selected: true, active: true, permission: true, tooltip: 'Detail',
                spinner: false, onClick: function() {$rootScope.diffPerspective = 'detail'; }};
      case "diff-perspective-tree":
        return {id: button, icon: 'fa-sitemap', selected: false, active: true, permission: true, tooltip: 'Context',
                spinner: false, onClick: function() {$rootScope.diffPerspective = 'tree'; }};
    }    
  };

  var getButtonBarButton = function(button, scope) {
    switch (button) {
      case "tree-expand":
        return {id: button, icon: 'fa-caret-square-o-down', selected: true, active: true, permission: true, tooltip: 'Expand All', 
                spinner: false, togglable: false, placement: 'bottom-left', action: function() {$rootScope.$broadcast(button);}};
      case "tree-collapse":
        return {id: button, icon: 'fa-caret-square-o-up', selected: true, active: true, permission: true, tooltip: 'Collapse All', 
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-filter":
        return {id: button, icon: 'fa-filter', selected: true, active: true, permission: true, tooltip: 'Filter', 
                spinner: false, togglable: true, action: function() {$rootScope.$broadcast(button);}};
      case "tree-add-document-or-group":
        return {id: button, icon: 'fa-plus', selected: true, active: true, permission: false, tooltip: 'Add Group or Document',
                spinner: false, togglable: false, placement: 'bottom-right', action: function() {$rootScope.$broadcast(button);},
                dropdown_buttons: [ getButtonBarButton("tree-add-group"), getButtonBarButton("tree-add-document")]};
      case "tree-delete-document":
        return {id: button, icon: 'fa-trash', selected: true, active: true, permission: false, tooltip: 'Remove', 
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-add-view":
        return {id: button, icon: 'fa-plus', selected: true, active: true, permission: false, tooltip: 'Add View',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-add-group":
        return {id: button, icon: 'fa-folder', selected: true, active: true, permission: true, tooltip: 'Add Group',
              spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-add-document":
        return {id: button, icon: 'fa-file', selected: true, active: true, permission: true, tooltip: 'Add Document',
            spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};



      case "tree-add-tag":
        return {id: button, icon: 'fa-tag', selected: true, active: true, permission: true, tooltip: 'Add Tag', 
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-add-branch":
        return {id: button, icon: 'fa-plus', selected: true, active: true, permission: true, tooltip: 'Add Branch',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-delete":
        return {id: button, icon: 'fa-trash', selected: true, active: true, permission: true, tooltip: 'Remove', 
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-delete-view":
        return {id: button, icon: 'fa-trash', selected: true, active: true, permission: false, tooltip: 'Remove View', 
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-reorder-view":
        return {id: button, icon: 'fa-arrows-v', selected: true, active: true, permission: false, tooltip: 'Reorder Views', 
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-reorder-group":
        return {id: button, icon: 'fa-arrows-v', selected: true, active: true, permission: false, tooltip: 'Organize Groups/Docs',
              spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-full-document":
        return {id: button, icon: 'fa-file-text-o', selected: true, active: true, permission: true, tooltip: 'Full Document', 
                spinner: false, togglable: true, toggle_icon: 'fa-file-text', toggle_tooltip: 'View Mode', action: function() {$rootScope.$broadcast(button);}};
      case "view-mode-dropdown":
        return {id: button, icon: 'fa-filter', selected: true, active: true, permission: true, tooltip: 'Filter by type',
                spinner: false, togglable: false, placement: 'bottom-left', action: function() {$rootScope.$broadcast(button);},
                dropdown_buttons: [ getButtonBarButton("tree-show-pe"), getButtonBarButton("tree-show-views"),
                    getButtonBarButton("tree-show-tables"), getButtonBarButton("tree-show-figures"),
                    getButtonBarButton("tree-show-equations")]};
      case "tree-show-views":
        return {id: button, selected: true, active: true, permission: true, tooltip: 'Show Only Views and Sections',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-show-pe":
        return {id: button, selected: false, active: true, permission: true, tooltip: 'Show All',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-show-tables":
        return {id: button, selected: false, active: true, permission: true, tooltip: 'Show Only Tables',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-show-figures":
        return {id: button, selected: false, active: true, permission: true, tooltip: 'Show Only Figures',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tree-show-equations":
        return {id: button, selected: false, active: true, permission: true, tooltip: 'Show Only Equations',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};


      case "show-edits":
        return {id: button, icon: 'fa-pencil-square-o', selected: true, active: true, permission: true, tooltip: 'Enable Edits (alt + d)',
                spinner: false, togglable: true, toggle_icon: 'fa-pencil-square', toggle_tooltip: 'Disable Edits (alt + d)',
                action: function() {$rootScope.$broadcast(button);}};
      case "show-elements":
        return {id: button, icon: 'fa-codepen', selected: true, active: true, permission: true, tooltip: 'Show Elements (alt + e)',
                spinner: false, togglable: true, toggle_icon: 'fa-cube', toggle_tooltip: 'Hide Elements (alt + e)',
                action: function() {$rootScope.$broadcast(button);}};
      case "show-comments":
        return {id: button, icon: 'fa-comment-o', selected: true, active: true, permission: true, tooltip: 'Show Comments (alt + c)',
                spinner: false, togglable: true, toggle_icon: 'fa-comment', toggle_tooltip: 'Hide Comments (alt + c)',
                action: function() {$rootScope.$broadcast(button);}};
      case "refresh-numbering":
        return {id: button, icon: 'fa-sort-numeric-asc', selected: true, active: true, permission: true, tooltip: 'Refresh Figure Numbering',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "share-url":
        return {id: button, icon: 'fa-share-alt', selected: true, active: true, permission: true, tooltip: 'Share Short URL',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "center-previous":
        return {id: button, icon: 'fa-chevron-left', selected: true, active: true, permission: true, tooltip: 'Previous (alt + ,)',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "center-next":
        return {id: button, icon: 'fa-chevron-right', selected: true, active: true, permission: true, tooltip: 'Next (alt + .)',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "export":
        return {id: button, icon: 'fa-download', selected: true, active: true, permission: true, tooltip: 'Export', button_content: 'Export',
              spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);},
              dropdown_buttons: [ getButtonBarButton("word"), getButtonBarButton("tabletocsv")]};
      case "print":
        return {id: button, icon: 'fa-print', selected: true, active: true, permission: true, tooltip: 'Print',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "convert-pdf":
        return {id: button, icon: 'fa-file-pdf-o', selected: true, active: true, permission: true, tooltip: 'Export to PDF',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "word":
        return {id: button, icon: 'fa-file-word-o', selected: true, active: true, permission: true, tooltip: 'Export to Word',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};
      case "tabletocsv":
        return {id: button, icon: 'fa-table', selected: true, active: true, permission: true, tooltip: 'Table to CSV',
                spinner: false, togglable: false, action: function() {$rootScope.$broadcast(button);}};

      case "presentation-element-delete":
        return {id: button, icon: 'fa-trash', selected: true, active: true, permission: true, tooltip: 'Remove',
                spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.delete();}};
      case "presentation-element-save":
        return {id: button, icon: 'fa-save', selected: true, active: true, permission: true, tooltip: 'Save',
                spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.save();}};
      case "presentation-element-saveC":
        return {id: button, icon: 'fa-send-o', selected: true, active: true, permission: true, tooltip: 'Save and Continue',
                spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.saveC();}};
      case "presentation-element-cancel":
        return {id: button, icon: 'fa-times', selected: true, active: true, permission: true, tooltip: 'Cancel',
                spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.cancel();}};
      case "presentation-element-preview":
        return {id: button, icon: 'fa-file-powerpoint-o', selected: true, active: true, permission: true, tooltip: 'Preview Changes',
                spinner: false, togglable: false, action: function(e) {e.stopPropagation(); scope.preview();}};
    }
  };

  var MetaTypes = ['tag', 'connector', 'dependency', 'directedrelationship', 'element', 'property', 'generalization', 'package', 'section', 'group', 'snapshot', 'view', 'branch', 'table', 'figure', 'equation', 'view-composite', 'view-shared', 'view-none' ];

  var getTreeTypes = function() {
    var treeTypes = {};

    MetaTypes.forEach(function (type) {
      treeTypes[type] = getTypeIcon(type) + " fa-fw";
    });

    return treeTypes;
  };

  var getTypeIcon = function(type) {
    var t = type;
    if (!t)
      t = "unknown";
    t = t.toLowerCase();
    switch (t) {
      case "tag":
        return "fa fa-tag";
      case "connector":
        return "fa fa-expand";
      case "dependency":
        return "fa fa-long-arrow-right";
      case "directedrelationship":
        return "fa fa-long-arrow-right";
      case "element":
        return "fa fa-square";
      case "property":
        return "fa fa-circle";
      case "generalization":
        return "fa fa-chevron-right";
      case "package":
        return "fa fa-folder";
      case "section":
        return "section-icon";//"fa-file-o";
      case "group":
        return "fa fa-folder";
      case "snapshot":
        return "fa fa-camera";
      case "view":
        return "fa fa-file";
      case "view-composite":
        return "fa fa-file";
      case "view-shared":
        return "fa fa-file-o";
      case "view-none":
        return "fa fa-file-o";
      case "branch":
        return "fa fa-tasks";
      case "table":
        return "fa fa-table";
      case "figure":
        return "fa fa-image";
      case "equation":
        return "fa fa-superscript";
      default:
        return "fa fa-square";
        }
  };

  var getChangeTypeName = function(type) {
    type = type.toLowerCase();
    switch (type) {
      case "added":
        return "Addition";
      case "updated":
        return "Modification";
      case "removed":
        return "Removal";
    }
  };

    return {
        getButtonBarButton: getButtonBarButton,
        getToolbarButton: getToolbarButton,
        getTypeIcon: getTypeIcon,
        getChangeTypeName: getChangeTypeName,
        getTreeTypes: getTreeTypes
    };
}
