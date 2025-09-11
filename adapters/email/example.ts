import { createApp } from 'zhin.js'
import EmailAdapter from './lib/index.js'

// 示例：创建邮件适配器应用
const app = createApp({
  adapters: {
    email: {
      context: 'email',
      name: 'my-email-bot',
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-app-password' // 应用专用密码
        }
      },
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        user: 'your-email@gmail.com',
        password: 'your-app-password',
        checkInterval: 30000, // 30秒检查一次
        mailbox: 'INBOX',
        markSeen: true
      },
      attachments: {
        enabled: true,
        downloadPath: './downloads/email',
        maxFileSize: 10 * 1024 * 1024 // 10MB
      }
    }
  }
})

// 处理接收到的邮件
app.on('message.receive', (message) => {
  if (message.$adapter === 'email') {
    console.log('收到邮件:', message.$content)
    console.log('发件人:', message.$sender.name)
    
    // 自动回复
    if (message.$content.some(seg => 
      seg.type === 'text' && seg.data.text?.includes('帮助')
    )) {
      message.$reply('这是自动回复：感谢您的邮件！')
    }
  }
})

// 启动应用
app.start().then(() => {
  console.log('邮件机器人已启动')
  
  // 发送测试邮件
  setTimeout(async () => {
    await app.sendMessage({
      context: 'email',
      bot: 'my-email-bot',
      id: 'recipient@example.com',
      type: 'private',
      content: '这是一条测试邮件'
    })
  }, 5000)
})
