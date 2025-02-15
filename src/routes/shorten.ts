import { Hono } from "hono";
import { urlSchema } from "../lib/schema.js";
import { BASE_URL_SERVER, prisma } from "../lib/constants.js";
import { Prisma, type Url } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import { getConnInfo } from "@hono/node-server/conninfo";
import { generateRandomAlias } from "../lib/helpers.js";
import { redisClient } from "../lib/redisClient.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const shortenApp = new Hono();

shortenApp.use('/api/shorten/:alias', rateLimiter)

shortenApp.post('/:userId', async (c) => {

    const { userId } = c.req.param()
    const body = await c.req.json();
    const parsedBody = urlSchema.safeParse(body);
    if (!parsedBody.success) {
        return c.json({
            error: parsedBody.error.errors.map(err => err.message)
        }, 400)
    }
    const { longUrl, alias, topic } = parsedBody.data

    //redis caching
    let existingUser = JSON.parse(await redisClient.get(`user-${userId}`) || "null");

    if (!existingUser) {
        existingUser = await prisma.user.findFirst({
            where: {
                id: userId
            }
        })
        if (!existingUser) {
            return c.json({
                error: "Unauthenticated, user not found"
            }, 403)
        }
        await redisClient.set(`user-${existingUser.id}`, JSON.stringify(existingUser))
        await redisClient.expire(`user-${existingUser.id}`, 5 * 60)
    }


    //validating if the custom alias given by the user already exists in the db, as alias should be unique
    if (alias && alias !== "") {
        const isAliasExists = await prisma.url.findFirst({
            where: {
                customAlias: alias
            }
        })
        if (isAliasExists) return c.json({
            error: "Alias already exists, try another"
        }, 409)
    }

    //redis caching
    let existingUrl: Url | null = JSON.parse(await redisClient.get(`existingUrl-${longUrl}`) || "null");

    //if existingUrl is not in the cache, then find in the db
    if (!existingUrl) {
        existingUrl = await prisma.url.findFirst({
            where: {
                longUrl
            }
        })
        //if got in the db, set it in cache
        if (existingUrl)
            await redisClient.set(`existingUrl-${longUrl}`, JSON.stringify(existingUrl))
            await redisClient.expire(`existingUrl-${longUrl}`, 60 * 5)
    }
    if (existingUrl) {
        return c.json({
            msg: "Url Already exists",
            shortUrl: existingUrl.shortUrl
        }, 200)
    }

    let generatedAlias = alias;
    if (!alias || alias === "") {
        generatedAlias = generateRandomAlias()
    }
    const date = Date.now().toString()

    generatedAlias = generatedAlias + date.slice(0, 4) + date.slice(-4)
    const shortUrl = `${BASE_URL_SERVER}/shorten/${generatedAlias}`

    try {
        await prisma.url.create({
            data: {
                customAlias: generatedAlias,
                longUrl,
                shortUrl,
                topic,
                userId
            }
        })
        return c.json({
            msg: "Url generated successfully",
            shortUrl
        }, 201)
    }
    catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
                return c.json({
                    error: "Alias already exists, try another"
                }, 409)
            }
        }
        return c.json({
            error: "Internal server errror"
        }, 500)
    }
})

shortenApp.get('/:alias', rateLimiter, async (c) => {

    const { alias } = c.req.param()
    try {
        //redis cache
        let existingUrl: Url | null = JSON.parse(await redisClient.get(alias) || "null")

        if (!existingUrl) {
            existingUrl = await prisma.url.findFirst({
                where: {
                    customAlias: alias,
                }
            })
            if (!existingUrl) {
                return c.json({
                    error: "Not found",
                }, 404)
            }
            await redisClient.set(existingUrl.customAlias, JSON.stringify(existingUrl));
            await redisClient.expire(existingUrl.customAlias, 60 * 5)
        }


        // preventing from running twice as google prefeches url on pasting on the searchbar
        const fetchMode = c.req.header("Sec-Purpose")
        // console.log(fetchMode);
        if (fetchMode !== "prefetch;prerender") {
            await Promise.all([
                redisClient.expire(`aliasAnalytics-${alias}`, 0),
                redisClient.expire(`overallAnalytics-${existingUrl.userId}`, 0),
                redisClient.expire(`topicAnalytics-${existingUrl.topic}-${existingUrl.userId}`, 0)
            ])
            const userAgent = c.req.header("User-Agent")
            const parser = new UAParser(userAgent)
            const result = parser.getResult()
            const deviceType = result.device.type || "Desktop";
            const clientIp = getConnInfo(c).remote.address || "192.0.0." + Math.ceil(Math.random() * 10) // info is `ConnInfo`

            await prisma.analytics.create({
                data: {
                    clientIp,
                    device: deviceType,
                    os: result.os.name || "",
                    url: {
                        connect: {
                            id: existingUrl.id
                        }
                    },
                }

            })
        }

        return c.redirect(existingUrl.longUrl)

    }
    catch (e) {
        console.log(e);
        return c.json({}, 500)
    }


})


export default shortenApp;
