import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Company from "../models/company.model.js";
import jwt from "jsonwebtoken";

const verifyAdmin = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "Unauthorized")
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const company = await Company.findById(decoded?._id).select("-password -refreshToken");
    if (!company) {
        throw new ApiError(401, "Unauthorized")
    }

    req.company = company
    next()
})

export { verifyAdmin }