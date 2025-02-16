import type { Context, Next } from "hono"
import { prisma } from "../lib/constants.js"
import { Prisma } from "@prisma/client"

export async function validateUser(c: Context, next:Next) {
    const { userId } = c.req.param()
    try {

        // more validation here .eg - token auth
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
    catch (e:any) {
        console.log(e.message)
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2023") {
                return c.json({
                    error: "Unauthenticated, invalid userId"
                }, 403)
            }
        }
    }
}