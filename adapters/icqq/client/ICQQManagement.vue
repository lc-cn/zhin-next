<template>
  <div class="icqq-management">
    <!-- 页面标题 -->
    <div class="page-header mb-4">
      <div class="flex align-items-center">
        <i class="pi pi-comment text-3xl text-primary mr-3"></i>
        <div>
          <h1 class="page-title">ICQQ 适配器管理</h1>
          <p class="page-subtitle">管理和监控QQ平台的机器人实例</p>
        </div>
      </div>
      <div class="page-actions">
        <Button 
          icon="pi pi-refresh" 
          label="刷新" 
          @click="refreshData" 
          :loading="refreshing"
        />
        <Button 
          icon="pi pi-plus" 
          label="添加QQ机器人" 
          severity="success"
          @click="showAddBot = true"
        />
      </div>
    </div>

    <!-- ICQQ专用统计 -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="stats-card stats-qq-bots">
          <div class="stats-icon">
            <i class="pi pi-android text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ icqqBots?.length || 0 }}</div>
            <div class="stats-label">QQ机器人</div>
            <div class="stats-sub">已配置的机器人数量</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="stats-card stats-online">
          <div class="stats-icon">
            <i class="pi pi-wifi text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ onlineBots }}</div>
            <div class="stats-label">在线机器人</div>
            <div class="stats-sub">正在运行中</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="stats-card stats-groups">
          <div class="stats-icon">
            <i class="pi pi-users text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ totalGroups }}</div>
            <div class="stats-label">群聊</div>
            <div class="stats-sub">已加入的群聊数</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="stats-card stats-friends">
          <div class="stats-icon">
            <i class="pi pi-user text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ totalFriends }}</div>
            <div class="stats-label">好友</div>
            <div class="stats-sub">好友列表数量</div>
          </div>
        </div>
      </div>
    </div>

    <!-- QQ机器人列表 -->
    <Card class="bots-list-card">
      <template #title>
        <div class="card-title">
          <i class="pi pi-list mr-2"></i>
          QQ机器人列表
        </div>
      </template>
      
      <template #content>
        <div class="bots-list">
          <div 
            v-for="bot in icqqBots" 
            :key="bot.name"
            class="bot-item"
          >
            <div class="bot-main-info">
              <div class="bot-header">
                <div class="bot-avatar">
                  <i class="pi pi-user"></i>
                </div>
                <div class="bot-basic-info">
                  <h3 class="bot-name">QQ: {{ bot.name }}</h3>
                  <p class="bot-description">{{ getLoginMode(bot) }}</p>
                  <div class="bot-meta">
                    <span class="bot-platform">腾讯QQ平台</span>
                    <span class="bot-uptime">运行时间: {{ formatUptime(bot.uptime) }}</span>
                  </div>
                </div>
                <div class="bot-status">
                  <Tag 
                    :value="bot.connected ? '在线' : '离线'" 
                    :severity="bot.connected ? 'success' : 'danger'"
                    :icon="bot.connected ? 'pi pi-check' : 'pi pi-times'"
                  />
                </div>
              </div>
              
              <div v-if="bot.connected" class="bot-stats">
                <div class="stat-item">
                  <i class="pi pi-users"></i>
                  <span>{{ bot.groupCount || 0 }} 个群聊</span>
                </div>
                <div class="stat-item">
                  <i class="pi pi-user"></i>
                  <span>{{ bot.friendCount || 0 }} 个好友</span>
                </div>
                <div class="stat-item">
                  <i class="pi pi-comments"></i>
                  <span>消息总数: {{ bot.totalMessages || 0 }}</span>
                </div>
                <div class="stat-item">
                  <i class="pi pi-shield"></i>
                  <span>{{ getSecurityLevel(bot) }}</span>
                </div>
              </div>
            </div>
            
            <div class="bot-actions">
              <Button 
                v-if="bot.connected"
                icon="pi pi-stop" 
                severity="danger" 
                text 
                rounded
                @click="disconnectBot(bot.name)"
                :loading="disconnectingBots.includes(bot.name)"
                v-tooltip="'断开连接'"
              />
              <Button 
                v-else
                icon="pi pi-play" 
                severity="success" 
                text 
                rounded
                @click="connectBot(bot.name)"
                :loading="connectingBots.includes(bot.name)"
                v-tooltip="'连接QQ'"
              />
              <Button 
                icon="pi pi-cog" 
                severity="secondary" 
                text 
                rounded
                @click="configureBot(bot)"
                v-tooltip="'配置机器人'"
              />
              <Button 
                icon="pi pi-info-circle" 
                severity="help" 
                text 
                rounded
                @click="showBotDetails(bot)"
                v-tooltip="'查看详情'"
              />
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="loadingBots" class="loading-state">
            <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <h3 class="text-primary">加载ICQQ机器人数据中...</h3>
          </div>
          
          <!-- 空状态（适配器未启用）已由onMounted直接调用fetchICQQBots处理 -->
          
          <!-- 无机器人状态 -->
          <div v-else-if="!icqqBots?.length && !loadingBots" class="empty-state">
            <i class="pi pi-comment text-6xl text-color-secondary mb-4"></i>
            <h3 class="text-color-secondary mb-2">暂无QQ机器人</h3>
            <p class="text-color-secondary mb-4">还没有启动任何QQ机器人实例</p>
            <Button 
              icon="pi pi-refresh" 
              label="刷新数据" 
              severity="info"
              @click="fetchICQQBots"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- 添加机器人对话框 -->
    <Dialog 
      v-model:visible="showAddBot" 
      header="添加QQ机器人"
      modal 
      :style="{ width: '40vw' }"
      :breakpoints="{ '960px': '60vw', '641px': '90vw' }"
    >
      <div class="add-bot-content">
        <div class="mb-4">
          <label class="block text-900 font-medium mb-2">QQ号码</label>
          <InputText 
            v-model="newBotQQ" 
            placeholder="输入QQ号码"
            class="w-full"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-900 font-medium mb-2">登录方式</label>
          <Dropdown 
            v-model="newBotLoginMode" 
            :options="loginModes" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="选择登录方式"
            class="w-full"
          />
        </div>
        
        <div v-if="newBotLoginMode === 'password'" class="mb-4">
          <label class="block text-900 font-medium mb-2">密码</label>
          <Password 
            v-model="newBotPassword" 
            placeholder="输入QQ密码"
            class="w-full"
            toggleMask
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-900 font-medium mb-2">设备锁</label>
          <Dropdown 
            v-model="newBotDevice" 
            :options="deviceOptions" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="选择设备类型"
            class="w-full"
          />
        </div>
        
        <div class="security-notice">
          <i class="pi pi-info-circle mr-2"></i>
          <span class="text-sm text-color-secondary">
            建议使用扫码登录方式，更加安全可靠
          </span>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="取消" 
          text 
          @click="showAddBot = false"
        />
        <Button 
          label="添加" 
          @click="addBot"
          :disabled="!newBotQQ || !newBotLoginMode"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'

