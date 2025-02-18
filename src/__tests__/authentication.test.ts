import authApp from "../routes/auth.js"


describe('authentication flow start', () => {
    test('GET /google-auth', async () => {
        const res = await authApp.request('/google-auth')
        expect(res.status).toBe(302)
    })
})
