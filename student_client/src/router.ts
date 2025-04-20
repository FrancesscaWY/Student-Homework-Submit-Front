import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'
import Login from './views/Login.vue'
import Dashboard from "./views/Dashboard.vue";
import SubmitAssignment from "./views/SubmitAssignment.vue";
import HistoryAssignment from "./views/HistoryAssignment.vue";
const routes: Array<RouteRecordRaw> = [
    {path: '/', name:'Login',component: Login},
    {
        path: '/dashboard',
        name:'Dashboard',
        component:Dashboard,
        children:[
            {path:'',redirect:'/dashboard/submit'},
            {
                path:'submit',
                name: 'SubmitAssignment',
                component: SubmitAssignment
            },
            {
                path:'history',
                name:'HistoryAssignment',
                component: HistoryAssignment
            }
        ]

    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router