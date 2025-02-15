import { z } from "zod";


export const urlSchema = z.object({
    longUrl:z.string({
        required_error:"longUrl is required"
    }).trim().min(1,{
        message:"longUrl is required"
    }).max(200,{
        message:"max 200 characters allowed"
    }),
    alias: z.string().trim().max(200, {
        message: "max 200 characters allowed"
    }).optional(),
    topic: z.string().trim().max(200, {
        message: "max 100 characters allowed"
    }).optional(),
})