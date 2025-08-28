<template>
  <div class="system-status">
    <!-- 页面标题 -->
    <div class="page-header mb-4">
      <div class="flex align-items-center">
        <i class="pi pi-info-circle text-3xl text-primary mr-3"></i>
        <div>
          <h1 class="page-title">系统状态</h1>
          <p class="page-subtitle">实时监控 Zhin Bot 框架运行状态</p>
        </div>
      </div>
      <div class="page-actions">
        <Button 
          icon="pi pi-refresh" 
          label="刷新" 
          @click="refreshData" 
          :loading="refreshing"
        />
      </div>
    </div>

    <!-- 概览卡片 -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="overview-card">
          <div class="overview-content">
            <div class="overview-icon bg-blue-500">
              <i class="pi pi-clock text-white"></i>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ formatUptime(systemData?.uptime) }}</div>
              <div class="overview-label">运行时间</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="overview-card">
          <div class="overview-content">
            <div class="overview-icon bg-green-500">
              <i class="pi pi-microchip text-white"></i>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ formatMemory(systemData?.memory.heapUsed) }}</div>
              <div class="overview-label">内存使用</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="overview-card">
          <div class="overview-content">
            <div class="overview-icon bg-orange-500">
              <i class="pi pi-server text-white"></i>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ systemData?.platform }}</div>
              <div class="overview-label">操作系统</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-3">
        <div class="overview-card">
          <div class="overview-content">
            <div class="overview-icon bg-purple-500">
              <i class="pi pi-code text-white"></i>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ systemData?.nodeVersion }}</div>
              <div class="overview-label">Node.js</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细信息 -->
    <div class="grid">
      <!-- 系统信息 -->
      <div class="col-12 lg:col-6">
        <Card class="detail-card">
          <template #title>
            <div class="flex align-items-center">
              <i class="pi pi-desktop mr-2"></i>
              系统信息
            </div>
          </template>
          <template #content>
            <div class="system-details">
              <div class="detail-item">
                <span class="detail-label">进程 ID</span>
                <span class="detail-value">{{ systemData?.pid }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">平台</span>
                <span class="detail-value">{{ systemData?.platform }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Node.js 版本</span>
                <span class="detail-value">{{ systemData?.nodeVersion }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">最后更新</span>
                <span class="detail-value">{{ formatTime(systemData?.timestamp) }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- 内存信息 -->
      <div class="col-12 lg:col-6">
        <Card class="detail-card">
          <template #title>
            <div class="flex align-items-center">
              <i class="pi pi-chart-bar mr-2"></i>
              内存信息
            </div>
          </template>
          <template #content>
            <div class="memory-details">
              <div class="memory-item">
                <div class="flex justify-content-between align-items-center mb-2">
                  <span>堆内存使用</span>
                  <span class="text-primary font-semibold">
                    {{ formatMemory(systemData?.memory.heapUsed) }}
                  </span>
                </div>
                <ProgressBar 
                  :value="memoryUsagePercent" 
                  :showValue="false"
                  class="memory-progress"
                />
              </div>
              
              <div class="detail-item">
                <span class="detail-label">堆内存总量</span>
                <span class="detail-value">{{ formatMemory(systemData?.memory.heapTotal) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">常驻集大小</span>
                <span class="detail-value">{{ formatMemory(systemData?.memory.rss) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">外部内存</span>
                <span class="detail-value">{{ formatMemory(systemData?.memory.external) }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- CPU信息 -->
      <div class="col-12">
        <Card class="detail-card">
          <template #title>
            <div class="flex align-items-center">
              <i class="pi pi-microchip mr-2"></i>
              CPU 使用情况
            </div>
          </template>
          <template #content>
            <div class="cpu-details">
              <div class="detail-item">
                <span class="detail-label">用户时间 (μs)</span>
                <span class="detail-value">{{ formatNumber(systemData?.cpu.user) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">系统时间 (μs)</span>
                <span class="detail-value">{{ formatNumber(systemData?.cpu.system) }}</span>
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

const commonStore = useCommonStore()
const refreshing = ref(false)

// 系统数据
const systemData = computed(() => (commonStore.store as any).system)

// 内存使用百分比
const memoryUsagePercent = computed(() => {
  if (!systemData.value?.memory) return 0
  const { heapUsed, heapTotal } = systemData.value.memory
  return Math.round((heapUsed / heapTotal) * 100)
})

// 格式化函数
const formatUptime = (seconds?: number) => {
  if (!seconds) return '0秒'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (days > 0) {
    return `${days}天 ${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${secs}秒`
  } else {
    return `${secs}秒`
  }
}

const formatMemory = (bytes?: number) => {
  if (!bytes) return '0B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatNumber = (num?: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const formatTime = (timestamp?: string) => {
  if (!timestamp) return '未知'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const refreshData = async () => {
  refreshing.value = true
  try {
    // 使用全局API
    if (window.ZhinDataAPI?.updateAllData) {
      await window.ZhinDataAPI.updateAllData()
      console.log('✅ 系统状态数据刷新完成')
    } else {
      throw new Error('全局API未就绪')
    }
  } catch (error) {
    console.error('❌ 系统状态数据刷新失败:', error)
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.system-status {
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

.overview-card {
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  height: 100%;
}

.overview-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.overview-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.overview-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.detail-card {
  height: 100%;
}

.detail-card :deep(.p-card-body) {
  padding: 1.5rem;
}

.detail-card :deep(.p-card-title) {
  margin-bottom: 1rem;
  color: var(--text-color);
  font-size: 1.125rem;
  font-weight: 600;
}

.system-details, .memory-details, .cpu-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.detail-value {
  color: var(--text-color);
  font-weight: 500;
}

.memory-item {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.memory-progress {
  height: 8px;
}

.memory-progress :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, var(--primary-color), var(--primary-color-text));
}

@media (max-width: 768px) {
  .system-status {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .page-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .overview-content {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .overview-icon {
    margin: 0 auto;
  }
}
</style>