// 全局类型声明
declare global {
  interface Window {
    ZhinDataAPI?: {
      updateAllData: () => Promise<void>
      getSystemStatus: () => Promise<any>
      getPlugins: () => Promise<any>
      getAdapters: () => Promise<any>
      reloadPlugin: (pluginName: string) => Promise<any>
      sendMessage: (payload: any) => Promise<any>
    }
    ZhinStore?: {
      getCommonStore: () => any
    }
  }
}

// 使用全局暴露的Store访问器
const commonStore = window.ZhinStore?.getCommonStore()
const refreshing = ref(false)
const showAddBot = ref(false)
const newBotQQ = ref('')
const newBotLoginMode = ref('')
const newBotPassword = ref('')
const newBotDevice = ref('')
const connectingBots = ref<string[]>([])
const disconnectingBots = ref<string[]>([])


// 机器人数据类型
interface ICQQBot {
  name: string
  connected: boolean
  groupCount: number
  friendCount: number
  receiveCount: number
  sendCount: number
  totalMessages?: number
  loginMode?: string
  uptime?: number
}

// ICQQ机器人数据
const icqqBots = ref<ICQQBot[]>([])
const loadingBots = ref(false)

  // 获取ICQQ机器人数据
  const fetchICQQBots = async () => {
    console.log('📞 开始请求ICQQ机器人数据...')
    loadingBots.value = true
    try {
      console.log('🌐 发送请求到: /api/icqq/bots')
      const response = await fetch('/api/icqq/bots')
      console.log('📡 响应状态:', response.status, response.statusText)
      
      if (response.ok) {
        const bots = await response.json()
        console.log('📦 收到机器人数据:', bots)
        
        icqqBots.value = bots.map((bot: any) => ({
          ...bot,
          // 添加一些额外的计算字段
          totalMessages: (bot.receiveCount || 0) + (bot.sendCount || 0),
          uptime: Date.now() - 3600000 // 模拟1小时运行时间
        }))
        console.log('✅ 机器人数据处理完成:', icqqBots.value.length, '个机器人')
      } else {
        console.error('❌ 获取ICQQ机器人数据失败 - 状态码:', response.status)
        console.error('❌ 错误详情:', response.statusText)
        icqqBots.value = []
      }
    } catch (error) {
      console.error('❌ 网络请求失败:', error)
      icqqBots.value = []
    } finally {
      loadingBots.value = false
    }
  }
onMounted(()=>{

  fetchICQQBots()
})

// 登录方式选项
const loginModes = [
  { label: '扫码登录（推荐）', value: 'qrcode' },
  { label: '密码登录', value: 'password' },
  { label: '短信验证', value: 'sms' }
]

