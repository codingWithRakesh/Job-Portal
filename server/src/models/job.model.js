import { Schema, model } from "mongoose";

const qualificationSchema = new Schema({
    degree: {
        type: String,
        required: true,
        trim: true
    }
});

const experienceSchema = new Schema({
    min: {
        type: Number,
        required: true
    },
    max: {
        type: Number,
        required: true
    }
});

const jobSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    location: [{
        type: String,
        required: true,
        trim: true
    }],
    salaryRange: {
        type: String,
        trim: true
    },
    jobType: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract", "Internship"],
        required: true,
        trim: true
    },
    qualifications: [qualificationSchema],
    experiences: experienceSchema,
    applicationDeadline: {
        type: Date,
        required: true
    },
    workMode: {
        type: String,
        enum: ["On-site", "Remote", "Hybrid"],
        required: true,
        trim: true
    },
    requiredSkills: {
        type: [String],
        trim: true
    },
    ageLimit: {
        type: Number,
        trim: true
    },
    vacancies: {
        type: Number,
        required: true
    }

}, { timestamps: true });

const Job = model("Job", jobSchema);

export default Job;