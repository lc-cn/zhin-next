import {register } from 'zhin.js';
import { createServer, Server } from 'http';
import Koa from 'koa';
import auth from 'koa-basic-auth';
import KoaBodyParser from 'koa-bodyparser';
import { Router } from './router.js';
import * as process from 'process';
export * from './router';
declare module '@zhin.js/types'{
  interface GlobalContext {
    koa:Koa,
    router:Router,
    server:Server
  }
}
const koa = new Koa();
const server= createServer(koa.callback())
const router = new Router(server, { prefix: process.env.routerPrefix || '' });
const username = process.env.username || 'admin';
const password = process.env.password || '123456';
koa.use(
  auth({
    name: username,
    pass: password,
  }),
);

register({
  name:'server',
  mounted(p){
    return new Promise<Server>((resolve)=>{
      server.listen(
          {
            host: '0.0.0.0',
            port: Number((process.env.port ||= '8086')),
          },
          () => {
            const address = server.address();
            if (!address) return;
            const visitAddress = typeof address === 'string' ? address : `${address.address}:${address.port}`;
            p.logger.info(`server is running at http://${visitAddress}`);
            p.logger.info('your username is：', username);
            p.logger.info('your password is：', password);
            resolve(server)
          },
      )
    })
  },
  dispose(s){
    s.close()
  }
})
register({
  name:"koa",
  value:koa
})
register({
  name:'router',
  value:router
})
koa.use(KoaBodyParser()).use(router.routes()).use(router.allowedMethods());