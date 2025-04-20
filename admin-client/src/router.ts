import {createRouter, createWebHistory,RouteRecordRaw} from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import PublishAssignment from "./views/PublishAssignment.vue";
import AssignmentList from "./views/AssignmentList.vue";
import ManageStudents from "./views/ManageStudents.vue";

const routes: Array<RouteRecordRaw> = [
    {path:'/',redirect:'/dashboard/manage-students'},
    {
        path:'/dashboard',
        name:'Dashboard',
        component:Dashboard,
        children:[
            {path:'manage-students',component:ManageStudents},
            // {path:'add-student',component:AddStudent},
            // {path:'reset-students',component:ResetStudents},
            {path:'publish-assignment',component:PublishAssignment},
            {
                path:'assignment/:status',
                name:'AssignmentList',
                component:AssignmentList,
                props:true
            }
        ]
    }
]

const router = createRouter({
    history:createWebHistory(),
    routes
})
export default router