import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();
const options = {
   httpOnly: true,
   secure: true,
};


const generateAccessAndRefreshToken = async (user: any) => {

   if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) return {};

   const accessToken = jwt.sign(
      {
         id: user.id,
         email: user.email,
         username: user.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
   );

   const refreshToken = jwt.sign(
      {
         id: user.id
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
   )

   return { accessToken, refreshToken };
}

const register = async (req: any, res: any) => {
   const { username, email, password } = req.body;
   try {
      if (!username || !email || !password) {
         throw new Error("username , password or email is empty")
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await client.user.create({
         data: {
            username,
            email,
            password: passwordHash
         }
      })

      if (!newUser) {
         throw new Error("User Already exist")
      }

      return res.status(200).json({
         newUser
      })
   } catch (error) {
      return res.status(400).json({
         error
      })
   }
}

const login = async (req: any, res: any) => {
   const { email, password } = req.body;

   try {
      if (!email || !password) {
         throw new Error("password or email is empty")
      }

      const user = await client.user.findFirst({
         where: {
            email: email
         }
      })

      if (!user) {
         throw new Error("user does not exist")
      }

      if (! await bcrypt.compare(password, user.password)) {
         throw new Error("Incorrect password try again")
      }

      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);

      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", refreshToken, options)
         .json({ user, message: "user logged in" });

   } catch (error) {
      return res.status(404).json(error)
   }
}

const logout = async (req: any, res: any) => {
   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json("user loggedOut");
}

const updateUser = async (req: any, res: any) => {
   const { x_axis, y_axis } = req.body;
   const loggedUser = req.user;

   try {
      if (!loggedUser) {
         return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await client.user.findUnique({
         where: { id: loggedUser.id }, 
      });

      if (!user) {
         return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = await client.user.update({
         where: { id: user.id },
         data: {
            x_axis,
            y_axis,
         },
      });

      return res.status(200).json(updatedUser);
   } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Something went wrong" });
   }
};

const getCurrentUser = async (req: any, res: any) => {
   const user = req.user;
   try {
      if (!user) { throw new Error("Unauthorized access") }
      const currentUser = await client.user.findFirst({
         where: {
            id: user.id
         }
      });

      return res.status(200).json(currentUser);
   } catch (error) {
      return res.status(500).json(error);
   }
}


export { register, login, logout, getCurrentUser, updateUser }