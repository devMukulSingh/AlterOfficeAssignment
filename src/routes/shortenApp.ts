import { Hono } from "hono";
import { urlSchema } from "../lib/schema.js";


const shortenApp = new Hono();


shortenApp.post('/',async(c) => {

    const body = await c.req.json();
    const parsedBody = urlSchema.safeParse(body);
    if(!parsedBody.success){
        return c.json({
            error:parsedBody.error.errors.map(err => err.message)
        },400)
    }

    
})


export default shortenApp;
