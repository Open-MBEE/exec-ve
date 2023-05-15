import { ElementObject, ElementsRequest } from '@ve-types/mms';

export namespace veCoreEvents {
    interface elementSelectedData extends ElementsRequest<string> {
        rootId?: string;
        refType?: string;
        displayOldSpec?: boolean;
        refresh?: boolean;
    }

    interface elementUpdatedData {
        element: ElementObject;
        continueEdit?: boolean;
    }
    interface buttonClicked {
        $event?: JQuery.ClickEvent;
        clicked: string;
    }

    interface toolbarClicked {
        id: string;
        category?: string;
        title?: string;
    }

    abstract interface setToolbarData<T> {
        tbId: string;
        id: string;
        value: T;
    }

    type setPermissionData = setToolbarData<boolean>;
    type setIconData = setToolbarData<string>;
    type setToggleData = setToolbarData<null>;
}
