import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Company from "../models/company.model.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import mongoose from "mongoose";
import { uploadToImageKit, deleteFromImageKit } from "../utils/imageKit.js"
import { options } from "../constants.js";

const accessAndRefreshTokenGenrator = async (companyId) => {
    try {
        const company = await Company.findById(companyId)
        const accessToken = jwt.sign({
            _id : company._id,
            email : company.email,
            name : company.name,
        },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn : process.env.ACCESS_TOKEN_EXPIRY
            }
        )
        const refreshToken = jwt.sign({
            _id : company._id,
            email : company.email,
        },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn : process.env.REFRESH_TOKEN_EXPIRY
            }
        )

        company.refreshToken = refreshToken
        await company.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong")
    }
}

const registerCompany = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email, and password are required");
    }

    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
        throw new ApiError(400, "Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const company = await Company.create({
        name,
        email,
        password: hashedPassword
    })
    if (!company) {
        throw new ApiError(500, "Failed to register company");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, null, "Company registered successfully")
        )
});

const loginCompany = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const company = await Company.findOne({ email });
    if (!company) {
        throw new ApiError(400, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, company.password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await accessAndRefreshTokenGenrator(company._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken
            }, "Company logged in successfully")
        )

})

const logoutCompany = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    if (!companyId) {
        throw new ApiError(401, "Unauthorized");
    }

    const company = await Company.findById(companyId);
    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    company.refreshToken = null;
    await company.save({ validateBeforeSave: false });

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, null, "Company logged out successfully")
        )

});

const currentCompany = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    if (!companyId) {
        throw new ApiError(401, "Unauthorized");
    }

    const company = await Company.findById(companyId).select("-password -refreshToken");
    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, company, "Current company retrieved successfully")
        )
});

const updateCompanyDetails = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    const {name, description, location, website, industry, size} = req.body;

    if (!companyId) {
        throw new ApiError(401, "Unauthorized");
    }
    if(!name && !description && !location && !website && !industry && !size) {
        throw new ApiError(400, "At least one field is required to update")
    }
    if(industry && !["Technology", "Finance", "Healthcare", "Education", "Retail", "Other"].includes(industry)) {
        throw new ApiError(400, "Invalid industry value")
    }
    if(size && !["1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"].includes(size)) {
        throw new ApiError(400, "Invalid size value")
    }

    const company = await Company.findByIdAndUpdate(companyId, {
        name,
        description,
        location,
        website,
        industry,
        size
    }, { new: true, runValidators: true }).select("-password -refreshToken");

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, company, "Company details updated successfully")
        )
})

export {
    registerCompany,
    loginCompany,
    logoutCompany,
    currentCompany,
    updateCompanyDetails
}