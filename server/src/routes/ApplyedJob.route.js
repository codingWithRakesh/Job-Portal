import { Router } from "express";
import {
    applyForJob,
    findAppliedJobsForUser,
    findUsersByAlgorithm,
    updateApplicationStatus
} from "../controllers/ApplyedJob.controller.js";
import { verifyUser } from "../middlewares/oauth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route("/apply/:jobId").get(verifyUser, applyForJob);
router.route("/my-applications").get(verifyUser, findAppliedJobsForUser);
router.route("/applicants/:jobId").get(verifyAdmin, findUsersByAlgorithm);
router.route("/update-status/:applicationId").put(verifyAdmin, updateApplicationStatus);

export default router;