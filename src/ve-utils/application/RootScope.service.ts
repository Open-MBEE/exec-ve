import { StateDeclaration } from '@uirouter/core/lib/state/interface'

import { SessionService } from '@ve-utils/core'

import { veUtils } from '@ve-utils'

import { ParamsObject, RefObject } from '@ve-types/mms'

export class RootScopeService {
    public constants = {
        LOGINMODALOPEN: 'login-modal-open',
        MMSREFOB: 'mms-ref-ob',
        RIGHTPANETOGGLEABLE: 'mms-pane-toggleable',
        RIGHTPANECLOSED: 'mms-pane-closed',
        VETITLE: 've-title',
        VESTATECHANGING: 've-state-changing',
        VEVIEWCONTENTLOADING: 've-view-content-loading',
        VEREDIRECT: 've-redirect',
        VEREDIRECTFROMOLD: 've-redirect-old',
        VECRUSHURL: 've-crush-url',
        VECOMMENTSON: 've-comments-on',
        VEFULLDOCMODE: 've-full-doc-mode',
        VEELEMENTSON: 've-elements-on',
        VEEDITMODE: 've-edit-mode',
        VEHIDEPANES: 've-hide-panes',
        VESHOWMANAGEREFS: 've-show-manage-refs',
        VESHOWLOGIN: 've-show-login',
        VESHOWSEARCH: 've-show-search',
        TREESHOWPE: 'tree-show-pe',
        TREEINITIALSELECTION: 'tree-initialSelection',
        TREEICONS: 'tree-icons',
        LEFTPANECLOSED: 'tree-pane-closed',
    }

    static $inject = ['SessionService']

    constructor(private sessionSvc: SessionService) {}

    loginModalOpen(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.LOGINMODALOPEN,
            value,
            false
        )
    }

    mmsRefOb(value?: RefObject | undefined): RefObject {
        return this.sessionSvc.accessor(this.constants.MMSREFOB, value, null)
    }

    rightPaneToggleable(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.RIGHTPANETOGGLEABLE,
            value,
            true
        )
    }

    rightPaneClosed(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.RIGHTPANECLOSED,
            value,
            false
        )
    }

    veTitle(value?: string | undefined): string {
        return this.sessionSvc.accessor(
            this.constants.VETITLE,
            value,
            'View Editor',
            true
        )
    }

    veStateChanging(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VESTATECHANGING,
            value,
            false
        )
    }

    veViewContentLoading(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VEVIEWCONTENTLOADING,
            value,
            false,
            true
        )
    }

    veRedirect(
        value?:
            | { toState: StateDeclaration; toParams: ParamsObject }
            | undefined
    ): { toState: StateDeclaration; toParams: ParamsObject } | undefined {
        return this.sessionSvc.accessor(this.constants.VEREDIRECT, value, null)
    }

    veRedirectFromOld(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VEREDIRECTFROMOLD,
            value,
            false,
            true
        )
    }

    veCrushUrl(value?: string | undefined): string {
        return this.sessionSvc.accessor(this.constants.VECRUSHURL, value, null)
    }

    veFullDocMode(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VEFULLDOCMODE,
            value,
            false
        )
    }

    veCommentsOn(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VECOMMENTSON,
            value,
            false,
            true
        )
    }

    veNumberingOn(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VECOMMENTSON,
            value,
            true,
            true
        )
    }

    veElementsOn(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VEELEMENTSON,
            value,
            false,
            true
        )
    }

    veEditMode(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VEEDITMODE,
            value,
            false,
            true
        )
    }

    veHidePanes(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VEHIDEPANES,
            value,
            false,
            true
        )
    }

    veShowManageRefs(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VESHOWMANAGEREFS,
            value,
            false,
            true
        )
    }

    veShowLogin(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.VESHOWLOGIN,
            value,
            false,
            true
        )
    }

    veShowSearch(value?: boolean | undefined): boolean | undefined {
        return this.sessionSvc.accessor(
            this.constants.VESHOWSEARCH,
            value,
            false,
            true
        )
    }

    treeShowPe(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.TREESHOWPE, value, false)
    }

    treeInitialSelection(value?: string | undefined): string {
        return this.sessionSvc.accessor(
            this.constants.TREEINITIALSELECTION,
            value,
            null,
            true
        )
    }

    leftPaneClosed(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(
            this.constants.LEFTPANECLOSED,
            value,
            false
        )
    }
}

veUtils.service('RootScopeService', RootScopeService)
