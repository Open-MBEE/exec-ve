import * as angular from "angular";

import {
    AuthService,
    CacheService,
    EditService,
    ElementService,
    EventService,
    PermissionsService,
    RootScopeService,
    URLService,
    UtilsService,
    ViewService
} from "@ve-utils/services";
import {ElementObject} from "@ve-types/mms";
import {veCore} from "@ve-core";

export class CoreUtilsService {

    //locals
    private addItemData

    private revertData: { elementId: string; baseCommit: object; refId: string; compareCommit: object;
        projectId: string; element: object };

    static $inject = ['$q', '$uibModal', '$timeout', '$compile', '$window', 'growl',
        'URLService', 'CacheService', 'ElementService', 'ViewService',  'UtilsService', 'AuthService',
        'PermissionsService', 'RootScopeService', 'EventService', 'EditService']

    constructor(private $q, private $uibModal, private $timeout, private $compile, private $window, private growl,
                private uRLSvc : URLService, private cacheSvc : CacheService, private elementSvc : ElementService,
                private viewSvc : ViewService, private utilsSvc : UtilsService, private authSvc : AuthService,
                private permissionsSvc : PermissionsService, private rootScopeSvc : RootScopeService,
                private eventSvc : EventService, private editSvc : EditService) {

    }

    public toggleLeftPane(searchTerm) {
        if ( searchTerm && !this.rootScopeSvc.leftPaneClosed() ) {
            this.eventSvc.$broadcast('left-pane.toggle', true);
        }

        if ( !searchTerm && this.rootScopeSvc.leftPaneClosed() ) {
            this.eventSvc.$broadcast('left-pane.toggle', false);
        }
    };

    public successUpdates(elemType, id) {
        this.eventSvc.$broadcast('content-reorder.refresh');
        this.eventSvc.$broadcast('content-reorder-saved', {id: id});
        this.growl.success("Adding " + elemType + " Successful");
        // Show comments when creating a comment PE
        if (elemType === 'Comment' && !this.rootScopeSvc.veCommentsOn()) {
            this.$timeout(() => {
                $('.show-comments').click();
            }, 0, false);
        }
    };

    public focusOnEditorAfterAddingWidgetTag(editor) {
        var element = editor.widgets.focused.element.getParent();
        var range = editor.createRange();
        if(range) {
            range.moveToClosestEditablePosition(element, true);
            range.select();
        }
    };

    /**
     * @ngdoc method
     * @name Utils#addPresentationElement
     * @methodOf veCore.Utils
     *
     * @description
     * Utility to add a new presentation element to view or section
     *
     * @param {Object} $ctrl controller
     * @param {string} type type of presentation element (Paragraph, Section)
     * @param {ElementObject} viewOrSectionOb the view or section (instance spec) object
     */
    public addPresentationElement($ctrl: angular.IComponentController, type: string, viewOrSectionOb: ElementObject) {
        // $ctrl.viewOrSectionOb = viewOrSectionOb;
        // $ctrl.presentationElemType = type;
        this.addItemData = {
            addType: 'pe',
            itemType: type,
            viewOrSectionOb: viewOrSectionOb,
            addPeIndex: $ctrl.addPeIndex
        }
        let instance = this.$uibModal.open({
            component: 'addItemModal',
            resolve: {
                getAddData: () => {
                    return this.addItemData;
                }
            }});
        instance.result.then((data) => {
            if (data.type !== 'InstanceSpecification' || this.viewSvc.isSection(data)) {
                return; //do not open editor for existing pes added or if pe/owner is a section
            }
            this.$timeout(() => { //auto open editor for newly added pe
                $('#' + data.id).find('mms-transclude-doc,mms-transclude-com').click();
            }, 0, false);
        });
    };

    public checkForDuplicateInstances(operand) {
        var seen = {}, dups = [], curr;
        for (var i = 0; i < operand.length; i++) {
            curr = operand[i].instanceId;
            if (curr) {
                if (seen[curr]) {
                    dups.push(operand[i]);
                    operand.splice(i, 1);
                    i--;
                    continue;
                }
                seen[curr] = true;
            } else {
                //instanceId is invalid?
            }
        }
        return dups;
    };
}

veCore.service('CoreUtilsService', CoreUtilsService)