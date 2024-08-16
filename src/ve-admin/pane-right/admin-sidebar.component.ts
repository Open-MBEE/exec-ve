import { veAdmin } from '@ve-admin';

import { VeComponentOptions } from '@ve-types/angular';

const AdminSidebarComponent: VeComponentOptions = {
    selector: 'adminSidebar',
    template: `
    <div id="container">
    <sidebar title="Admin Console">
        <sidebar-link id="user-list"
                    title="User Management"
                    icon="fa-solid fa-users"
                    router-link="main.admin.users"></sidebar-link>
        <sidebar-link id="organization-list"
                    title="Home"
                    icon="fa-solid fa-warehouse"
                    router-link="main.admin"></sidebar-link>
        <sidebar-link id="projects-list"
                    title="Projects"
                    icon="fa-solid fa-boxes"
                    router-link="main.admin.projects"></sidebar-link>    
    </sidebar>
</div>
    `,
};

veAdmin.component(AdminSidebarComponent.selector, AdminSidebarComponent);
