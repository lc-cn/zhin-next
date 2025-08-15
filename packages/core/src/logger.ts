import { ConsoleLogger } from "@zhin.js/hmr";

export const logger = new ConsoleLogger('[Core]', process.env.NODE_ENV === 'development');