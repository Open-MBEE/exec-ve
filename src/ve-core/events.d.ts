export namespace veCoreEvents {
    interface buttonClicked {
        $event?: JQuery.ClickEvent
        clicked: string
    }

    interface toolbarClicked {
        id: string
        category?: string
        title?: string
    }

    abstract interface setToolbarData<T> {
        tbId: string
        id: string
        value: T
    }

    type setPermissionData = setToolbarData<boolean>
    type setIconData = setToolbarData<string>
    type setToggleData = setToolbarData<null>
}
