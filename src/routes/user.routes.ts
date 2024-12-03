import { Router } from "express";
import { getCurrentUser, login, logout, register, updateUser } from "../controller/user.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.route('/register').post(
    register
)

router.route('/login').post(
    login
)

router.route('/logout').get(
    verifyJWT,
    logout
)

router.route('/currentuser').get(
    verifyJWT,
    getCurrentUser
)

router.route('/updateuser').post(
    verifyJWT,
    updateUser
)

export default router