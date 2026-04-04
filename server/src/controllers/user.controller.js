import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageKit.js"
import { options } from "../constants.js";

const accessAndRefreshTokenGenrator = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = jwt.sign({
            _id : user._id,
            email : user.email,
            name : user.name,
        },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn : process.env.ACCESS_TOKEN_EXPIRY
            }
        )
        const refreshToken = jwt.sign({
            _id : user._id,
            email : user.email,
        },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn : process.env.REFRESH_TOKEN_EXPIRY
            }
        )

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, DOB, gender, password } = req.body;
    if (!name || !email || !DOB || !gender || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, "Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        DOB,
        gender,
        password: hashedPassword
    })

    if (!user) {
        throw new ApiError(500, "Failed to create user");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, null, "User registered successfully")
        )
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await accessAndRefreshTokenGenrator(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { loggedInUser, accessToken, refreshToken }, "User logged in successfully")
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(
            new ApiResponse(200, null, "User logged out successfully")
        )
});

const currentUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Current user fetched successfully")
        )
})

const updateDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {name,phoneNumber, DOB, gender, summary, category, languages, achievements} = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if(name){
        user.name = name;
    }


    if (phoneNumber) {
        if (!/^[0-9]{10}$/.test(phoneNumber)) {
            throw new ApiError(400, "Invalid phone number");
        }
        user.phoneNumber = phoneNumber;
    }

    if (DOB) {
        user.DOB = new Date(DOB);
    }

    if (gender) {
        if (!['Male', 'Female', 'Other'].includes(gender)) {
            throw new ApiError(400, "Invalid gender");
        }
        user.gender = gender;
    }

    if(summary){
        user.summary = summary;
    }

    if (category) {
        if (!['Fresher', 'Experienced'].includes(category)) {
            throw new ApiError(400, "Invalid category");
        }
        user.category = category;
    }

    if (languages && Array.isArray(languages)) {
        user.languages = languages;
    }

    if (achievements && Array.isArray(achievements)) {
        user.achievements = achievements;
    }

    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "User details updated successfully")
        )

})

const updateAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {street, city, state, zipCode, country} = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if(!street || !city || !state || !zipCode || !country) {
        throw new ApiError(400, "All address fields are required");
    }

    const updatedUser = await User.findByIdAndUpdate(userId, {
        address: {
            street,
            city,
            state,
            zip : zipCode,
            country
        }
    }, { returnDocument: 'after', runValidators: true }).select("-password -refreshToken");

    if(!updatedUser) {
        throw new ApiError(500, "Failed to update user address");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User address updated successfully")
        )
})

const updateQualifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {degree, department, institution, yearOfPassing} = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if(!degree || !department || !institution || !yearOfPassing) {
        throw new ApiError(400, "All qualification fields are required");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $push: {
                qualifications: {
                    degree,
                    department,
                    institution,
                    year: yearOfPassing
                }
            }
        },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");

    if(!updatedUser) {
        throw new ApiError(500, "Failed to update user qualifications");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User qualifications updated successfully")
        )

})

const updateExperience = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {company, position, startDate, endDate} = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if(!company || !position || !startDate || !endDate) {
        throw new ApiError(400, "All experience fields are required");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $push: {
                experiences: {
                    company,
                    position,
                    startDate,
                    endDate
                }
            }
        },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");

    if(!updatedUser) {
        throw new ApiError(500, "Failed to update user experience");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User experience updated successfully")
        )

})

const updateSkills = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {skills} = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if(!Array.isArray(skills) || skills.length === 0) {
        throw new ApiError(400, "Skills field is required");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { skills },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");

    if(!updatedUser) {
        throw new ApiError(500, "Failed to update user skills");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User skills updated successfully")
        )
})

const updateProjects = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {title, description, technologies, link} = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if(!title || !description || !link || !Array.isArray(technologies)) {
        throw new ApiError(400, "Title and description are required for projects");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $push: {
                projects: {
                    title,
                    description,
                    technologies,
                    link
                }
            }
        },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");

    if(!updatedUser) {
        throw new ApiError(500, "Failed to update user projects");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User projects updated successfully")
        )

})

