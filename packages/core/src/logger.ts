import { ConsoleLogger } from "./hmr/utils.js";

export const logger = new ConsoleLogger('[Core]', process.env.NODE_ENV === 'development');