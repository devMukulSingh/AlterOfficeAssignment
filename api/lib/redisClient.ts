import {Redis} from "iovalkey";

export const redisClient = new Redis(process.env.VALKEY_URL as string);