<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section mb-4">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">欢迎使用 Zhin Bot</h1>
          <p class="welcome-subtitle">现代化的聊天机器人框架管理平台</p>
          <div class="welcome-stats">
            <div class="stat-item">
              <i class="pi pi-clock text-primary"></i>
              <span>运行时间: {{ formatUptime(systemData?.uptime) }}</span>
            </div>
            <div class="stat-item">
              <i class="pi pi-check-circle text-green-500"></i>
              <span>系统正常</span>
            </div>
          </div>
        </div>
        <div class="welcome-visual">
          <div class="system-avatar">
            <i class="pi pi-desktop text-4xl"></i>
          </div>
          <Button 
            icon="pi pi-refresh" 
            label="刷新数据" 
            @click="refreshData" 
            :loading="refreshing"
            class="mt-3"
          />
        </div>
      </div>
    </div>

    <!-- 快速统计 -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="quick-stat-card stat-plugins">
          <div class="stat-icon">
            <i class="pi pi-th-large"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ pluginsData?.length || 0 }}</div>
            <div class="stat-label">已安装插件</div>
            <div class="stat-sub">{{ activePluginsCount }} 个活跃</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="quick-stat-card stat-adapters">
          <div class="stat-icon">
            <i class="pi pi-link"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ adaptersData?.length || 0 }}</div>
            <div class="stat-label">适配器</div>
            <div class="stat-sub">{{ activeAdaptersCount }} 个活跃</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="quick-stat-card stat-bots">
          <div class="stat-icon">
            <i class="pi pi-android"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalBots }}</div>
            <div class="stat-label">机器人</div>
            <div class="stat-sub">{{ connectedBots }} 个在线</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="quick-stat-card stat-memory">
          <div class="stat-icon">
            <i class="pi pi-chart-bar"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ formatMemory(systemData?.memory.heapUsed) }}</div>
            <div class="stat-label">内存使用</div>
            <div class="stat-sub">{{ memoryUsagePercent }}% 已使用</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="grid">
      <!-- 系统状态 -->
      <div class="col-12 lg:col-6">
        <Card class="dashboard-card">
          <template #title>
            <div class="card-title">
              <i class="pi pi-desktop mr-2"></i>
              系统状态
            </div>
          </template>
          <template #content>
            <div class="system-info">
              <div class="info-item">
                <div class="info-icon bg-blue-100">
                  <i class="pi pi-microchip text-blue-600"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">平台</div>
                  <div class="info-value">{{ systemData?.platform }} {{ systemData?.nodeVersion }}</div>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-icon bg-green-100">
                  <i class="pi pi-chart-line text-green-600"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">内存使用</div>
                  <div class="info-value">
                    {{ formatMemory(systemData?.memory.heapUsed) }} / {{ formatMemory(systemData?.memory.heapTotal) }}
                  </div>
                  <ProgressBar 
                    :value="memoryUsagePercent" 
                    :showValue="false"
                    style="height: 4px; margin-top: 0.5rem;"
                  />
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-icon bg-purple-100">
                  <i class="pi pi-clock text-purple-600"></i>
                </div>
                <div class="info-details">
                  <div class="info-label">进程信息</div>
                  <div class="info-value">PID: {{ systemData?.pid }} · 运行时间: {{ formatUptime(systemData?.uptime) }}</div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- 插件概览 -->
      <div class="col-12 lg:col-6">
        <Card class="dashboard-card">
          <template #title>
            <div class="card-title">
              <i class="pi pi-th-large mr-2"></i>
              插件概览
            </div>
          </template>
          <template #content>
            <div class="plugins-overview">
              <div 
                v-for="plugin in pluginsData?.slice(0, 4)" 
                :key="plugin.name"
                class="plugin-item-mini"
              >
                <div class="plugin-icon-mini">
                  <i class="pi pi-puzzle-piece"></i>
                </div>
                <div class="plugin-info-mini">
                  <div class="plugin-name-mini">{{ plugin.name }}</div>
                  <div class="plugin-meta-mini">
                    <Tag 
                      :value="plugin.status" 
                      :severity="getStatusSeverity(plugin.status)"
                      size="small"
                    />
                    <span class="uptime-mini">{{ formatUptime(plugin.uptime) }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="(pluginsData?.length || 0) > 4" class="more-plugins">
                <Button 
                  label="查看全部插件" 
                  text 
                  @click="$router.push('/plugins/installed')"
                  size="small"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- 适配器状态 -->
      <div class="col-12">
        <Card class="dashboard-card">
          <template #title>
            <div class="card-title">
              <i class="pi pi-link mr-2"></i>
              适配器状态
            </div>
          </template>
          <template #content>
            <div class="adapters-overview">
              <div 
                v-for="adapter in adaptersData" 
                :key="adapter.name"
                class="adapter-overview-item"
              >
                <div class="adapter-header-mini">
                  <div class="adapter-icon-mini" :class="`adapter-icon-${adapter.platform}`">
                    <i :class="getPlatformIcon(adapter.platform)"></i>
                  </div>
                  <div class="adapter-info-mini">
                    <h4 class="adapter-name-mini">{{ adapter.name }}</h4>
                    <div class="adapter-meta-mini">
                      <Tag 
                        :value="adapter.status" 
                        :severity="getStatusSeverity(adapter.status)"
                        size="small"
                      />
                      <span class="platform-mini">{{ getPlatformName(adapter.platform) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="bots-mini">
                  <div 
                    v-for="bot in adapter.bots?.slice(0, 3)" 
                    :key="bot.name"
                    class="bot-mini"
                    :class="{ 'bot-online': bot.connected, 'bot-offline': !bot.connected }"
                  >
                    <div class="bot-avatar-mini">
                      <i class="pi pi-user"></i>
                    </div>
                    <span class="bot-name-mini">{{ bot.name }}</span>
                  </div>
                  
                  <div v-if="(adapter.bots?.length || 0) > 3" class="more-bots-mini">
                    +{{ (adapter.bots?.length || 0) - 3 }} 更多
                  </div>
                </div>
              </div>
              
              <div v-if="!adaptersData?.length" class="no-adapters">
                <i class="pi pi-link text-2xl text-color-secondary mb-2"></i>
                <p class="text-color-secondary">暂无适配器</p>
                <Button 
                  label="添加适配器" 
                  size="small" 
                  @click="$router.push('/adapters')"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCommonStore } from '@zhin.js/client'
import { updateAllData } from '../services/api'

const commonStore = useCommonStore()
const refreshing = ref(false)
// 数据
const systemData = computed(() => (commonStore.store as any).system)
const pluginsData = computed(() => (commonStore.store as any).plugins || [])
const adaptersData = computed(() => (commonStore.store as any).adapters || [])

// 统计数据
const activePluginsCount = computed(() => {
  return pluginsData.value.filter(plugin => plugin.status === 'active').length
})

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

const memoryUsagePercent = computed(() => {
  if (!systemData.value?.memory) return 0
  const { heapUsed, heapTotal } = systemData.value.memory
  return Math.round((heapUsed / heapTotal) * 100)
})

// 格式化函数
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

const formatMemory = (bytes?: number) => {
  if (!bytes) return '0B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const getStatusSeverity = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'disposed':
    case 'inactive': return 'danger'
    default: return 'info'
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

// 刷新数据
const refreshData = async () => {
  refreshing.value = true
  try {
    await updateAllData()
    console.log('✅ 仪表板数据刷新完成')
  } catch (error) {
    console.error('❌ 仪表板数据刷新失败:', error)
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-color-text));
  border-radius: 16px;
  padding: 2rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(50%, -50%);
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-title {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.welcome-subtitle {
  margin: 0 0 1.5rem 0;
  font-size: 1.125rem;
  opacity: 0.9;
}

.welcome-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.stat-item i {
  font-size: 1rem;
}

.system-avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 快速统计卡片 */
.quick-stat-card {
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.quick-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-plugins .stat-icon { background: var(--blue-500); }
.stat-adapters .stat-icon { background: var(--purple-500); }
.stat-bots .stat-icon { background: var(--green-500); }
.stat-memory .stat-icon { background: var(--orange-500); }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0;
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* 仪表板卡片 */
.dashboard-card {
  height: 100%;
}

.dashboard-card :deep(.p-card-body) {
  padding: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

/* 系统信息 */
.system-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.info-details {
  flex: 1;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.info-value {
  font-weight: 600;
  color: var(--text-color);
}

/* 插件概览 */
.plugins-overview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plugin-item-mini {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
}

.plugin-icon-mini {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.plugin-info-mini {
  flex: 1;
}

.plugin-name-mini {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.plugin-meta-mini {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.uptime-mini {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.more-plugins {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
}

/* 适配器概览 */
.adapters-overview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.adapter-overview-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface-50);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.adapter-header-mini {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.adapter-icon-mini {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.adapter-icon-qq { background: var(--blue-500); }
.adapter-icon-kook { background: var(--purple-500); }
.adapter-icon-console { background: var(--gray-500); }

.adapter-name-mini {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.adapter-meta-mini {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.platform-mini {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.bots-mini {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.bot-mini {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.bot-online {
  background: var(--green-50);
  color: var(--green-700);
  border: 1px solid var(--green-200);
}

.bot-offline {
  background: var(--red-50);
  color: var(--red-700);
  border: 1px solid var(--red-200);
}

.bot-avatar-mini {
  width: 20px;
  height: 20px;
  background: currentColor;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  color: white;
}

.more-bots-mini {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  padding: 0.5rem;
}

.no-adapters {
  text-align: center;
  padding: 2rem;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .welcome-content {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-stats {
    justify-content: center;
  }
  
  .quick-stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .adapter-overview-item {
    padding: 1rem;
  }
  
  .bots-mini {
    justify-content: center;
  }
}
</style>