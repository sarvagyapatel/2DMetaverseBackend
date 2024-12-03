import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { createRoom, getAllRooms, joinRoom } from "../controller/room.controller";

const router = Router();

router.route('/createroom').post(
    verifyJWT,
    createRoom
)

router.route('/allrooms').get(
    getAllRooms
)

router.route('/joinroom').post(
    verifyJWT,
    joinRoom
)

export default router;