import { BASE_URL_SERVER } from '../lib/constants.js'
import shortenApp from '../routes/shorten.js'

const userId = "67adf44bff5fbcade699ed57"
const alias = `think20359`
const userIdDoesntExists = `67adf44bff5fbcade699ed51`
const invalidUserId = "2323asdsv"

const shortUrlAleradyExistsReqBody = {
    longUrl: "https://google.com",
    alias: "coolboy69",
    topic: "core"
}
const aliasAleradyExistsReqBody = {
    longUrl: "https://gemini.com",
    alias: "think20359",
    topic: "core"
}
const newShortUrlReqBody = {
    longUrl: `https://google${Date.now().toString().slice(-2)}.com`,
    alias: `customAlias`,
    topic: "core"
}

describe('create short url', () => {

    test('given the user with userId does not exists', async () => {
        const res = await shortenApp.request(`/create-shortUrl/${userIdDoesntExists}`,{
            method:"POST",
            body: JSON.stringify(shortUrlAleradyExistsReqBody),
            headers:{"Content-Type":"application/json"}
        });
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, user not found"
        })
    })
    test('given the userId is invalid mongoDb id', async () => {
        const res = await shortenApp.request(`/create-shortUrl/${invalidUserId}`,{
            method: "POST",
            body: JSON.stringify(shortUrlAleradyExistsReqBody),
            headers: {"Content-Type":"application/json" }
        });
        expect(res.status).toBe(403)
        expect(await res.json()).toEqual({
            error: "Unauthenticated, invalid userId"
        })
    })
    test('given the alias provided by the user already exists', async () => {
        const res = await shortenApp.request(`/create-shortUrl/${userId}`, {
            method: "POST",
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(aliasAleradyExistsReqBody),
        })
        expect(res.status).toBe(409)
        expect(await res.json()).toEqual({
            error: "Alias already exists, try another"
        })
    })

    test('given the url user trying to shorten already exists', async () => {
        const res = await shortenApp.request(`/create-shortUrl/${userId}`, {
            method: "POST",
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(shortUrlAleradyExistsReqBody),
        })
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({
            msg: "Url Already exists",
            shortUrl: `${BASE_URL_SERVER}/api/shorten/${alias}`
        })
    })
    test('given the user with the given userId exists and the longUrl and alias doesnt already exists', async () => {
        const res = await shortenApp.request(`/create-shortUrl/${userId}`, {
            method: "POST",
            headers: new Headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(newShortUrlReqBody),
        })
        expect(res.status).toBe(201)
        expect(await res.json()).toEqual({
            msg: "Url generated successfully",
            shortUrl: expect.stringContaining(`${BASE_URL_SERVER}/api/shorten/${newShortUrlReqBody.alias}`)
        })
    })
})

// describe('redirect to main url', () => {
//     test('given the short url user is trying to access does not exists', async () => {
//         const res = await shortenApp.request('/somethingDoesntExists');
//         expect(res.status).toBe(404);
//         expect(await res.json()).toEqual({
//             error: "Not found",
//         })
//     })
//     test('given the short url user is trying to access exists', async () => {
//         const res = await shortenApp.request(`/${alias}`);
//         expect(res.status).toBe(302);
//     })

//     // test('given the user hit the rate limit', async () => {
//     //     const res = await shortenApp.request('/think20359');
//     //     expect(res.status).toBe(429);
//     //     expect(await res.json()).toEqual({
//     //         error: "Too many requests"
//     //     })
//     // })
//     // test('given not able to get client Ip to check rate limiting', async () => {
//     //     const res = await shortenApp.request('/think20359');
//     //     expect(res.status).toBe(400);
//     //     expect(await res.json()).toEqual({
//     //         error: "Cannot get client IP"
//     //     })
//     // })
// })


