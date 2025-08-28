<template>
  <div class="adapters-page">
    <!-- 页面标题 -->
    <div class="page-header mb-4">
      <div class="flex align-items-center">
        <i class="pi pi-link text-3xl text-primary mr-3"></i>
        <div>
          <h1 class="page-title">适配器管理</h1>
          <p class="page-subtitle">管理和监控各平台机器人适配器</p>
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
          label="添加适配器" 
          severity="success"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="stats-card stats-total">
          <div class="stats-icon">
            <i class="pi pi-sitemap text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ adaptersData?.length || 0 }}</div>
            <div class="stats-label">适配器总数</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="stats-card stats-active">
          <div class="stats-icon">
            <i class="pi pi-check-circle text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ activeAdaptersCount }}</div>
            <div class="stats-label">活跃适配器</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="stats-card stats-bots">
          <div class="stats-icon">
            <i class="pi pi-android text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ totalBots }}</div>
            <div class="stats-label">机器人总数</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="stats-card stats-connected">
          <div class="stats-icon">
            <i class="pi pi-wifi text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ connectedBots }}</div>
            <div class="stats-label">在线机器人</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 适配器列表 -->
    <div class="adapters-list">
      <div 
        v-for="adapter in adaptersData" 
        :key="adapter.name"
        class="adapter-card"
      >
        <div class="adapter-header">
          <div class="adapter-info">
            <div class="adapter-icon" :class="`adapter-icon-${adapter.platform}`">
              <i :class="getPlatformIcon(adapter.platform)"></i>
            </div>
            <div class="adapter-details">
              <h3 class="adapter-name">{{ adapter.name }}</h3>
              <p class="adapter-description">{{ adapter.description }}</p>
              <div class="adapter-meta">
                <span class="platform-tag">{{ getPlatformName(adapter.platform) }}</span>
                <span class="uptime-info">运行时间: {{ formatUptime(adapter.uptime) }}</span>
              </div>
            </div>
          </div>
          <div class="adapter-status-section">
            <Tag 
              :value="adapter.status" 
              :severity="getStatusSeverity(adapter.status)"
              :icon="getStatusIcon(adapter.status)"
            />
          </div>
        </div>
        
        <div class="adapter-bots">
          <h4 class="bots-title">
            <i class="pi pi-users mr-2"></i>
            机器人实例 ({{ adapter.bots?.length || 0 }})
          </h4>
          
          <div v-if="adapter.bots?.length" class="bots-grid">
            <div 
              v-for="bot in adapter.bots" 
              :key="bot.name"
              class="bot-item"
              :class="{ 'bot-connected': bot.connected, 'bot-disconnected': !bot.connected }"
            >
              <div class="bot-avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="bot-info">
                <div class="bot-name">{{ bot.name }}</div>
                <div class="bot-status-row">
                  <Tag 
                    :value="bot.connected ? '在线' : '离线'" 
                    :severity="bot.connected ? 'success' : 'danger'"
                    size="small"
                  />
                  <span class="bot-uptime">{{ formatUptime(bot.uptime) }}</span>
                </div>
              </div>
              <div class="bot-actions">
                <Button 
                  :icon="bot.connected ? 'pi pi-stop' : 'pi pi-play'"
                  :severity="bot.connected ? 'danger' : 'success'"
                  text
                  rounded
                  size="small"
                  @click="toggleBot(adapter.name, bot.name, bot.connected)"
                  :tooltip="bot.connected ? '停止' : '启动'"
                />
                <Button 
                  icon="pi pi-cog"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="configureBot(adapter, bot)"
                  v-tooltip="'配置'"
                />
              </div>
            </div>
          </div>
          
          <div v-else class="empty-bots">
            <i class="pi pi-inbox text-2xl text-color-secondary mb-2"></i>
            <p class="text-color-secondary">暂无机器人实例</p>
          </div>
        </div>
        
        <div class="adapter-actions">
          <Button 
            icon="pi pi-plus" 
            label="添加机器人"
            text
            @click="addBot(adapter)"
          />
          <Button 
            icon="pi pi-refresh" 
            label="重启适配器"
            severity="warning"
            text
            @click="restartAdapter(adapter.name)"
            :loading="restartingAdapters.includes(adapter.name)"
          />
          <Button 
            icon="pi pi-cog" 
            label="配置"
            severity="secondary"
            text
            @click="configureAdapter(adapter)"
          />
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!adaptersData?.length" class="empty-state">
        <i class="pi pi-link text-6xl text-color-secondary mb-4"></i>
        <h3 class="text-color-secondary mb-2">暂无适配器</h3>
        <p class="text-color-secondary mb-4">还没有配置任何适配器，点击下方按钮添加第一个适配器</p>
        <Button 
          icon="pi pi-plus" 
          label="添加适配器" 
          severity="success"
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <!-- 添加适配器对话框 -->
    <Dialog 
      v-model:visible="showAddDialog" 
      header="添加新适配器"
      modal 
      :style="{ width: '40vw' }"
      :breakpoints="{ '960px': '60vw', '641px': '90vw' }"
    >
      <div class="add-adapter-content">
        <div class="mb-4">
          <label class="block text-900 font-medium mb-2">选择适配器类型</label>
          <Dropdown 
            v-model="newAdapterType" 
            :options="adapterTypes" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="选择适配器类型"
            class="w-full"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-900 font-medium mb-2">适配器名称</label>
          <InputText 
            v-model="newAdapterName" 
            placeholder="输入适配器名称"
            class="w-full"
          />
        </div>
        
        <div class="adapter-config" v-if="newAdapterType">
          <h4>配置参数</h4>
          <div v-if="newAdapterType === 'icqq'" class="config-fields">
            <div class="mb-3">
              <label class="block text-900 font-medium mb-2">QQ 号</label>
              <InputText placeholder="输入 QQ 号" class="w-full" />
            </div>
            <div class="mb-3">
              <label class="block text-900 font-medium mb-2">密码</label>
              <Password placeholder="输入密码" class="w-full" />
            </div>
          </div>
          
          <div v-if="newAdapterType === 'kook'" class="config-fields">
            <div class="mb-3">
              <label class="block text-900 font-medium mb-2">Token</label>
              <InputText placeholder="输入 KOOK Token" class="w-full" />
            </div>
            <div class="mb-3">
              <label class="block text-900 font-medium mb-2">连接模式</label>
              <Dropdown 
                :options="[
                  { label: 'WebSocket', value: 'websocket' },
                  { label: 'Webhook', value: 'webhook' }
                ]"
                optionLabel="label" 
                optionValue="value"
                placeholder="选择连接模式"
                class="w-full"
              />
            </div>
          </div>
          
          <div v-if="newAdapterType === 'onebot11'" class="config-fields">
            <div class="mb-3">
              <label class="block text-900 font-medium mb-2">WebSocket URL</label>
              <InputText placeholder="ws://localhost:6700" class="w-full" />
            </div>
            <div class="mb-3">
              <label class="block text-900 font-medium mb-2">Access Token</label>
              <InputText placeholder="输入访问令牌（可选）" class="w-full" />
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="取消" 
          text 
          @click="showAddDialog = false"
        />
        <Button 
          label="添加" 
          @click="addAdapter"
          :disabled="!newAdapterType || !newAdapterName"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCommonStore } from '@zhin.js/client'

