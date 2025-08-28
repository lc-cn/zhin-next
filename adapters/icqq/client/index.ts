import { addPage } from '@zhin.js/client'

// 注册ICQQ适配器管理页面
addPage({
  parentName: 'Zhin',
  path: '/contexts/icqq',
  name: 'ICQQ管理',
  icon: 'pi pi-comment',
  component: () => import('./ICQQManagement.vue')
})

console.log('📱 ICQQ适配器客户端页面已注册')
