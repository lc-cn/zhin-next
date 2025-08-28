import { useCommonStore } from '@zhin.js/client'

// API 基础配置
const getBaseUrl = () => `${window.location.protocol}//${window.location.host}`

// 通用的 API 请求函数
const apiRequest = async (endpoint: string) => {
  try {
    const response = await fetch(`${getBaseUrl()}${endpoint}`)
    return await response.json()
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    return { success: false, error: error.message }
  }
}

// 数据获取服务
export const DataService = {
  // 获取系统状态
  async getSystemStatus() {
    return await apiRequest('/api/system/status')
  },

  // 获取插件列表
  async getPlugins() {
    return await apiRequest('/api/plugins')
  },

  // 获取适配器列表
  async getAdapters() {
    return await apiRequest('/api/adapters')
  },

  // 获取配置信息
  async getConfig() {
    return await apiRequest('/api/config')
  },

  // 获取日志
  async getLogs() {
    return await apiRequest('/api/logs')
  },

  // 健康检查
  async healthCheck() {
    return await apiRequest('/api/health')
  },

  // 发送消息
  async sendMessage(data: {
    context: string
    bot: string
    id: string
    type: string
    content: string
  }) {
    try {
      const response = await fetch(`${getBaseUrl()}/api/message/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      console.error('Send message failed:', error)
      return { success: false, error: error.message }
    }
  },

  // 重载插件
  async reloadPlugin(pluginName: string) {
    try {
      const response = await fetch(`${getBaseUrl()}/api/plugins/${pluginName}/reload`, {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error(`Reload plugin ${pluginName} failed:`, error)
      return { success: false, error: error.message }
    }
  }
}

// 全面更新所有数据
export const updateAllData = async () => {
  const commonStore = useCommonStore()
  
  try {
    console.log('开始更新所有框架数据...')
    
    const [systemRes, pluginsRes, adaptersRes, configRes] = await Promise.all([
      DataService.getSystemStatus(),
      DataService.getPlugins(),
      DataService.getAdapters(),
      DataService.getConfig()
    ])

    // 更新系统数据
    if (systemRes.success) {
      commonStore.syncData({ key: 'system', value: systemRes.data })
      console.log('✅ 系统数据更新成功')
    } else {
      console.warn('⚠️ 系统数据更新失败:', systemRes.error)
    }

    // 更新插件数据
    if (pluginsRes.success) {
      commonStore.syncData({ key: 'plugins', value: pluginsRes.data })
      console.log('✅ 插件数据更新成功')
    } else {
      console.warn('⚠️ 插件数据更新失败:', pluginsRes.error)
    }

    // 更新适配器数据
    if (adaptersRes.success) {
      commonStore.syncData({ key: 'adapters', value: adaptersRes.data })
      console.log('✅ 适配器数据更新成功')
    } else {
      console.warn('⚠️ 适配器数据更新失败:', adaptersRes.error)
    }

    // 更新配置数据
    if (configRes.success) {
      commonStore.syncData({ key: 'config', value: configRes.data })
      console.log('✅ 配置数据更新成功')
    } else {
      console.warn('⚠️ 配置数据更新失败:', configRes.error)
    }

    return {
      success: true,
      results: { systemRes, pluginsRes, adaptersRes, configRes }
    }
    
  } catch (error) {
    console.error('❌ 更新框架数据失败:', error)
    return { success: false, error }
  }
}

// 导出给全局使用
declare global {
  interface Window {
    DataService: typeof DataService
    updateAllData: typeof updateAllData
  }
}

// 挂载到 window 对象，方便调试
if (typeof window !== 'undefined') {
  window.DataService = DataService
  window.updateAllData = updateAllData
}
