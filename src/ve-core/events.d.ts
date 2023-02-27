export namespace veCoreEvents {
    interface buttonClicked {
        $event: JQuery.ClickEvent
        clicked: string
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
