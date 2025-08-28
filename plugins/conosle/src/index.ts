import {register, useContext} from 'zhin.js';
import WebSocket,{WebSocketServer} from 'ws';
import {createServer,ViteDevServer,searchForWorkspaceRoot} from 'vite';
import Components from 'unplugin-vue-components/vite';
import {PrimeVueResolver} from '@primevue/auto-import-resolver';
import connect from 'koa-connect';
import vuePlugin from "@vitejs/plugin-vue";
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from "node:url";

declare module '@zhin.js/types' {
    interface GlobalContext {
        web: WebServer;
    }
}
export type WebServer = {
    vite:ViteDevServer,
    addEntry(entry: string): () => void;
    entries: Record<string, string>;
    ws:WebSocketServer
};
const createSyncMsg = (key: string, value: any) => {
    return {
        type: 'sync',
        data: {
            key,
            value,
        },
    };
};
const createAddMsg = (key: string, value: any) => {
    return {
        type: 'add',
        data: {
            key,
            value,
        },
    };
};
const createDeleteMsg = (key: string, value: any) => {
    return {
        type: 'delete',
        data: {
            key,
            value,
        },
    };
};
useContext('router', async (router) => {
    const root = path.join(process.cwd(),'node_modules','@zhin.js','client','app');
    const base='/vite/'
    const vite = await createServer({
        root,
        base,
        plugins: [
            vuePlugin(),
            Components({
                resolvers: [
                    PrimeVueResolver()
                ]
            })
        ],
        server: {
            middlewareMode: true,
            fs: {
                allow: [searchForWorkspaceRoot(fileURLToPath(import.meta.url))],
            },
        },
        resolve: {
            dedupe: ['vue', 'vue-router', 'pinia','primevue','primeicons'],
            alias: {
                '@zhin.js/client': path.resolve(root, '../src'),
            },
        },
        optimizeDeps: {
            include: ['vue', 'pinia'],
        },
        build: {
            rollupOptions: {
                input: root + '/index.html',
            },
        },
    });
    router.all('/*all', async (ctx, next) => {
        await next();
        // 🚀 如果已经有响应体，说明其他路由已处理
        if (ctx.body !== undefined || ctx.respond === false) {
            return;
        }
        
        const url=ctx.request.originalUrl.replace(base,'')
        const name = ctx.path.slice(1);
        const sendFile = (filename: string) => {
            ctx.type = path.extname(filename);
            if (filename.endsWith('.ts')) ctx.type = 'text/javascript';
            return (ctx.body = fs.createReadStream(filename));
        };
        if (Object.keys(webServer.entries).includes(name)) {
            return sendFile(path.resolve(process.cwd(), webServer.entries[name]));
        }
        const filename = path.resolve(root, name);
        if (!filename.startsWith(root) && !filename.includes('node_modules')) {
            return (ctx.status = 403);
        }
        if (fs.existsSync(filename)) {
            const fileState = fs.statSync(filename);
            if (fileState.isFile()) return sendFile(filename);
        }
        const template = fs.readFileSync(path.resolve(root, 'index.html'), 'utf8');
        ctx.type = 'html';
        ctx.body = await vite.transformIndexHtml(url, template);
    });
    
    // 🚀 最后注册Vite中间件 (在所有API路由之后)
    console.log('🖥️ Console插件注册Vite中间件 - 处理静态文件和SPA路由')
    router.use((ctx,next)=>{
        if(ctx.request.originalUrl.startsWith('/api')) return next()
        return connect(vite.middlewares)(ctx,next);
    });

    const webServer:WebServer={
        vite,
        entries: {},
        addEntry(entry) {
            const hash = Date.now().toString(16);
            this.entries[hash] = `/vite/@fs/${entry}`;
            for (const ws of this.ws.clients || []) {
                ws.send(JSON.stringify(createAddMsg('entries', this.entries[hash])));
            }
            return () => {
                for (const ws of this.ws.clients || []) {
                    ws.send(JSON.stringify(createDeleteMsg('entries', this.entries[hash])));
                }
                delete this.entries[hash];
            };
        },
        ws:router.ws('/server')
    }
    // 数据推送函数
    const broadcastToAll = (message: any) => {
        for (const ws of webServer.ws.clients || []) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }

    // 推送数据更新通知
    const notifyDataUpdate = () => {
        broadcastToAll({
            type: 'data-update',
            timestamp: Date.now()
        });
    }

    // WebSocket 连接处理
    webServer.ws.on('connection', (ws: WebSocket) => {
        // 发送初始数据
        ws.send(JSON.stringify(createSyncMsg('entries', Object.values(webServer.entries))));

        // 通知客户端进行数据初始化
        ws.send(JSON.stringify({
            type: 'init-data',
            timestamp: Date.now()
        }));
        
        ws.on('close', () => {
        });
        
        ws.on('error', (error) => {
            console.error('WebSocket错误:', error);
        });
    });

    // 定时通知客户端更新数据
    const dataUpdateInterval = setInterval(() => {
        notifyDataUpdate();
    }, 5000); // 每5秒通知一次更新

    // 插件卸载时清理定时器
    process.on('exit', () => {
        clearInterval(dataUpdateInterval);
    });
    register({
        name:'web',
        description:"web服务",
        value:webServer
    })
});
