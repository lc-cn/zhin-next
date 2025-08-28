<template>
  <div class="contexts-overview">
    <!-- 页面标题 -->
    <div class="page-header mb-4">
      <div class="flex align-items-center">
        <i class="pi pi-sitemap text-3xl text-primary mr-3"></i>
        <div>
          <h1 class="page-title">上下文管理</h1>
          <p class="page-subtitle">管理和监控框架中的所有上下文</p>
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

    <!-- 统计概览 -->
    <div class="grid mb-4">
      <div class="col-12 md:col-6">
        <div class="stats-card stats-total">
          <div class="stats-icon">
            <i class="pi pi-sitemap text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ totalContexts }}</div>
            <div class="stats-label">总上下文数</div>
            <div class="stats-sub">所有已注册上下文</div>
          </div>
        </div>
      </div>
      
      <div class="col-12 md:col-6">
        <div class="stats-card stats-active">
          <div class="stats-icon">
            <i class="pi pi-check-circle text-white"></i>
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ activeContexts }}</div>
            <div class="stats-label">活跃上下文</div>
            <div class="stats-sub">正在运行中</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上下文列表 -->
    <Card class="context-list-card">
      <template #title>
        <div class="flex justify-content-between align-items-center">
          <span>所有上下文</span>
          <Button 
            icon="pi pi-refresh" 
            severity="secondary"
            text 
            rounded 
            size="small"
            :loading="refreshing"
            @click="refreshData"
            v-tooltip="'刷新数据'"
          />
        </div>
      </template>
      
      <template #content>
        <div v-if="allContexts.length" class="context-list">
          <div 
            v-for="context in allContexts" 
            :key="context.name"
            class="context-item"
          >
            <div class="context-info">
              <div class="context-name">{{ context.name }}</div>
              <div class="context-description">{{ context.description }}</div>
            </div>
            <Tag 
              value="活跃" 
              severity="success"
              icon="pi pi-check"
            />
          </div>
        </div>
        
        <div v-else class="empty-state">
          <i class="pi pi-sitemap text-6xl text-color-secondary mb-4"></i>
          <h3 class="text-color-secondary mb-2">暂无上下文</h3>
          <p class="text-color-secondary mb-4">系统中还没有注册任何上下文</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCommonStore } from '@zhin.js/client'
import { useRouter } from 'vue-router'

const commonStore = useCommonStore()
const router = useRouter()
const refreshing = ref(false)

// 数据
const systemData = computed(() => (commonStore.store as any).system)
const pluginsData = computed(() => (commonStore.store as any).plugins || [])
const adaptersData = computed(() => (commonStore.store as any).adapters || [])

// 合并所有上下文
const allContexts = computed(() => {
  const contexts = []
  
  // 添加适配器上下文（现在包含name和description字段）
  if (adaptersData.value && Array.isArray(adaptersData.value)) {
    adaptersData.value.forEach(adapter => {
      contexts.push({
        name: adapter.name || adapter,
        description: adapter.desc || adapter.description || '上下文服务'
      })
    })
  }
  
  return contexts
})

// 统计数据
const totalContexts = computed(() => {
  return allContexts.value.length
})

const activeContexts = computed(() => {
  // 所有上下文都是活跃的
  return allContexts.value.length
})

// 操作函数
const refreshData = async () => {
  refreshing.value = true
  try {
    // 使用全局API
    if (window.ZhinDataAPI?.updateAllData) {
      await window.ZhinDataAPI.updateAllData()
      console.log('✅ 上下文数据刷新完成')
    } else {
      throw new Error('全局API未就绪')
    }
  } catch (error) {
    console.error('❌ 上下文数据刷新失败:', error)
  } finally {
    refreshing.value = false
  }
}
</script>

<style scoped>
.contexts-overview {
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

.stats-total .stats-icon { background: var(--blue-500); }
.stats-active .stats-icon { background: var(--green-500); }

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

/* 上下文列表 */
.context-list-card :deep(.p-card-body) {
  padding: 1.5rem;
}

.context-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.context-item {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.context-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.context-info {
  flex: 1;
}

.context-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.context-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 1rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .contexts-overview {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .context-list {
    grid-template-columns: 1fr;
  }
}
</style>