import { Schema, model } from "mongoose";

const companySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    industry: {
        type: String,
        enum: ["Technology", "Finance", "Healthcare", "Education", "Retail", "Other"],
        trim: true
    },
    size: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001+"],
        trim: true
    },
    logo: {
        url: {
            type: String,
            trim: true
        },
        fileId: {
            type: String,
            trim: true
        }
    }
}, { timestamps: true });

const Company = model("Company", companySchema);

export default Company;