const commonStore = useCommonStore()
const refreshing = ref(false)
const showAddDialog = ref(false)
const newAdapterType = ref('')
const newAdapterName = ref('')
const restartingAdapters = ref([])

// 适配器数据
const adaptersData = computed(() => (commonStore.store.value as any).adapters || [])

// 适配器类型选项
const adapterTypes = [
  { label: 'QQ (ICQQ)', value: 'icqq' },
  { label: 'KOOK', value: 'kook' },
  { label: 'OneBot v11', value: 'onebot11' },
  { label: '控制台 (Process)', value: 'process' }
]

// 统计信息
const activeAdaptersCount = computed(() => {
  return adaptersData.value.filter(adapter => adapter.status === 'active').length
})

const totalBots = computed(() => {
  return adaptersData.value.reduce((total, adapter) => total + (adapter.bots?.length || 0), 0)
})

const connectedBots = computed(() => {
  return adaptersData.value.reduce((total, adapter) => {
    return total + (adapter.bots?.filter(bot => bot.connected).length || 0)
  }, 0)
})

// 格式化和辅助函数
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

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'qq': return 'pi pi-comment'
    case 'kook': return 'pi pi-discord'
    case 'console': return 'pi pi-desktop'
    default: return 'pi pi-circle'
  }
}

