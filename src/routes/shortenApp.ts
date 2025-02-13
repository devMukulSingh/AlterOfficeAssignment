import { Hono } from "hono";
import { urlSchema } from "../lib/schema.js";
import namor from "namor";
import { BASE_URL_SERVER, prisma } from "../lib/constants.js";
import { Prisma } from "@prisma/client";

const shortenApp = new Hono();

 function generateRandomAlias(){
    const alias = namor.default.generate({ words: 1 });
    return alias;
}


shortenApp.post('/:userId', async (c) => {

    const { userId } = c.req.param()
    const body = await c.req.json();
    const parsedBody = urlSchema.safeParse(body);
    if (!parsedBody.success) {
        return c.json({
            error: parsedBody.error.errors.map(err => err.message)
        }, 400)
    }
    const { longUrl, customAlias, topic } = parsedBody.data

    const existingUrl = await prisma.url.findFirst({
        where:{
            longUrl
        }
    })

    if (existingUrl){
        return c.json({
            msg:"Url Already exists",
            shortUrl: existingUrl.shortUrl
        },200)
    }

    let alias = customAlias;

    if (!customAlias || customAlias==="") {
        alias = generateRandomAlias()
    }

    alias = alias + Date.now().toString().slice(8)
    const shortUrl = `${BASE_URL_SERVER}/shorten/${alias}`
    
    try {
        await prisma.url.create({
            data: {
                customAlias: alias ,
                longUrl,
                shortUrl,
                topic,
                userId
            }
        })
        return c.json({
            msg: "Url generated successfully",
            shortUrl
        })
    }
    catch (e) {
        if(e instanceof Prisma.PrismaClientKnownRequestError){
            if(e.code === "P2002"){
                
                return c.json({
                    error:"Alias already exists, try another"
                },409)
            }
        }
        return c.json({
            error:"Internal server errror"
        },500)
    }
})


export default shortenApp;
