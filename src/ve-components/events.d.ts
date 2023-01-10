export declare namespace veComponentsEvents {
    abstract interface setToolbarData<T> {
        id: string
        value: T
    }

    type setPermissionData = setToolbarData<boolean>
    type setIconData = setToolbarData<string>
    type setToggleData = setToolbarData<null>
}
