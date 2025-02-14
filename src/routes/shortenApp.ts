import { Hono } from "hono";
import { urlSchema } from "../lib/schema.js";
import namor from "namor";
import { BASE_URL_SERVER, prisma } from "../lib/constants.js";
import { Prisma } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import { getConnInfo } from "hono/cloudflare-workers";


const shortenApp = new Hono();

function generateRandomAlias() {
    const alias = namor.default.generate({ words: 1 });
    return alias;
}


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

    const existingUser = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })

    if (!existingUser) {
        return c.json({
            error: "Unauthenticated, user not found"
        }, 403)
    }

    const existingUrl = await prisma.url.findFirst({
        where: {
            longUrl
        }
    })

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

    generatedAlias = generatedAlias + Date.now().toString().slice(8)
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

shortenApp.get('/:alias', async (c) => {

    //TODO had to add rate limiter
    const fetchMode = c.req.header("Sec-Purpose")
    console.log(fetchMode, "fetchMode");
    // preventing from runnin twice
    if (!fetchMode) {
        const { alias } = c.req.param()

        try {

            const existingUrl = await prisma.url.findFirst({
                where: {
                    customAlias: alias,
                }
            })

            if (!existingUrl) {
                return c.json({
                    error: "Not found",
                }, 404)
            }

            const userAgent = c.req.header("User-Agent")
            const parser = new UAParser(userAgent)
            const result = parser.getResult()

            const deviceType = result.device.type || "Desktop";
            const clientIp = getConnInfo(c).remote.address || "192.0.0." + Math.ceil(Math.random() * 10) // info is `ConnInfo`

            await prisma.analytics.create({
                data: {
                    clientIp,
                    device:deviceType,
                    os:result.os.name || "",
                    url: {
                        connect: {
                            id: existingUrl.id
                        }
                    },
                }

            })

            return c.redirect(existingUrl.longUrl)

        }
        catch (e) {
            console.log(e);
            return c.json({}, 500)
        }
    }
    return c.json({});

})


export default shortenApp;