const uploadAndUpdateProfilePicture = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    const { buffer, mimetype, originalname, size } = req.file;
    if (!buffer || !mimetype || !originalname || !size) {
        throw new ApiError(400, "Invalid file upload");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const fileName = originalname || `profile_${userId}_${Date.now()}`;

    const { url, fileId } = await uploadToImageKit(buffer, fileName);
    if (!url || !fileId) {
        throw new ApiError(500, "Failed to upload profile picture");
    }

    if (user.profilePicture?.fileId) {
        await deleteFromImageKit(user.profilePicture.fileId);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            profilePicture: {
                url,
                fileId
            }
        },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user profile picture");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User profile picture updated successfully")
        )
})

const deleteProfilePicture = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.profilePicture?.fileId) {
        await deleteFromImageKit(user.profilePicture.fileId);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: null },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");
    if (!updatedUser) {
        throw new ApiError(500, "Failed to delete user profile picture");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User profile picture deleted successfully")
        )
})

const uploadAndUpdateResume = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    const { buffer, mimetype, originalname, size } = req.file;
    if (!buffer || !mimetype || !originalname || !size) {
        throw new ApiError(400, "Invalid file upload");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const fileName = originalname || `resume_${userId}_${Date.now()}`;

    const { url, fileId } = await uploadToImageKit(buffer, fileName);
    if (!url || !fileId) {
        throw new ApiError(500, "Failed to upload resume");
    }
    if (user.resume?.fileId) {
        await deleteFromImageKit(user.resume.fileId);
    }
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            resume: {
                url,
                fileId
            }
        },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user resume");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User resume updated successfully")
        )
})

const deleteResume = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.resume?.fileId) {
        await deleteFromImageKit(user.resume.fileId);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { resume: null },
        { returnDocument: 'after', runValidators: true }
    ).select("-password -refreshToken");
    if (!updatedUser) {
        throw new ApiError(500, "Failed to delete user resume");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "User resume deleted successfully")
        )
})

const isprofileCompleteInPercentage = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    let totalPoints = 100;
    let earnedPoints = 0;

    // 1. Basic Info (name + email)
    if (user.name && user.email) {
        earnedPoints += 15;
    }

    // 2. Profile Picture
    if (user.profilePicture?.url) {
        earnedPoints += 5;
    }

    // 3. Address
    if (
        user.address &&
        user.address.street &&
        user.address.city &&
        user.address.state &&
        user.address.zip &&
        user.address.country
    ) {
        earnedPoints += 10;
    }

    // 4. DOB
    if (user.DOB) {
        earnedPoints += 5;
    }

    // 5. Summary
    if (user.summary && user.summary.trim().length > 0) {
        earnedPoints += 10;
    }

    // 6. Skills
    if (user.skills && user.skills.length > 0) {
        earnedPoints += 10;
    }

    // 7. Qualifications
    if (user.qualifications && user.qualifications.length > 0) {
        earnedPoints += 10;
    }

    // 8. Experience
    if (user.experiences && user.experiences.length > 0) {
        earnedPoints += 10;
    }

    // 9. Projects
    if (user.projects && user.projects.length > 0) {
        earnedPoints += 10;
    }

    // 10. Resume
    if (user.resume?.url) {
        earnedPoints += 5;
    }

    // 11. Languages
    if (user.languages && user.languages.length > 0) {
        earnedPoints += 5;
    }

    // 12. Achievements
    if (user.achievements && user.achievements.length > 0) {
        earnedPoints += 5;
    }

    // 13. Category
    if (user.category) {
        earnedPoints += 5;
    }

    const profileCompletePercentage = Math.round((earnedPoints / totalPoints) * 100);

    return res
        .status(200)
        .json(
            new ApiResponse(200, { profileCompletePercentage }, "User profile completeness percentage fetched successfully")
        )
})

export {
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
    isprofileCompleteInPercentage
}