// 设备类型选项
const deviceOptions = [
  { label: 'Android手机', value: 'android' },
  { label: 'iPad', value: 'ipad' },
  { label: '手表', value: 'watch' }
]

// 统计数据
const onlineBots = computed(() => {
  return icqqBots.value.filter(bot => bot.connected).length
})

const totalGroups = computed(() => {
  return icqqBots.value.reduce((total, bot) => total + (bot.groupCount || 0), 0)
})

const totalFriends = computed(() => {
  return icqqBots.value.reduce((total, bot) => total + (bot.friendCount || 0), 0)
})

const totalMessages = computed(() => {
  return icqqBots.value.reduce((total, bot) => total + (bot.totalMessages || 0), 0)
})

// 辅助函数
const getLoginMode = (bot: any) => {
  if (bot.loginMode === 'qrcode') return '扫码登录模式'
  if (bot.loginMode === 'password') return '密码登录模式'
  if (bot.loginMode === 'sms') return '短信验证模式'
  return '未知登录模式'
}

const getSecurityLevel = (bot: any) => {
  const levels = ['低', '中', '高']
  const level = Math.floor(Math.random() * 3)
  return `安全等级: ${levels[level]}`
}

const formatUptime = (seconds?: number) => {
  if (!seconds) return '0秒'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟`
  } else {
    return `${Math.floor(seconds)}秒`
  }
}

// 操作函数
const refreshData = async () => {
  refreshing.value = true
  try {
    // 使用全局暴露的API方法
    if (window.ZhinDataAPI?.updateAllData) {
      await window.ZhinDataAPI.updateAllData()
      // 刷新完适配器数据后，也刷新机器人数据
      await fetchICQQBots()
      console.log('✅ ICQQ数据刷新完成')
    } else {
      throw new Error('全局API未就绪')
    }
  } catch (error) {
    console.error('❌ ICQQ数据刷新失败:', error)
  } finally {
    refreshing.value = false
  }
}

const connectBot = async (botName: string) => {
  connectingBots.value.push(botName)
  
  try {
    console.log('连接QQ机器人:', botName)
    await new Promise(resolve => setTimeout(resolve, 2000))
    // 这里应该调用实际的连接API
  } finally {
    connectingBots.value = connectingBots.value.filter(name => name !== botName)
  }
}

const disconnectBot = async (botName: string) => {
  disconnectingBots.value.push(botName)
  
  try {
    console.log('断开QQ机器人:', botName)
    await new Promise(resolve => setTimeout(resolve, 1500))
    // 这里应该调用实际的断开API
  } finally {
    disconnectingBots.value = disconnectingBots.value.filter(name => name !== botName)
  }
}

const configureBot = (bot: any) => {
  console.log('配置QQ机器人:', bot.name)
  // 这里可以打开配置对话框
}

const showBotDetails = (bot: any) => {
  console.log('查看QQ机器人详情:', bot.name)
  // 这里可以打开详情对话框
}

const addBot = async () => {
  if (!newBotQQ.value || !newBotLoginMode.value) return
  
  try {
    console.log('添加QQ机器人:', {
      qq: newBotQQ.value,
      mode: newBotLoginMode.value,
      device: newBotDevice.value
    })
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showAddBot.value = false
    newBotQQ.value = ''
    newBotLoginMode.value = ''
    newBotPassword.value = ''
    newBotDevice.value = ''
    
    refreshData()
  } catch (error) {
    console.error('添加QQ机器人失败:', error)
  }
}
</script>

<style scoped>
.icqq-management {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem;
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
}

.page-subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.page-actions {
  display: flex;
  gap: 0.75rem;
}

/* 统计卡片 */
.stats-card {
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stats-qq-bots .stats-icon { background: var(--blue-500); }
.stats-online .stats-icon { background: var(--green-500); }
.stats-groups .stats-icon { background: var(--purple-500); }
.stats-friends .stats-icon { background: var(--orange-500); }

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stats-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.stats-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0;
}

.stats-sub {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* 机器人列表 */
.bots-list-card :deep(.p-card-body) {
  padding: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.bots-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bot-item {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: var(--surface-50);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
  border-left: 4px solid var(--blue-500);
}

.bot-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.bot-main-info {
  flex: 1;
}

.bot-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.bot-avatar {
  width: 48px;
  height: 48px;
  background: var(--blue-500);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.bot-basic-info {
  flex: 1;
}

.bot-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.bot-description {
  margin: 0 0 0.5rem 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.bot-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.bot-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.stat-item i {
  color: var(--primary-color);
}

.bot-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem;
}

/* 对话框样式 */
.add-bot-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.security-notice {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: var(--blue-50);
  border-radius: 8px;
  border: 1px solid var(--blue-200);
}

@media (max-width: 768px) {
  .icqq-management {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .bot-header {
    flex-wrap: wrap;
  }
  
  .bot-stats {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .bot-actions {
    margin-top: 1rem;
  }
}
</style>
