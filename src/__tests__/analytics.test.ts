import analyticsApp from "../routes/analytics.js";

const userId = "67adf44bff5fbcade699ed57"
const alias = `commission97073`
const topic = `topic1`
const userIdDoesntExists = `67adf44bff5fbcade699ed51`
const invalidUserId = "2323asdsv"
const invalidTopic = 'invalidTopic'
const invalidAlias = 'invalidAlias'

describe('get particular alias analytics', () => {
    test('given the userId and the alias exists', async () => {
        const res = await analyticsApp.request(`/${userId}/alias/${alias}`);
        expect(res.status).toBe(200)

        expect(await res.json()).toEqual({
            osType: expect.arrayContaining([{
                osName: expect.any(String),
                uniqueClicks: expect.any(Number),
                uniqueUsers: expect.any(Number)
            }]),
            deviceType: expect.arrayContaining([{
                deviceName: expect.any(String),
                uniqueClicks: expect.any(Number),
                uniqueUsers: expect.any(Number),
            }]),
            totalClicks: expect.any(Number),
            uniqueUsers: expect.any(Number),
            clicksByDate: expect.arrayContaining([{
                clicks: expect.any(Number),
                date: expect.any(String),
            }]),
        })
    })
    test('given the user with userId does not exists', async () => {
        const res = await analyticsApp.request(`/${userIdDoesntExists}/alias/${alias}`);
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, user not found"
        })
    })
    test('given the userId is invalid mongoDb id', async () => {
        const res = await analyticsApp.request(`/${invalidUserId}/alias/${alias}`);
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, invalid userId"
        })
    })
    test('given the alias doesnt exists', async () => {
        const res = await analyticsApp.request(`/${userId}/alias/${invalidAlias}`);
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({
            totalClicks: 0,
            uniqueUsers: 0,
            clicksByDate: [],
            osType: [],
            deviceType: [],

        })
    })

})

describe('get topic analytics', () => {
    test('given the topic and userId exists', async () => {
        const res = await analyticsApp.request(`/${userId}/topic/${topic}`);
        expect(res.status).toBe(200)

        expect(await res.json()).toEqual({
            totalClicks: expect.any(Number),
            uniqueUsers: expect.any(Number),
            clicksByDate: expect.arrayContaining([{
                clicks: expect.any(Number),
                date: expect.any(String),
            }]),
            urls: expect.arrayContaining([{
                shortUrl: expect.any(String),
                totalClicks: expect.any(Number),
                uniqueUsers: expect.any(Number),
            }])
        })
    })
    test('given the user with userId does not exists', async () => {
        const res = await analyticsApp.request(`/${userIdDoesntExists}/alias/${alias}`);
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, user not found"
        })
    })
    test('given the userId is invalid mongoDb id', async () => {
        const res = await analyticsApp.request(`/${invalidUserId}/alias/${alias}`);
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, invalid userId"
        })
    })
    test('given the topic doesnt exists', async () => {
        const res = await analyticsApp.request(`/${userId}/topic/${invalidTopic}`);
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({
            totalClicks: 0,
            uniqueUsers: 0,
            clicksByDate: [],
            urls: []
        })
    })
})

describe('get overall analytics', () => { 
    test('given the user with the given userId exists', async () => {
        const res = await analyticsApp.request(`/${userId}/overall`);
        expect(res.status).toBe(200);

        expect(await res.json()).toEqual({
            // computedAnalytics: {
                osType: expect.arrayContaining([{
                    osName: expect.any(String),
                    uniqueClicks: expect.any(Number),
                    uniqueUsers: expect.any(Number)
                }]),
                deviceType: expect.arrayContaining([{
                    deviceName: expect.any(String),
                    uniqueClicks: expect.any(Number),
                    uniqueUsers: expect.any(Number),
                }]),
                totalClicks: expect.any(Number),
                uniqueUsers: expect.any(Number),
                clicksByDate: expect.arrayContaining([{
                    clicks: expect.any(Number),
                    date: expect.any(String),
                }]),
                totalUrls: expect.any(Number),

        })

    })
    test('given the user with userId does not exists', async () => {
        const res = await analyticsApp.request(`/${userIdDoesntExists}/alias/${alias}`);
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, user not found"
        })
    })
    test('given the userId is invalid mongoDb id', async () => {
        const res = await analyticsApp.request(`/${invalidUserId}/alias/${alias}`);
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, invalid userId"
        })
    })

})