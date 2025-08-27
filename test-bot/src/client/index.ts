import {addPage} from '@zhin.js/client'
addPage({
    path:'/test',
    name:"Test",
    component:() => import('./test.vue')
})