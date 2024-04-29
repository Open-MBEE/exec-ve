import { ElementObject, ParamsObject } from "@ve-types/mms";
import { ElementService } from "@ve-utils/mms-api-client";

export class ElementSubtree implements angular.IComponentController {

    // const { elementService } = useApiClient();
    // const [isOpen, setIsOpen] = useState(!!(props.id === 'model' || props.expand));
    // const [data, setData] = useState(props.data);
    // const [children, setChildren] = useState(null);
    // // eslint-disable-next-line no-unused-vars
    // const [error, setError] = useState(null);
  
    // const prevData = usePrevious(data);
    // const prevExpand = usePrevious(props.expand);
    // const prevCollapse = usePrevious(props.collapse);
  
    // const orgID = props.project.org;
    // const projID = props.project.id;
    // const { branchID } = props;

    //Bindings
    id: string
    archived: boolean
    params: ParamsObject
    unsetCheckbox?: () => void
    clickHandler?: (elementId: string) => void
    setRefreshFunctions: (id: string, refreshFn: () => void) => void

    //Locals
    isOpen: boolean
    element: ElementObject
    setIsOpe

    static $inject = ['growl', 'ElementService']

    constructor(private growl: angular.growl.IGrowlService, private elementSvc: ElementService) {}

    /**
     * @description Toggle the element to display its children.
     */
    const toggleCollapse = () => {
      if (this.unsetCheckbox) {
        this.unsetCheckbox();
      }
      setIsOpen((currentState) => !currentState);
    };
  
    /**
     * @description When an element is clicked, parses the ID and call the passed in
     * click handler function.
     */
    handleClick = () => {
      const elementId = this.id.replace('tree-', '');
      this.clickHandler(elementId);
    };
  
    /**
     * @description When an element is deleted, created, or updates the parent
     * the elements will be updated.
     */
    refresh = () => {
  
      // Get element data
      this.elementSvc.getElement({ elementId: this.id, projectId: this.params.projectId, refId: this.params.refId }).then((element) => {
        this.element = element;
      }, (reason) => {
        this.growl.error(reason.message);
      })
    };
  
