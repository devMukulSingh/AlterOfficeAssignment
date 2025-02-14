import { Hono } from "hono";
import { prisma } from "../lib/constants.js";
import { format } from "date-fns"


const analyticsApp = new Hono();

analyticsApp.get("/:userId/:alias", async (c) => {

    const { alias, userId } = c.req.param()
    const analyticsData = await prisma.analytics.findMany({
        where: {
            url: {
                customAlias: alias,
                userId
            },

        },
    })
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7).toString();

    const osType = [];
    const deviceType = [];
    const clicksByDate = [];
    const dateMap = new Map<string, number>(null)

    for (let data of analyticsData) {
        if (data.createdAt > sevenDaysAgo) {
            const date = format(data.createdAt, "dd MM yyyy")
            if (dateMap.has(date)) {
                dateMap.set(date, (dateMap.get(date) || 0) + 1);
                continue;
            }
            dateMap.set(date, 1)
        }
    }
    for (const [key, value] of dateMap) {
        clicksByDate.push({
            date: key,
            clicks: value
        })
    }
    // console.log(Array.from(dateMap.));
    // const a = analyticsData.filter( data => data.createdAt > sevenDaysAgo);

    const uniqueUsers = new Map(analyticsData.map(o => [o.clientIp, o.id]))
    //if the same user is accessing from different Os, then to it will be taken into account
    const uniqueOs = analyticsData.filter((data, index, self) => index === self.findIndex(d => d.clientIp === data.clientIp && d.os === data.os))
    const uniquesDevice = analyticsData.filter((data, index, self) => index === self.findIndex(d => d.clientIp === data.clientIp && d.device === data.device))

    const osMap = new Map<string, { uniqueClicks: number }>(null)
    for (let user of uniqueOs) {
        if (osMap.has(user.os)) {
            osMap.set(user.os, {
                uniqueClicks: (osMap.get(user.os)?.uniqueClicks || 0) + 1,
                // uniqueUser: 0
            })
            continue;
        }
        osMap.set(user.os, { uniqueClicks: 1 })
    }

    const deviceMap = new Map<string, { uniqueClicks: number }>(null)
    for (let user of uniquesDevice) {
        if (deviceMap.has(user.device)) {
            deviceMap.set(user.device, {
                uniqueClicks: (deviceMap.get(user.device)?.uniqueClicks || 0) + 1,
                // uniqueUser: 0
            })
            continue;
        }
        deviceMap.set(user.device, { uniqueClicks: 1 })
    }
    for (const [key, value] of osMap.entries()) {
        osType.push({
            osName: key,
            uniqueClicks: value.uniqueClicks,
            uniqueUser: uniqueUsers.size
        })
    }
    for (const [key, value] of deviceMap.entries()) {
        deviceType.push({
            deviceName: key,
            uniqueClicks: value.uniqueClicks,
            uniqueUser: uniqueUsers.size
        })
    }


    return c.json({
        osType,
        deviceType,
        totalClicks: analyticsData.length,
        analyticsData,
        clicksByDate
    }, 200)
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
        include:{
            analytics:true  
        },
        orderBy:{
            createdAt:"asc"
        }
    })
    const urls = []
    const clicksByDate = [];
    const dateMap = new Map<string,number>(null)
    const totalClicks = urlsArray.reduce( (prev,curr) => prev + curr.analytics.length  ,0)
    const analytics = urlsArray.flatMap(url => url.analytics)
    const uniqueUsers = new Map(analytics.map( ana => [ana.clientIp,ana.id])).size

    for (let analytic of analytics){
        const date = format(analytic.createdAt,"dd-MM-yyyy")
         if(dateMap.has(date)){
            dateMap.set(date, (dateMap.get(date)|| 0) + 1)
            continue
         }
         dateMap.set(date,1);
    }
    for (const [key, value] of dateMap.entries()){
        clicksByDate.push({
            date:key,
            clicks:value
        })
    }

    for (let url of urlsArray){

        const uniqueUsers = new Map( url.analytics.map( ana => [ana.clientIp,ana.id])).size

        urls.push({
            shortUrl:url.shortUrl,
            totalClicks : url.analytics.length,
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



export default analyticsApp;