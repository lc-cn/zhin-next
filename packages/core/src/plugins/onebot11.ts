import WebSocket from 'ws';
import { Bot } from '../bot.js';
import {Plugin} from '../plugin.js'
import {BotConfig, Message, User, Group, MessageSegment, SendOptions} from '../types.js';
import {registerAdapter} from '../app.js';
import {EventEmitter} from "events";
import {clearInterval, clearTimeout} from "node:timers";
import {Adapter} from "../adapter";

// ============================================================================
// OneBot11 配置和类型
// ============================================================================

export interface OneBotV11Config extends BotConfig {
  context: 'onebot11';
  url: string;
  access_token?: string;
  reconnect_interval?: number;
  heartbeat_interval?: number;
}

interface OneBot11Message {
  post_type: string;
  message_type?: string;
  sub_type?: string;
  message_id: number;
  user_id: number;
  group_id?: number;
  message: Array<{
    type: string;
    data: Record<string, any>;
  }>;
  raw_message: string;
  time: number;
}

interface ApiResponse<T = any> {
  status: string;
  retcode: number;
  data: T;
  echo?: string;
}

// ============================================================================
// OneBot11 适配器实现
// ============================================================================

export class OneBot11WsClient extends EventEmitter implements Bot<OneBotV11Config> {
  connected?:boolean
  private ws?: WebSocket;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(public plugin:Plugin,public config: OneBotV11Config) {
    super();
  }


  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let wsUrl = this.config.url;
      const headers: Record<string, string> = {};

      if (this.config.access_token) {
        headers['Authorization'] = `Bearer ${this.config.access_token}`;
      }
      this.ws = new WebSocket(wsUrl,{headers});

      this.ws.on('open', () => {
        this.connected=true;
        this.startHeartbeat();
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          this.emit('error',error)
        }
      });

      this.ws.on('close', (code,reason) => {
        this.connected=false
        reject({code,reason})
        this.scheduleReconnect();
      });

      this.ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    // 清理所有待处理的请求
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  async sendMessage(options: SendOptions): Promise<void> {
    options=await this.plugin.app.handleBeforeSend(options)
    this.plugin.logger.info(`send ${options.type}(${options.id}):`,options.content)
    const messageData: any = {
      message: options.content
    };

    if (options.type==='group') {
      await this.callApi('send_group_msg', {
        group_id: parseInt(options.id),
        ...messageData
      });
    } else if (options.type==='private') {
      await this.callApi('send_private_msg', {
        user_id: parseInt(options.id),
        ...messageData
      });
    } else {
      throw new Error('Either group_id or user_id must be provided');
    }
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.callApi('get_stranger_info', {
      user_id: parseInt(userId)
    });

    return {
      user_id: userId,
      nickname: response.nickname,
      card: response.card
    };
  }

  async getGroup(groupId: string): Promise<Group> {
    const response = await this.callApi('get_group_info', {
      group_id: parseInt(groupId)
    });

    return {
      group_id: groupId,
      group_name: response.group_name,
      member_count: response.member_count
    };
  }

  private async callApi(action: string, params: any = {}): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const echo = `req_${++this.requestId}`;
    const message = {
      action,
      params,
      echo
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(echo);
        reject(new Error(`API call timeout: ${action}`));
      }, 30000); // 30秒超时

      this.pendingRequests.set(echo, { resolve, reject, timeout });
      this.ws!.send(JSON.stringify(message));
    });
  }

  private handleWebSocketMessage(message: any): void {
    // 处理API响应
    if (message.echo && this.pendingRequests.has(message.echo)) {
      const request = this.pendingRequests.get(message.echo)!;
      this.pendingRequests.delete(message.echo);
      clearTimeout(request.timeout);

      const response = message as ApiResponse;
      if (response.status === 'ok') {
        return request.resolve(response.data);
      }
      return request.reject(new Error(`API error: ${response.retcode}`));
    }

    // 处理事件消息
    if (message.post_type === 'message') {
      this.handleOneBot11Message(message);
    } else if (message.post_type === 'meta_event' && message.meta_event_type === 'heartbeat') {
      // 心跳消息，暂时忽略
    }
  }

  private handleOneBot11Message(onebotMsg: OneBot11Message): void {
    const message: Message = {
      id: onebotMsg.message_id.toString(),
      sender:{
        id:onebotMsg.user_id.toString(),
        name:onebotMsg.user_id.toString()
      },
      channel:{
        id:(onebotMsg.group_id||onebotMsg.user_id).toString(),
        type:onebotMsg.group_id?'group':'private'
      },
      content: onebotMsg.message,
      raw: onebotMsg.raw_message,
      timestamp: onebotMsg.time,
      reply:async (content: MessageSegment[], quote?: boolean|string):Promise<void>=> {
        if(quote) content.unshift({type:'reply',data:{message_id:message.id}})
        this.plugin.dispatch('message.send',{
          ...message.channel,
          context:'onebot11',
          bot:`${this.config.name}`,
          content
        })
      }
    };
    this.plugin.dispatch('message.receive',message)
    this.plugin.logger.info(`recv ${message.channel.type}(${message.channel.id}):`,message.content)
    this.plugin.dispatch(`message.${message.channel.type}.receive`,message)
  }

  private startHeartbeat(): void {
    const interval = this.config.heartbeat_interval || 30000;
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, interval);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    const interval = this.config.reconnect_interval || 5000;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      try {
        await this.connect();
      } catch (error) {
        this.emit('error',new Error(`Reconnection failed: ${error}`));
        this.scheduleReconnect();
      }
    }, interval);
  }
}
registerAdapter(new Adapter('onebot11',OneBot11WsClient))