import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

type User = {
    id: number,
    email: string,
    username: string,
    password: string
}

const client = new PrismaClient();
const verifyJWT = async (req: any, res: any, next: any) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) return res.status(401).json({ message: "Unauthorized Access" });
        if (!process.env.ACCESS_TOKEN_SECRET) return;
        const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as User;
        console.log(decodedtoken)
        const user = await client.user.findFirst({
            where: {
                id: decodedtoken.id
            }
        })

        if (!user) {
            throw new Error("Invalid Token")
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json(error)
    }
}

export { verifyJWT }