import { Hono } from "hono";
import { prisma } from "../lib/constants.js";
import { getClicksByDate, getClicksByDateLast7Days, getDeviceTypeArray, getOsTypeArray } from "../lib/helpers.js";
import { redisClient } from "../lib/redisClient.js";
import { validateUser } from "../middleware/validateUser.js";

const analyticsApp = new Hono();

analyticsApp.use("/:userId/*", validateUser)

analyticsApp.get("/:userId/alias/:alias", async (c) => {

    const { alias, userId } = c.req.param()

    let computedAnalytics = JSON.parse(await redisClient.get(`aliasAnalytics-${alias}`) || "null")

    if (computedAnalytics) return c.json(computedAnalytics, 200)

    try {
        const analyticsData = await prisma.analytics.findMany({
            where: {
                url: {
                    customAlias: alias,
                    userId
                },
            },
        })
        const uniqueUsers = new Map(analyticsData.map(ana => [ana.clientIp, ana.id])).size
        const clicksByDate = getClicksByDateLast7Days(analyticsData)
        const osType = getOsTypeArray(analyticsData)
        const deviceType = getDeviceTypeArray(analyticsData)
        computedAnalytics = {
            osType,
            deviceType,
            totalClicks: analyticsData.length,
            clicksByDate,
            uniqueUsers
        }
        await redisClient.set(`aliasAnalytics-${alias}`, JSON.stringify(computedAnalytics))
        await redisClient.expire(`aliasAnalytics-${alias}`, 60 * 5)
        return c.json(computedAnalytics, 200)
    }

    catch (e:any) {
        console.log(e.message);
        return c.json({
            error: "Internal server error" + e.message
        }, 500)
    }
})

analyticsApp.get("/:userId/topic/:topic", async (c) => {

    const { topic, userId } = c.req.param();

    try {
        const urlsArray = await prisma.url.findMany({
            where: {
                topic,
                userId
            },
            include: {
                analytics: true
            },
            orderBy: {
                createdAt: "asc"
            }
        })
        if (urlsArray.length === 0) return c.json({
            totalClicks: 0,
            uniqueUsers: 0,
            clicksByDate: [],
            urls: []
        }, 200)

        //redis cache
        let computedAnalytics = JSON.parse(await redisClient.get(`topicAnalytics-${topic}-${userId}`) || "null")
        console.log({ computedAnalytics });
        if (computedAnalytics) return c.json(computedAnalytics, 200)

        const totalClicks = urlsArray.reduce((prev, curr) => prev + curr.analytics.length, 0)
        const analyticsData = urlsArray.flatMap(url => url.analytics)
        const uniqueUsers = new Map(analyticsData.map(ana => [ana.clientIp, ana.id])).size
        const clicksByDate = getClicksByDate(analyticsData)
        const urls = []
        for (let url of urlsArray) {
            const uniqueUsers = new Map(url.analytics.map(ana => [ana.clientIp, ana.id])).size
            urls.push({
                shortUrl: url.shortUrl,
                totalClicks: url.analytics.length,
                uniqueUsers
            })
        }
        computedAnalytics = {
            totalClicks,
            uniqueUsers,
            clicksByDate,
            urls
        }
        await redisClient.set(`topicAnalytics-${topic}-${userId}`, JSON.stringify(computedAnalytics))
        await redisClient.expire(`topicAnalytics-${topic}-${userId}`, 60 * 5)

        return c.json(computedAnalytics, 200)

    }
    catch (e: any) {
        console.log(e);
        return c.json({
            error: "Inernal server error" + e
        }, 500)
    }
})

analyticsApp.get("/:userId/overall", async (c) => {

    const { userId } = c.req.param();

    try {
        const urlsArray = await prisma.url.findMany({
            where: {
                userId
            },
            include: {
                analytics: true,
            }
        })
        const analyticsData = urlsArray.flatMap(url => url.analytics);

        //redis cache
        let computedAnalytics = JSON.parse(await redisClient.get(`overallAnalytics-${userId}`) || "null");
        if (computedAnalytics) return c.json(computedAnalytics, 200)

        const uniqueUsers = new Map(analyticsData.map(ana => [ana.clientIp, ana.id])).size
        const osTypeArray = getOsTypeArray(analyticsData)
        const deviceTypeArray = getDeviceTypeArray(analyticsData);
        const clicksByDate = getClicksByDate(analyticsData)
        computedAnalytics = {
            totalUrls: urlsArray.length,
            totalClicks: analyticsData.length,
            osType: osTypeArray,
            deviceType: deviceTypeArray,
            clicksByDate,
            uniqueUsers
        }
        await redisClient.set(`overallAnalytics-${userId}`, JSON.stringify(computedAnalytics))
        await redisClient.expire(`overallAnalytics-${userId}`, 60 * 5)

        return c.json(computedAnalytics, 200)
    }
    catch (e: any) {
        console.log(e.message);
        return c.json({
            error: "Internal server error" + e.message
        }, 500)
    }
})

export default analyticsApp;