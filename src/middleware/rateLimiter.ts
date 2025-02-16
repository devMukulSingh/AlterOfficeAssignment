import { getConnInfo } from "@hono/node-server/conninfo";
import { redisClient } from "../lib/redisClient.js";
import type { Context } from "hono";
import type { Next } from "hono/types";

export async function rateLimiter(c: Context, next: Next) {

    const ip = c.req.header('')
    const clientIp = getConnInfo(c).remote.address
    console.log(c.req.raw.headers.get('x-real-ip'),"real ip");
    console.log(c.req.raw.headers.get('c.env.ip'), "c.env.ip"); 
   console.log(c.req.raw.headers.get('x-forwarded-for'),"x-forwaded-for");
    console.log(c.req.header());
    if (!clientIp) {
        return c.json({
            error: "Cannot get client IP"
        }, 400)
    }
    console.log({ clientIp });
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