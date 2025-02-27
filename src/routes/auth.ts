import axios, { type AxiosResponse } from "axios";
import { Hono } from "hono";
import { BASE_URL_SERVER, prisma } from "../lib/constants.js";

const authApp = new Hono();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `${BASE_URL_SERVER}/auth/google/callback`;

type TProfile = {
    name: string,
    email: string,
    id: string,
    picture: string,
    profile: string
}

authApp.get('/google-auth', (c) => {
    try {
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email`;
        return c.redirect(url);
    }
    catch (e) {
        console.log(e);
        return c.json({
            error: "Internal server error"
        }, 500)
    }
})

authApp.get('/google/callback', async (c) => {

    const { code } = c.req.query();

    try {
        // Exchange authorization code for access token
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        });
        const { access_token } = data

        // Use access_token or id_token to fetch user profile
        const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const { email, name } = profile as TProfile

        try {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email
                }
            })
            if (existingUser) return c.redirect(`/${existingUser.id}`)
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name,
                }
            })
            return c.redirect(`/${newUser.id}`)
        }
        catch (e: any) {
            console.log(e.message);
            return c.json({
                error: "Internal server error"
            }, 500)
        }
    } catch (error: any) {
        console.log('Error:', error.response.data.error);
    }
});

export default authApp;