import { Hono } from "hono";
import { prisma } from "../lib/constants.js";
import { format } from "date-fns"
import type { Analytics } from "@prisma/client";
import { getClicksByDate, getClicksByDateLast7Days, getDeviceTypeArray, getOsTypeArray } from "../lib/helpers.js";
import { redisClient } from "../lib/redisClient.js";

const analyticsApp = new Hono();


analyticsApp.get("/:userId/alias/:alias", async (c) => {

    const { alias, userId } = c.req.param()
    const exisitingUser = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })
    if (!exisitingUser) {
        return c.json({
            error: "Unauthenticated, user not found"
        }, 403)
    }
    let computedAnalytics = JSON.parse(await redisClient.get(`aliasAnalytics-${alias}`) || "null")


    if (computedAnalytics) return c.json(computedAnalytics, 200)

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
    await redisClient.expire(`aliasAnalytics-${alias}`, 60 *5 )


    return c.json(computedAnalytics, 200)
})

analyticsApp.get("/:userId/topic/:topic", async (c) => {

    const { topic, userId } = c.req.param();

    const isUserExists = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })
    if (!isUserExists) {
        return c.json({
            error: "Unauthenticated, user not found"
        }, 403)
    }

    const urlsArray = await prisma.url.findMany({
        where: {
            topic
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
    return c.json({
        totalClicks,
        uniqueUsers,
        clicksByDate,
        urls
    }, 200)
})

analyticsApp.get("/:userId/overall", async (c) => {

    const { userId } = c.req.param();

    const isUserExists = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })
    if (!isUserExists) return c.json({
        error: "Unauthenticated, user not found"
    }, 403)

    const urlsArray = await prisma.url.findMany({
        where: {
            userId
        },
        include: {
            analytics: true,
        }
    })

    const analyticsData = urlsArray.flatMap(url => url.analytics);

    const uniqueUsers = new Map(analyticsData.map(ana => [ana.clientIp, ana.id])).size
    const osTypeArray = getOsTypeArray(analyticsData)
    const deviceTypeArray = getDeviceTypeArray(analyticsData);
    const clicksByDate = getClicksByDate(analyticsData)

    return c.json({
        totalUrls: urlsArray.length,
        totalClicks: analyticsData.length,
        osType: osTypeArray,
        deviceType: deviceTypeArray,
        clicksByDate,
        uniqueUsers
    }, 200)
})

export default analyticsApp;