import { PrismaClient } from "@prisma/client";


export const prisma = new PrismaClient()


export const BASE_URL_SERVER = process.env.NODE_ENV === "production" ? "https://alterofficeassignment.onrender.com" :`http://localhost:3000`;