const getPlatformName = (platform: string) => {
  switch (platform) {
    case 'qq': return 'QQ'
    case 'kook': return 'KOOK'
    case 'console': return '控制台'
    default: return platform
  }
}

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'danger'
    default: return 'info'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return 'pi pi-check'
    case 'inactive': return 'pi pi-times'
    default: return 'pi pi-question'
  }
}

// 操作函数
const refreshData = async () => {
  refreshing.value = true
  try {
    const { updateAllData } = await import('../../services/api')
    await updateAllData()
    console.log('✅ 适配器数据刷新完成')
  } catch (error) {
    console.error('❌ 适配器数据刷新失败:', error)
  } finally {
    refreshing.value = false
  }
}

const toggleBot = async (adapterName: string, botName: string, isConnected: boolean) => {
  const action = isConnected ? '停止' : '启动'
  console.log(`${action}机器人:`, adapterName, botName)
  // 这里应该调用实际的API
}

const configureBot = (adapter: any, bot: any) => {
  console.log('配置机器人:', adapter.name, bot.name)
  // 这里可以打开配置对话框
}

const addBot = (adapter: any) => {
  console.log('为适配器添加机器人:', adapter.name)
  // 这里可以打开添加机器人的对话框
}

const restartAdapter = async (adapterName: string) => {
  restartingAdapters.value.push(adapterName)
  
  try {
    console.log('重启适配器:', adapterName)
    await new Promise(resolve => setTimeout(resolve, 2000))
  } finally {
    restartingAdapters.value = restartingAdapters.value.filter(name => name !== adapterName)
  }
}

const configureAdapter = (adapter: any) => {
  console.log('配置适配器:', adapter.name)
  // 这里可以打开配置对话框
}

const addAdapter = async () => {
  if (!newAdapterType.value || !newAdapterName.value) return
  
  try {
    console.log('添加适配器:', newAdapterType.value, newAdapterName.value)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showAddDialog.value = false
    newAdapterType.value = ''
    newAdapterName.value = ''
    refreshData()
  } catch (error) {
    console.error('添加适配器失败:', error)
  }
}
</script>

<style scoped>
.adapters-page {
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

.stats-total .stats-icon { background: var(--blue-500); }
.stats-active .stats-icon { background: var(--green-500); }
.stats-bots .stats-icon { background: var(--purple-500); }
.stats-connected .stats-icon { background: var(--orange-500); }

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
  margin-top: 0.25rem;
}

.adapters-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.adapter-card {
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.adapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid var(--surface-border);
}

.adapter-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.adapter-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
}

.adapter-icon-qq { background: var(--blue-500); }
.adapter-icon-kook { background: var(--purple-500); }
.adapter-icon-console { background: var(--gray-500); }

.adapter-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.adapter-description {
  margin: 0 0 1rem 0;
  color: var(--text-color-secondary);
}

.adapter-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.platform-tag {
  background: var(--primary-50);
  color: var(--primary-color);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.uptime-info {
  color: var(--text-color-secondary);
}

.adapter-bots {
  padding: 2rem;
  border-bottom: 1px solid var(--surface-border);
}

.bots-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
}

.bots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.bot-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.bot-connected {
  border-left-color: var(--green-500);
}

.bot-disconnected {
  border-left-color: var(--red-500);
}

.bot-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.bot-info {
  flex: 1;
}

.bot-name {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.bot-status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bot-uptime {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.bot-actions {
  display: flex;
  gap: 0.25rem;
}

.empty-bots {
  text-align: center;
  padding: 2rem;
}

.adapter-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

/* 对话框样式 */
.add-adapter-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.adapter-config h4 {
  margin: 1rem 0 0.5rem 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .adapters-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .adapter-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .bots-grid {
    grid-template-columns: 1fr;
  }
  
  .adapter-actions {
    flex-direction: column;
  }
}
</style>
