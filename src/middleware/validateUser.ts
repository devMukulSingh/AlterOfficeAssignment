import type { Context, Next } from "hono"
import { prisma } from "../lib/constants.js"
import { ObjectId } from 'mongodb';


export async function validateUser(c: Context, next: Next) {
    const { userId } = c.req.param()

    try {
        // more validation here .eg - token auth
        if (!ObjectId.isValid(userId)) {
            return c.json({
                error: "Unauthenticated, invalid userId"
            }, 403)
        }
        const isUserExists = await prisma.user.findFirst({
            where: {
                id: userId
            }
        })
        if (!isUserExists) return c.json({
            error: "Unauthenticated, user not found"
        }, 403)
        await next()
    }
    catch (e: any) {
        console.log(e.message)
    }
}