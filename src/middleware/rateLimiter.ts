import { getConnInfo } from "@hono/node-server/conninfo";
import { redisClient } from "../lib/redisClient.js";
import type { Context } from "hono";
import type {  Next } from "hono/types";

export async function rateLimiter(c: Context, next: Next) {

    const clientIp = getConnInfo(c).remote.address || "192.0.0.1";
    const requests = await redisClient.incr(clientIp)

    let ttl;
    if (requests === 1) {
        await redisClient.expire(clientIp, 60)
        ttl = 60;
    }
    else {
        ttl = await redisClient.ttl(clientIp)
    }
    if (requests > 20) {
        return c.json({
            error: "Too many requests"
        }, 429)
    }
    else {
        await next()
    }
}