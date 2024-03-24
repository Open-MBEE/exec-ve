import { veApp } from "@ve-app";
import { VeComponentOptions } from "@ve-types/angular";
import { ElementsRequest, GroupObject, OrgObject, ParamsObject, ProjectObject, QueryObject, RefObject, RequestObject } from "@ve-types/mms";
import { RootScopeService } from "@ve-utils/application";
import { DocgenService } from "@ve-utils/docgen/Docgen.service";
import { ElementService, ViewService } from "@ve-utils/mms-api-client";
import { SchemaService } from "@ve-utils/model-schema";

class DocgenController {
    //Bindings
    mmsParams: ParamsObject
    mmsOrg: OrgObject
    mmsProject: ProjectObject
    mmsRef: RefObject
    mmsGroup: GroupObject

    viewId: string = 'docgen-test'
    parentId: string
    schema: string = 'cameo'
    //Locals
    data: string

    static $inject = ['ElementService', 'ViewService', 'RootScopeService', 'DocgenService', 'SchemaService']
    constructor(private elementSvc: ElementService, private viewSvc: ViewService, private rootScopeSvc: RootScopeService, private docgenSvc: DocgenService, private schemaSvc: SchemaService) {}

    $onInit() {
        this.rootScopeSvc.veViewContentLoading(true);
        this.parentId = 'holding_bin_' + this.mmsParams.projectId
        this.data = 'No Data';
        
        this.rootScopeSvc.veViewContentLoading(false);

        //this.viewSvc.   

        const reqOb: ElementsRequest<string> = {
            projectId: this.mmsProject.id,
            refId: this.mmsRef.id,
            elementId: this.mmsParams.preview
        }
        
        this.elementSvc.getElement(reqOb).then((result) => {
            this.docgenSvc.viewPointMethod([result],reqOb,[
                this.docgenSvc.collectOwnedElements(true),
                this.docgenSvc.filterByStereotypes(this.schemaSvc.getSchema<string[]>('REQUIREMENT_SID', this.schema), false),
                this.docgenSvc.sortByAttribute('name', false)
            ]).then((result) => {
                this.data = result.map((e) => {
                    return e['name']
                }).join();
            })
        })
        

    }
}

/* Controllers */
const DocgenComponent: VeComponentOptions = {
    selector: 'docgen',
    template: `
    {{ $ctrl.data }}
`,
    bindings: {
        mmsParams: '<',
        mmsOrg: '<',
        mmsProject: '<',
        mmsRef: '<',
        mmsGroup: '<',
    },
    controller: DocgenController,
};

veApp.component(DocgenComponent.selector, DocgenComponent);