import { VeExperimentConfig, VeExperimentDescriptor } from '@ve-components/services';
import { BrandingStyle } from '@ve-utils/application';

export interface VeConfig {
    version?: string;
    apiUrl: string;
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
