import { Router } from "express";
import {
    createJob,
    deleteJob,
    getCompanyJobs,
    getAllJobsByAlgorithm
} from "../controllers/job.controller.js";
import { verifyUser } from "../middlewares/oauth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route("/all").get(verifyUser, getAllJobsByAlgorithm);
router.route("/company").get(verifyAdmin, getCompanyJobs);
router.route("/add").post(verifyAdmin, createJob);
router.route("/delete/:jobId").delete(verifyAdmin, deleteJob);

export default router;