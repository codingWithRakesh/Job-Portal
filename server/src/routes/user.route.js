import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    currentUser,
    updateDetails,
    updateAddress,
    updateQualifications,
    updateExperience,
    updateSkills,
    updateProjects,
    uploadAndUpdateProfilePicture,
    deleteProfilePicture,
    uploadAndUpdateResume,
    deleteResume,
    isprofileCompleteInPercentage,
    deleteSubDocument
} from "../controllers/user.controller.js";
import { verifyUser } from "../middlewares/oauth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyUser, logoutUser);
router.route("/current").get(verifyUser, currentUser);
router.route("/update-details").put(verifyUser, updateDetails);
router.route("/update-address").put(verifyUser, updateAddress);
router.route("/update-qualifications").put(verifyUser, updateQualifications);
router.route("/update-experience").put(verifyUser, updateExperience);
router.route("/update-skills").put(verifyUser, updateSkills);
router.route("/update-projects").put(verifyUser, updateProjects);
router.route("/upload-profile-picture").post(verifyUser, upload.single("profilePicture"), uploadAndUpdateProfilePicture);
router.route("/delete-profile-picture").delete(verifyUser, deleteProfilePicture);
router.route("/upload-resume").post(verifyUser, upload.single("resume"), uploadAndUpdateResume);
router.route("/delete-resume").delete(verifyUser, deleteResume);
router.route("/profile-completion").get(verifyUser, isprofileCompleteInPercentage);
router.route("/delete-subdocument").delete(verifyUser, deleteSubDocument);

export default router;