import {VeExtensionConfig, VeExtensionDescriptor} from "@ve-ext/index.d";


export interface VeConfig {
    version?: string,
    apiUrl: string,
    basePath: string,
    enableDebug?: boolean,
    customLabels?: {[key: string]: string}
    loginBanner?: {
        labels: string[][]
        separator?: string,
        background?: string,
        color?: string,
        disabled?: boolean
    }
    banner?: {
        message: string | string[]
        separator?: string,
        background?: string,
        color?: string,
        top?: boolean,
        bottom?: boolean,
        disabled?: boolean
    }
    footer?: {
        message: string | string[]
        separator?: string,
        background?: string,
        color?: string
        disabled?: boolean
    }
    loginTimeout?: number,
    extensions?: VeExtensionDescriptor[]
    extConfig?: VeExtensionConfig
}