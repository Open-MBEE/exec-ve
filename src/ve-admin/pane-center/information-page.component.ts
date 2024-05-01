import { OrgObject, ParamsObject, ProjectObject, RefObject, RoleString } from "@ve-types/mms";
import { ProjectService } from "@ve-utils/mms-api-client";

export class InformationPageController implements angular.IComponentController {
    // const { branchService } = useApiClient();
    // const [data, setData] = useState(null);
    // const [modal, setModal] = useState(false);
    // // eslint-disable-next-line no-unused-vars
    // const [error, setError] = useState(null);
  
    // const handleToggle = () => {
    //   setModal((prevState) => !prevState);
    // };

    params: ParamsObject
    permissions: RoleString
    org: OrgObject
    project: ProjectObject
    ref: RefObject

    refData: RefObject

    name: string;
    id: string;
    visibility: string;
    orgid: string;
    projid: string;
    sourceid: string;
    branchId: string
    branchName: string;
    custom = {};
    isButtonDisplayed = false;
    titleClass = 'workspace-title workspace-title-padding';
    
    static $inject = ['ProjectService']

    constructor(private growl: angular.growl.IGrowlService, private projectSvc: ProjectService) {}

    $onInit(): void {
        
        if (this.permissions === 'ADMIN') {
            this.isButtonDisplayed = true;
            this.titleClass = 'workspace-title';
        }
        if (this.org) {
            this.id = this.org.id;
            this.custom = this.org.custom;
            // const archived = (<Badge color='secondary' style={{ marginLeft: '10px' }}>Archived</Badge>);
            // // Verify if archived org, then place badge on information page next to name
            // name = (props.org.archived)
            //   ? (<div> {props.org.name} {archived} </div>)
            //   : (<div> {props.org.name} </div>);
          } else if (this.project) {
            // const archived = (<Badge color='secondary' style={{ marginLeft: '10px' }}>Archived</Badge>);
            // // Verify if archived project, then place badge on information page next to name
            // name = (props.project.archived)
            //   ? (<div> {props.project.name} {' '} {archived} </div>)
            //   : (<div> {props.project.name} </div>);
            this.id = this.project.id;
            this.orgid = this.project.orgId;
            visibility = props.project.visibility;
            custom = props.project.custom;
          } else if (data) {
            const branch = data;
            let tag;
            if (branch.tag) {
              tag = (<Badge color='primary'>Tag</Badge>);
            }
            name = (branch.name)
              ? (<div> {branch.name} {tag} </div>)
              : (<div> {branch.id} {tag} </div>);
            branchName = branch.name;
            id = branch.id;
            orgid = branch.org;
            projid = branch.project;
            sourceid = branch.source;
            custom = branch.custom;
          }
    }

    refreshBranch = (): void => {
      // Get branch data
      this.projectSvc.getRef(this.params.projectId, this.params.refId).then((data) => {
        this.refData = data;
      }, ((reason) => {
        this.growl.error('Problem getting branch: ' + reason.message)
      }))
    };
  
    // on mount and whenever a new branch is passed in
    useEffect(() => {
      if (props.branch) {
        refreshBranch();
      }
    }, [props.branch, props.match.params.branchid]);
  
    // Initialize variables
    let name;
    let id;
    let visibility;
    let orgid;
    let projid;
    let sourceid;
    let branchName;
    let 
  
    // Check admin/write permissions
    
  
    // Populate relevant fields
    
  
    return (
      <React.Fragment>
        {/* Modal for editing the information */}
        <Modal isOpen={modal} toggle={handleToggle}>
          <ModalBody>
            {(props.project && !props.org)
              ? (<EditPage project={props.project}
                           orgid={props.project.org}
                           toggle={handleToggle}
                           refresh={props.refresh}/>)
              : (<EditPage org={props.org}
                           toggle={handleToggle}
                           refresh={props.refresh}/>)
            }
          </ModalBody>
        </Modal>
        <div id='workspace'>
          <div className='workspace-header header-box-depth'>
            <h2 className={titleClass}>{name}</h2>
            { /* Verify user is an admin */}
            {(!isButtonDisplayed)
              ? ''
              // Display edit button
              : (
                <div className='workspace-header-button'>
                  <Button className='btn'
                          outline color="secondary"
                          onClick={handleToggle}>
                    Edit
                  </Button>
                </div>
              )
            }
          </div>
          <div id='workspace-body'>
            <div className='main-workspace extra-padding'>
              <table className='table-width'>
                <tbody>
                  {(!props.branch)
                    ? <tr/>
                    : (<tr>
                        <th style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <Button close
                                 aria-label='Filter'
                                 size='sm' onClick={props.history.goBack}>
                            <span>
                              <i className='fas fa-arrow-left' style={{ fontSize: '15px' }}/>
                            </span>
                          </Button>
                        </th>
                      </tr>)
  
                  }
                <tr>
                  <th>ID:</th>
                  <td>{id}</td>
                </tr>
                {(props.project || props.branch)
                  ? (<tr>
                      <th>Org ID:</th>
                      <td><Link to={`/orgs/${orgid}`}>{orgid}</Link></td>
                     </tr>)
                  : <tr/>
                }
                {(!props.project)
                  ? <tr/>
                  : (<React.Fragment>
                      <tr>
                        <th>Visibility:</th>
                        <td>{visibility}</td>
                      </tr>
                    </React.Fragment>
                  )
                }
                {(!props.branch)
                  ? <tr/>
                  : (<React.Fragment>
                      <tr>
                        <th>Project ID:</th>
                        <td>
                          <Link to={`/orgs/${orgid}/projects/${projid}/branches/master/elements`}>
                            {projid}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <th>Name:</th>
                        <td>{branchName}</td>
                      </tr>
                      <tr>
                        <th>Source Branch:</th>
                        <td>
                          <Link to={`/orgs/${orgid}/projects/${projid}/branches/${sourceid}`}>
                            {sourceid}
                          </Link>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                }
                </tbody>
              </table>
              <CustomData data={custom}/>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
  
  export default InformationPage;