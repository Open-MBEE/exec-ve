import { veAdmin } from '@ve-admin';
import { RootScopeService } from '@ve-utils/application';
import { UserService } from '@ve-utils/mms-api-client';

import { VeComponentOptions } from '@ve-types/angular';
import Icon from '@ve-types/icons';
import { OrgObject, ParamsObject, ProjectObject, RefObject } from '@ve-types/mms';
import Role, { VeRole } from '@ve-types/mms/permissions';

export class InformationPageController implements angular.IComponentController {
    // const { branchService } = useApiClient();
    // const [data, setData] = useState(null);
    // const [modal, setModal] = useState(false);
    // // eslint-disable-next-line no-unused-vars
    // const [error, setError] = useState(null);

    // const handleToggle = () => {
    //   setModal((prevState) => !prevState);
    // };

    params: ParamsObject;
    permissions: VeRole['ANY'];
    org: OrgObject;
    project: ProjectObject;
    ref: RefObject;

    branch: RefObject;

    name: string;
    username: string;
    id: string;
    isPublic: boolean;
    orgId: string;
    projectId: string;
    sourceId: string;
    branchId: string;
    //custom = {};
    isButtonDisplayed = false;
    titleClass = 'workspace-title workspace-title-padding';
    icon = 'fa-solid fa-file-circle-question';

    static $inject = ['growl', 'UserService', 'RootScopeService'];

    constructor(
        private growl: angular.growl.IGrowlService,
        private userSvc: UserService,
        private rootScopeSvc: RootScopeService
    ) {}

    $onInit(): void {
        this.rootScopeSvc.veHideLeft(true);
        this.rootScopeSvc.veHideRight(true);
        this.username = this.userSvc.getUsername();

        if (this.ref) {
            this.branch = this.ref;
            this.name = this.branch.name ? this.branch.name : this.branch.id;

            this.id = this.branch.id;
            this.orgId = this.project.id;
            this.projectId = this.branch._projectId;
            this.sourceId = this.branch.parentRefId;
            this.permissions = this.project.permission.users[this.username].role;
            this.icon = this.ref.type == 'Tag' ? Icon('tag') : Icon('branch');
            //this.custom = this.branch.custom;
        } else if (this.project) {
            // const archived = (<Badge color="secondary" style={{ marginLeft: '10px' }}>Archived</Badge>);
            // // Verify if archived project, then place badge on information page next to name
            // name = (props.project.archived)
            //   ? (<div> {props.project.name} {' '} {archived} </div>)
            //   : (<div> {props.project.name} </div>);
            this.name = this.project.name;
            this.id = this.project.id;
            this.orgId = this.project.orgId;
            this.isPublic = this.project.public;
            this.permissions = this.project.permission.users[this.username].role;
            this.icon = Icon('project');
            //this.custom = this.project.custom;
        } else if (this.org) {
            this.name = this.org.name;
            this.id = this.org.id;
            this.isPublic = this.org.public;
            this.permissions = this.org.permission.users[this.username].role;
            this.icon = Icon('org');
            //this.custom = this.org.custom;
            // const archived = (<Badge color="secondary" style={{ marginLeft: '10px' }}>Archived</Badge>);
            // // Verify if archived org, then place badge on information page next to name
            // name = (props.org.archived)
            //   ? (<div> {props.org.name} {archived} </div>)
            //   : (<div> {props.org.name} </div>);
        }

        if (this.permissions === Role.ADMIN) {
            this.isButtonDisplayed = true;
            this.titleClass = 'workspace-title';
        }
    }

    // refreshBranch = (): void => {
    //     // Get branch data
    //     this.projectSvc.getRef(this.params.projectId, this.params.refId).then(
    //         (data) => {
    //             this.branch = data;
    //         },
    //         (reason) => {
    //             this.growl.error('Problem getting branch: ' + reason.message);
    //         }
    //     );
    // };

    // on mount and whenever a new branch is passed in
    // useEffect(() => {
    //   if (props.branch) {
    //     refreshBranch();
    //   }
    // }, [props.branch, props.match.params.branchid]);

    // // Initialize variables
    // let name;
    // let id;
    // let isPublic;
    // let orgId;
    // let projid;
    // let sourceid;
}

// Check admin/write permissions

// Populate relevant fields
// <React.Fragment>
//     {/* Modal for editing the information */}
//     <Modal isOpen={modal} toggle={handleToggle}>
//       <ModalBody>
//         {(props.project && !props.org)
//           ? (<EditPage project={props.project}
//                         orgId={props.project.org}
//                         toggle={handleToggle}
//                         refresh={props.refresh}/>)
//           : (<EditPage org={props.org}
//                         toggle={handleToggle}
//                         refresh={props.refresh}/>)
//         }
//       </ModalBody>
//     </Modal>

const InformationPageComponent: VeComponentOptions = {
    selector: 'informationPage',
    controller: InformationPageController,
    bindings: {
        org: '<?mmsOrg',
        project: '<?mmsProject',
        ref: '<?mmsRef',
        permissions: '<permissions',
    },
    template: `
  <div id="workspace">
  <div class="workspace-header header-box-depth">
    <h2 class="{{ $ctrl.titleClass}}"><i class="{{$ctrl.icon}}"></i> {{$ctrl.name}} <span ng-if="$ctrl.ref && $ctrl.ref.type == 'Tag'" class="badge badge-primary">Tag</span></h2>
    <div ng-if="$ctrl.isButtonDisplayed" class="workspace-header-button">
      <button class="btn btn-outline-secondary"
              outline color="secondary"
              ng-click=$ctrl.handleToggle>
        Edit
      </button>
    </div>
  </div>
  <div id="workspace-body">
    <div class="main-workspace extra-padding">
      <table class="table-width">
        <tbody>
          <tr ng-if="$ctrl.branch">
            <th style="display: flex, justifyContent: flex-start">
                  <button class="btn btn-sm btn-close"
                          aria-label="Filter" ng-click="$ctrl.history.goBack">
                    <span>
                      <i class="fas fa-arrow-left" style="fontSize: 15px"/>
                    </span>
                  </button>
                </th>
          </tr>
          <tr>
            <th>ID:</th>
            <td>{{ $ctrl.id }}</td>
          </tr>
          <tr ng-if="$ctrl.project || $ctrl.branch">
            <th>Org ID:</th>
            <td><span ui-sref="main.admin.org.home({ orgId: $ctrl.org.id })">{{ $ctrl.orgId }}</span></td>
          </tr>
          <tr ng-if="!$ctrl.branch">
            <th>Public:</th>
            <td>{{ $ctrl.isPublic ? 'True' : 'False' }}</td>
          </tr>
          <tr ng-if="$ctrl.branch">
            <th>Project ID:</th>
            <td>
              <span ui-sref="main.admin.project({ projectId: $ctrl.project.id })">
                {{ $ctrl.projectId }}
              </span>
            </td>
          </tr>
          <tr ng-if="$ctrl.branch">
            <th>Source Branch:</th>
            <td>
              <span ui-sref="main.admin.project.ref({ projectId: $ctrl.project.id, refId: $ctrl.sourceId })">
                {{ $ctrl.sourceId }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <custom-data data="$ctrl.custom"/>
    </div>
  </div>
</div>
    `,
};

veAdmin.component(InformationPageComponent.selector, InformationPageComponent);
