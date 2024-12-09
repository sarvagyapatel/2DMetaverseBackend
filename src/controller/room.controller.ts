import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const createRoom = async (req: any, res: any) => {
    const { roomName, accessKey } = req.body;
    const user = req.user;
    try {
        if (!roomName || !accessKey) {
            throw new Error("roomName or accessKey empty");
        }

        const room = await client.room.create({
            data: {
                roomName,
                accessKey,
                users: {
                    connect: [
                        { id: user.id }
                    ],
                },
            }
        })
        if (!room) {
            throw new Error("Something went wront while creating room");
        }

        const updatedUser = await client.user.update({
            where: {
                id: user.id
            },
            data: {
                roomId: room.id
            }
        })
        return res.status(200).json({ roomData: room, updatedUserData: updatedUser })
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

const getAllRooms = async (req: any, res: any) => {
    try {
        const allRooms = await client.room.findMany();
        if (!allRooms) throw new Error("Something went wrong");

        return res.status(200).json(allRooms);
    } catch (error) {
        return res.status(500).json(error)
    }
}

const joinRoom = async (req: any, res: any) => {
    const { roomName, accessKey } = req.body;
    const user = req.user;
    try {
        if(!user){
            throw new Error("Unauthorized access");
        }
        if (!roomName || !accessKey) {
            throw new Error("roomName or accessKey empty");
        }

        const room = await client.room.findFirst({
            where: {
                roomName: roomName
            }
        })

        if (!room) {
            throw new Error("Something went wront while creating room");
        }

        const updatedRoom = await client.room.update({
            where: {
                id: room.id
            },
            data: {
                users: {
                    connect: [
                        { id: user.id }
                    ],
                },
            }
        })

        const updatedUser = await client.user.update({
            where: {
                id: user.id
            },
            data: {
                roomId: updatedRoom.id
            }
        })

        return res.status(200).json({ roomData: updatedRoom, updatedUserData: updatedUser })
    } catch (error) {
        return res.status(500).json(error)
    }
}

export { createRoom, getAllRooms, joinRoom }