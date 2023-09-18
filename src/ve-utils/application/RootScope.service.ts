import { StateDeclaration } from '@uirouter/core/lib/state/interface';

import { SessionService } from '@ve-utils/core';

import { veUtils } from '@ve-utils';

import { ParamsObject } from '@ve-types/mms';

export class RootScopeService {
    public constants = {
        LOGINMODALOPEN: 'login-modal-open',
        MMSREFOB: 'mms-ref-ob',
        RIGHTPANETOGGLEABLE: 'mms-pane-toggleable',
        RIGHTPANECLOSED: 'mms-pane-closed',
        VEWARNINGOK: 've-warning-ok',
        VETITLE: 've-title',
        VESTATECHANGING: 've-state-changing',
        VEVIEWCONTENTLOADING: 've-view-content-loading',
        VEREDIRECT: 've-redirect',
        VEREDIRECTFROMOLD: 've-redirect-old',
        VECRUSHURL: 've-crush-url',
        VECOMMENTSON: 've-comments-on',
        VENUMBERINGON: 've-numbering-on',
        VEFULLDOCMODE: 've-full-doc-mode',
        VEELEMENTSON: 've-elements-on',
        VEEDITMODE: 've-edit-mode',
        VEHIDEPANES: 've-hide-panes',
        VEHIDERIGHT: 've-hide-right',
        VEHIDELEFT: 've-hide-left',
        VESHOWLOGIN: 've-show-login',
        TREESHOWPE: 'tree-show-pe',
        TREEINITIALSELECTION: 'tree-initialSelection',
        TREEICONS: 'tree-icons',
        LEFTPANECLOSED: 'tree-pane-closed',
    };

    static $inject = ['SessionService'];

    constructor(private sessionSvc: SessionService) {}

    init(): void {
        this.loginModalOpen();
        this.rightPaneToggleable();
        this.rightPaneClosed();
        this.veTitle();
        this.veShowLogin();
        this.veStateChanging();
        this.veViewContentLoading();
        this.veRedirect();
        this.veRedirectFromOld();
        this.veCrushUrl();
        this.veFullDocMode();
        this.veCommentsOn();

        this.veNumberingOn();
        this.veElementsOn();
        this.veEditMode();
        this.veHidePanes();
        this.veHideLeft();
        this.veHideRight();
    }

    loginModalOpen(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.LOGINMODALOPEN, value, false);
    }

    rightPaneToggleable(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.RIGHTPANETOGGLEABLE, value, true);
    }

    rightPaneClosed(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.RIGHTPANECLOSED, value, false);
    }

    veWarningOk(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEWARNINGOK, value, false);
    }

    veTitle(value?: string | undefined): string {
        return this.sessionSvc.accessor(this.constants.VETITLE, value, 'View Editor');
    }

    veStateChanging(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VESTATECHANGING, value, false);
    }

    veViewContentLoading(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEVIEWCONTENTLOADING, value, false);
    }

    veRedirect(
        value?: { toState: StateDeclaration; toParams: ParamsObject } | undefined
    ): { toState: StateDeclaration; toParams: ParamsObject } | undefined {
        return this.sessionSvc.accessor(this.constants.VEREDIRECT, value, null);
    }

    veRedirectFromOld(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEREDIRECTFROMOLD, value, false);
    }

    veCrushUrl(value?: string | undefined): string {
        return this.sessionSvc.accessor(this.constants.VECRUSHURL, value, null);
    }

    veFullDocMode(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEFULLDOCMODE, value, false);
    }

    veCommentsOn(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VECOMMENTSON, value, false);
    }

    veNumberingOn(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VENUMBERINGON, value, true);
    }

    veElementsOn(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEELEMENTSON, value, false);
    }

    veEditMode(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEEDITMODE, value, false);
    }

    veHidePanes(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEHIDEPANES, value, false);
    }

    veHideLeft(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEHIDELEFT, value, false);
    }

    veHideRight(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VEHIDERIGHT, value, false);
    }

    veShowLogin(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.VESHOWLOGIN, value, false);
    }

    leftPaneClosed(value?: boolean | undefined): boolean {
        return this.sessionSvc.accessor(this.constants.LEFTPANECLOSED, value, false);
    }
}

veUtils.service('RootScopeService', RootScopeService);
