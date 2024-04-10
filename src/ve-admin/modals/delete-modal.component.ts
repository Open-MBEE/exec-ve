// import { IComponentOptions } from 'angular';
// import { useApiClient } from '../context/ApiClientProvider';

// class DeleteController {
//   public org: any;
//   public id: any;
//   public projectOpt: any;
//   public error: any;
//   public title: string;
//   public orgOptions: any;
//   public name: any;

//   private orgService: any;
//   private projectService: any;
//   private branchService: any;
//   private elementService: any;

//   constructor() {
//     const { orgService, projectService, branchService, elementService } = useApiClient();
//     this.orgService = orgService;
//     this.projectService = projectService;
//     this.branchService = branchService;
//     this.elementService = elementService;
//     this.org = null;
//     this.id = null;
//     this.projectOpt = null;
//     this.error = null;
//     this.orgOptions = null;

//     if (this.project || this.projects) {
//       this.title = 'Project';
//     } else if (this.element) {
//       this.title = 'Element';
//     } else if (this.branch) {
//       this.title = 'Branch';
//     } else {
//       this.title = 'Organization';
//     }

//     if (this.orgs) {
//       this.orgOptions = this.orgs.map((o) => ({ id: o.id, name: o.name }));
//     }

//     if (this.org) {
//       this.name = this.org.name;
//     } else if (this.project) {
//       this.name = this.project.name;
//     } else if (this.element) {
//       this.name = `${this.element.name} (${this.element.id})`;
//     } else if (this.branch) {
//       this.name = this.branch.name ? this.branch.name : this.branch.id;
//     }
//   }

//   public async handleOrgChange() {
//     try {
//       const options = {
//         params: {
//           fields: 'id,name',
//         },
//       };

//       const [err, projects] = await this.projectService.get(this.org, options);

//       if (err) {
//         this.error = err;
//         this.projectOpt = [];
//       } else if (projects) {
//         const projectOptions = projects.map((project) => ({ id: project.id, name: project.name }));
//         this.projectOpt = projectOptions;
//       }
//     } catch (err) {
//       this.error = err.message;
//     }
//   }

//   public handleChange() {
//     this.id = this.id;
//   }

//   public async onSubmit() {
//     try {
//       let deleteRequest;

//       if (this.element) {
//         deleteRequest = () =>
//           this.elementService.delete(this.element.org, this.element.project, this.element.branch, [this.element.id]);
//       } else if (this.branch) {
//         deleteRequest = () => this.branchService.delete(this.branch.org, this.branch.project, [this.branch.id]);
//       } else if (this.projects) {
//         deleteRequest = () => this.projectService.delete(this.org, [this.id]);
//       } else if (this.project) {
//         deleteRequest = () => this.projectService.delete(this.project.org, [this.project.id]);
//       } else if (this.orgs) {
//         deleteRequest = () => this.orgService.delete([this.org]);
//       } else {
//         deleteRequest = () => this.orgService.delete([this.org.id]);
//       }

//       const [err, result] = await deleteRequest();

//       if (err) {
//         this.error = err;
//       } else if (result) {
//         if (this.element) {
//           this.closeSidePanel(null, [this.element.parent]);
//           this.toggle();
//         } else {
//           this.refresh();
//           this.toggle();
//         }
//       }
//     } catch (err) {
//       this.error = err.message;
//     }
//   }
// }

// export const DeleteComponent: IComponentOptions = {
//   bindings: {
//     orgs: '<',
//     org: '<',
//     projects: '<',
//     project: '<',
//     element: '<',
//     branch: '<',
//     refresh: '&',
//     toggle: '&',
//     closeSidePanel: '&',
//   },
//   controller: DeleteController,
//   template: `
//     <div id="workspace">
//       <div class="workspace-header">
//         <h2 class="workspace-title workspace-title-padding">Delete {{ $ctrl.title }}</h2>
//       </div>
//       <div class="extra-padding">
//         <div ng-show="!$ctrl.error"></div>
//         <div ng-show="$ctrl.error" class="alert alert-danger">{{$ctrl.error}}</div>
//         <form>
//           <div ng-show="!$ctrl.orgs"></div>
//           <div ng-show="$ctrl.orgs">
//             <div class="form-group">
//               <label for="org">Organization ID</label>
//               <select ng-model="$ctrl.org" ng-change="$ctrl.handleOrgChange()" class="form-control" id="org">
//                 <option value="">Choose one...</option>
//                 <option ng-repeat="option in $ctrl.orgOptions" value="{{option.id}}">{{option.name}}</option>
//               </select>
//             </div>
//           </div>
//           <div ng-show="!$ctrl.projects"></div>
//           <div ng-show="$ctrl.projects">
//             <div class="form-group">
//               <label for="id">Project ID</label>
//               <select ng-model="$ctrl.id" ng-change="$ctrl.handleChange()" class="form-control" id="id">
//                 <option value="">Choose one...</option>
//                 <option ng-repeat="option in $ctrl.projectOpt" value="{{option.id}}">{{option.name}}</option>
//               </select>
//             </div>
//           </div>
//           <div ng-show="$ctrl.org || $ctrl.project || $ctrl.branch || $ctrl.element">
//             <div class="form-group">
//               <label for="id">Do you want to delete {{ $ctrl.name }}?</label>
//             </div>
//           </div>
//           <button type="button" ng-click="$ctrl.onSubmit()" class="btn btn-danger">Delete</button>
//           <button type="button" ng-click="$ctrl.toggle()" class="btn btn-outline-secondary">Cancel</button>
//         </form>
//       </div>
//     </div>
//   `,
// };
