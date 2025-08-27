import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from "primevue/config";
import Aura from '@primeuix/themes/aura';
import { addPage, router, useCommonStore } from '@zhin.js/client';
import App from './App.vue';
const pinia = createPinia();
const wsUrl = `${window.location.protocol.replace(/^http?/, 'ws')}${window.location.host}/server`;
const ws = new WebSocket(wsUrl);
ws.onopen = () => {
    console.log('connection to ' + wsUrl);
};
ws.onmessage = message => {
    const payload = JSON.parse(message.data || '{}');
    const commonStore = useCommonStore(pinia);
    switch (payload.type) {
        case 'sync':
            return commonStore.syncData(payload.data);
        case 'add':
            return commonStore.addData(payload.data);
        case 'delete':
            return commonStore.deleteData(payload.data);
        default:
            return;
    }
};
ws.onclose = () => {
    console.log('connection closed');
};
const app = createApp(App);
app.use(pinia).use(router).use(PrimeVue,{
    theme: {
        preset: Aura
    }
});
app.config.globalProperties.$ws = ws;
router.addRoute({
    path: '/',
    name: 'Zhin',
    component: () => import('./pages/$.vue'),
});
addPage({
    parentName: 'Zhin',
    path: '/',
    name: 'Dashboard',
    component: () => import('./pages/dashboard.vue'),
});
app.mount('#app');