    $onInit(): void {
      // Verify setRefreshFunction is not null
      if (this.setRefreshFunctions) {
        // Provide refresh function to top parent component
        this.setRefreshFunctions(this.id, this.refresh);
      }
  
      const { contains } = data;
      const parent = data.id;
      // Verify element does not have children
      if (!contains || contains.length === 0) {
        // Skip ajax call for children
        return;
      }
  
      // Get child elements
      const options = {
        params: {
          parent,
          includeArchived: true,
          fields: 'id,name,contains,archived,type',
          sort: 'name',
        },
      };
  
      const [err2, elements] = await elementService.get(orgID, projID, branchID, options);
  
      if (err2) {
        setError(err2);
      } else if (elements) {
        // Sort so that the __mbee__ element is first
        const list = [];
        let __mbee__;
        elements.forEach((element) => {
          if (element.id === '__mbee__') __mbee__ = element;
          else list.push(element);
        });
        if (__mbee__) list.unshift(__mbee__);
        setChildren(list);
      }
    };

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        
    }
  
    // on update of props or data
    useEffect = () => {
  
        // Initialize variables
        let elementLink;
        const initColor = (this.archived) ? '#c0c0c0' : '#333';
        let elementIcon = `<i class="fa-solid fa-cube" style={ color: ${initColor} }/>`
        
        let expandIcon = 'fa-caret-right transparent';
        const subtree = [];
    
        // If the element contains other elements, handle the subtree
        if (Array.isArray(data.contains) && data.contains.length >= 1) {
            // Icon should be caret to show subtree is collapsible
            expandIcon = (this.isOpen) ? 'fa-caret-down' : 'fa-caret-right';
        
            // Create Subtrees
            if (children !== null) {
                for (let i = 0; i < children.length; i++) {
                subtree.push(
                    <ElementSubtree key={`tree-${children[i].id}`}
                                    id={`${children[i].id}`}
                                    data={children[i]}
                                    project={props.project}
                                    branchID={props.branchID}
                                    parent={true}
                                    archived={props.archived}
                                    displayIds={props.displayIds}
                                    expand={props.expand}
                                    collapse={props.collapse}
                                    setRefreshFunctions={props.setRefreshFunctions}
                                    parentRefresh={refresh}
                                    linkElements={props.linkElements}
                                    clickHandler={props.clickHandler}
                                    unsetCheckbox={props.unsetCheckbox}
                                    isOpen={isOpen}
                                    url={props.url}/>,
                );
                }
            }
        }
    }
  
    // Build the rendered element item
    let element = '';
    // Verify data available
    if (data !== null) {
      // Verify if archived
      if (!data.archived) {
        // Element should be rendered as the ID initially
        element = (
          <span className={'element-id'}>
           {data.id}
        </span>
        );
        // If the name is not blank, render the name
        if (data.name !== '' && props.displayIds) {
          element = (
            <span>
            {data.name}
              <span className={'element-id'}>({data.id})</span>
          </span>
          );
        }
        // If the name is not blank and has displayId to false
        else if (data.name !== '' && !props.displayIds) {
          element = (
            <span>
            {data.name}
            </span>
          );
        }
      }
      // If the element is archived and archived toggle is true
      else if (props.archived && data.archived) {
        // Element should be rendered as the ID initially
        element = (
          <span className='element-id'>
           {data.id}
          </span>
        );
        // If the name is not blank, render the name
        if (data.name !== '' && props.displayIds) {
          element = (
            <span className='grayed-out'>
              {data.name}
              <span className='element-id'>({data.id})</span>
            </span>
          );
        }
        // If the name is not blank and has displayIds to false
        else if (data.name !== '' && !props.displayIds) {
          element = (
            <span className='grayed-out'>
            {data.name}
            </span>
          );
        }
      }
    }
  
    const iconMappings = {
      Package: {
        icon: (isOpen) ? 'folder-open' : 'folder',
        color: 'lightblue',
      },
      package: {
        icon: (isOpen) ? 'folder-open' : 'folder',
        color: 'lightblue',
      },
      'uml:Package': {
        icon: (isOpen) ? 'folder-open' : 'folder',
        color: 'lightblue',
      },
      Diagram: {
        icon: 'sitemap',
        color: 'lightgreen',
      },
      diagram: {
        icon: 'sitemap',
        color: 'lightgreen',
      },
      association: {
        icon: 'arrows-alt-h',
        color: '#333333',
      },
      Association: {
        icon: 'arrows-alt-h',
        color: '#333333',
      },
      relationship: {
        icon: 'arrows-alt-h',
        color: '#333333',
      },
      Relationship: {
        icon: 'arrows-alt-h',
        color: '#333333',
      },
      Edge: {
        icon: 'arrows-alt-h',
        color: '#333333',
      },
      edge: {
        icon: 'arrows-alt-h',
        color: '#333333',
      },
      'uml:Diagram': {
        icon: 'sitemap',
        color: 'lightgreen',
      },
      'uml:Association': {
        icon: 'arrows-alt-h',
        color: '#333333',
      },
      'uml:Slot': {
        icon: 'circle',
        color: 'MediumPurple',
      },
      'uml:Property': {
        icon: 'circle',
        color: 'Gold',
      },
      Document: {
        icon: 'file-alt',
        color: '#465faf',
      },
      View: {
        icon: 'align-center',
        color: '#b0f2c8',
      },
    };
  
    // Verify data available and type in mapping
    if (data !== null
      && iconMappings.hasOwnProperty(data.type)) {
      // Set the icon to a new icon and color
      const { icon } = iconMappings[data.type];
      const color = (data.archived) ? '#c0c0c0' : iconMappings[data.type].color;
      elementIcon = (
        <i className={`fas fa-${icon}`}
           style={{ color }}/>
      );
    }
  
    // Verify if it is linked element
    if (props.linkElements) {
      elementLink = (
        <Link to={`#${props.id}`}
              onClick={handleClick}
              className='element-link'>
            <span className='element-name'>
              {elementIcon}
              {element}
            </span>
        </Link>);
    } else {
      elementLink = (
        <span onClick={handleClick}
             className='element-link'>
          <span className='element-name'>
            {elementIcon}
            {element}
          </span>
        </span>);
    }
  
    // Verify data is not archived and
    // toggle archived is false
    if (data.archived && !props.archived) {
      return null;
    }
  
    return (
        <div id={`tree-${props.id}`}
             className={(props.parent) ? 'element-tree' : 'element-tree element-tree-root'}>
          <i className={`fas ${expandIcon}`}
             onClick={toggleCollapse}>
          </i>
          {elementLink}
          {(isOpen) ? (<div>{subtree}</div>) : ''}
        </div>);
  }