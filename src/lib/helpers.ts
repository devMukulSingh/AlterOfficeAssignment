import { Prisma, type Analytics } from "@prisma/client";
import { format } from "date-fns";
import type { Context } from "hono";
import namor from "namor"
import { prisma } from "./constants.js";

export function getClicksByDateLast7Days(analyticsData: Analytics[]) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7).toString();
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
    return Array.from(dateMap.entries()).map(([date, clicks]) => ({ date, clicks }))
}
export function getClicksByDate(analyticsData: Analytics[]) {
    const dateMap = new Map<string, number>(null)
    for (let analytic of analyticsData) {
        const date = format(analytic.createdAt, "dd-MM-yyyy")
        if (dateMap.has(date)) {
            dateMap.set(date, (dateMap.get(date) || 0) + 1)
            continue
        }
        dateMap.set(date, 1);
    }

    return Array.from(dateMap.entries()).map(([date, clicks]) => ({ date, clicks }))

}

export function getOsTypeArray(analyticsData: Analytics[]) {
    const uniqueOperatingSystems = new Map(analyticsData.map(ana => [ana.clientIp + ana.os, ana.os])) // removing duplicates
    const countMap = new Map<string, number>(null);
    //counting unique clicks
    for (const os of uniqueOperatingSystems.values()) {
        countMap.set(os, (countMap.get(os) || 0) + 1)
    }
    const osTypeArray = Array.from(countMap.entries()).map(([os, uniqueUsers]) => ({ os, uniqueUsers, uniqueClicks: uniqueUsers }))
    return osTypeArray;
}

export function getDeviceTypeArray(analyticsData: Analytics[]) {
    const uniqueDevices = new Map(analyticsData.map(ana => [ana.clientIp + ana.device, ana.device])) // removing duplicates
    const countMap = new Map<string, number>(null);
    //counting unique clicks
    for (const deviceType of uniqueDevices.values()) {
        countMap.set(deviceType, (countMap.get(deviceType) || 0) + 1)
    }
    const deviceTypeArray = Array.from(countMap.entries()).map(([deviceName, uniqueUsers]) => ({ deviceName, uniqueClicks: uniqueUsers, uniqueUsers }))
    return deviceTypeArray;
}

export function generateRandomAlias() {
    const alias = namor.default.generate({ words: 1 });
    return alias;
}

