import { redisClient } from "../lib/redisClient.js";
import type { Context } from "hono";
import type { Next } from "hono/types";

export async function rateLimiter(c: Context, next: Next) {

    // c.req.raw.headers.get('true-client-ip') -> for deployment on render only( render uses cloudfare servers internally )
    const clientIp = process.env.NODE_ENV==='production' ? c.req.header('true-client-ip') : "::1"

    if (!clientIp) {
        return c.json({
            error: "Cannot get client IP"
        }, 400)
    }
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