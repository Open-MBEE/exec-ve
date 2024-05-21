import { VeExperimentConfig, VeExperimentDescriptor } from '@ve-components/services';
import { BrandingStyle } from '@ve-utils/application';

export interface VeConfig {
    version?: string;
    apiUrl: string;
    profiles?: {
        orgId: string;
        hideOrg: boolean;
    };
    printUrl: string;
    basePath: string;
    enableDebug?: boolean;
    customLabels?: { [key: string]: string };
    loginBanner?: BrandingStyle;
    loginWarning?: BrandingStyle;
    banner?: BrandingStyle;
    footer?: BrandingStyle;
    loginTimeout?: number;
    experimental?: VeExperimentDescriptor[];
    expConfig?: VeExperimentConfig;
}

const veConfig = window.__env;

export default veConfig;
