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
            dedupe: ['vue', 'vue-router', 'pinia','primevue'],
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
    router.all('*all', async (ctx, next) => {
        await next();
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
    router.use(connect(vite.middlewares));

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
    webServer.ws.on('connection', (ws: WebSocket) => {
        ws.send(JSON.stringify(createSyncMsg('entries', Object.values(webServer.entries))));
    });
    register({
        name:'web',
        value:webServer
    })
});
