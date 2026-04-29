import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Job from "../models/job.model.js";
import AppliedJob from "../models/ApplyedJob.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

const createJob = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    const { title, description, location, salaryRange, jobType, qualifications, experiences, applicationDeadline, workMode, requiredSkills, ageLimit, vacancies } = req.body;

    if (!companyId) {
        throw new ApiError(400, "Unauthorized: Company not authenticated");
    }

    if (!title || !description || !location.length || !jobType || !applicationDeadline || !workMode || !vacancies || !requiredSkills.length || !qualifications.length || experiences?.min === undefined || experiences?.max === undefined || !salaryRange) {
        throw new ApiError(400, "Title, description, location, job type, application deadline, work mode, vacancies, required skills, qualifications, experiences and salary range are required");
    }

    if (!["Full-time", "Part-time", "Contract", "Internship"].includes(jobType)) {
        throw new ApiError(400, "Invalid job type");
    }

    if (!["On-site", "Remote", "Hybrid"].includes(workMode)) {
        throw new ApiError(400, "Invalid work mode");
    }

    const job = await Job.create({
        title,
        description,
        company: companyId,
        location,
        salaryRange,
        jobType,
        qualifications,
        experiences,
        applicationDeadline,
        workMode,
        requiredSkills,
        ageLimit,
        vacancies
    });

    if (!job) {
        throw new ApiError(500, "Failed to create job");
    }

    return res.status(201).json(new ApiResponse(201, job, "Job created successfully"));
});

const deleteJob = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    const { jobId } = req.params;
    if (!companyId) {
        throw new ApiError(400, "Unauthorized: Company not authenticated");
    }
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        throw new ApiError(400, "Invalid Job ID");
    }
    if (!jobId) {
        throw new ApiError(400, "Job ID is required");
    }

    const job = await Job.findOneAndDelete({ _id: jobId, company: companyId });
    if (!job) {
        throw new ApiError(404, "Job not found or you are not authorized to delete this job");
    }
    await AppliedJob.deleteMany({ job: jobId });

    return res.status(200).json(new ApiResponse(200, null, "Job deleted successfully"));
});

const getCompanyJobs = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    if (!companyId) {
        throw new ApiError(400, "Unauthorized: Company not authenticated");
    }

    const jobs = await Job.aggregate([
        {
            $match: { company: companyId }
        },
        {
            $lookup: {
                from: "appliedjobs",
                localField: "_id",
                foreignField: "job",
                as: "applications"
            }
        },
        {
            $addFields: {
                totalApplications: { $size: "$applications" }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, jobs, "Company jobs retrieved successfully"));
});

const getAllJobsByAlgorithm = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(400, "Unauthorized: User not authenticated");
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const today = new Date();

    const appliedJobs = await AppliedJob.find({ applicant: userId }).select("job");
    const appliedJobIds = appliedJobs.map(a => a.job);

    const jobs = await Job.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo },
                applicationDeadline: { $gte: today },
                _id: { $nin: appliedJobIds }
            }
        },
        {
            $lookup: {
                from: "companies",
                localField: "company",
                foreignField: "_id",
                as: "company"
            }
        },
        {
            $unwind: "$company"
        },
        {
            $project: {
                title: 1,
                description: 1,
                location: 1,
                salaryRange: 1,
                jobType: 1,
                qualifications: 1,
                experiences: 1,
                applicationDeadline: 1,
                workMode: 1,
                requiredSkills: 1,
                ageLimit: 1,
                vacancies: 1,
                createdAt: 1,
                "company._id": 1,
                "company.name": 1,
                "company.logo": 1
            }
        }
    ]);

    if (!jobs.length) {
        return res.status(200).json(
            new ApiResponse(200, [], "No jobs available at the moment")
        );
    }

    //new user
    const isNewUser =
        !user.skills?.length &&
        !user.qualifications?.length &&
        !user.experiences?.length &&
        !user.projects?.length &&
        !user.address?.city;

    if (isNewUser) {
        const sortedByDate = [...jobs].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        const rankedJobs = sortedByDate.map((job, index) => ({
            rank: index + 1,
            matchScore: 0,
            ...job
        }));
        return res.status(200).json(
            new ApiResponse(200, {
                totalJobs: rankedJobs.length,
                jobs: rankedJobs
            }, "Jobs fetched and ranked successfully")
        );
    }

    const userSkillsLower = (user.skills || []).map(s => s.toLowerCase());
    const userDegrees = (user.qualifications || []).map(q => q.degree.toLowerCase());
    const userCity = user.address?.city?.toLowerCase() || "";

    const userProjectTechs = (user.projects || [])
        .flatMap(p => (p.technologies || []).map(t => t.toLowerCase()));

    const userFullTechStack = [...new Set([...userSkillsLower, ...userProjectTechs])];

    let userTotalExpYears = 0;
    (user.experiences || []).forEach(exp => {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        userTotalExpYears += (end - start) / (1000 * 60 * 60 * 24 * 365);
    });
    userTotalExpYears = Math.round(userTotalExpYears * 10) / 10;

    const scoredJobs = jobs.map((job) => {
        let score = 0;
        const breakdown = {};

        // skills 40 points max
        if (job.requiredSkills?.length > 0) {
            const jobSkillsLower = job.requiredSkills.map(s => s.toLowerCase());
            const matchedSkills = jobSkillsLower.filter(s => userFullTechStack.includes(s));
            const skillScore = Math.round((matchedSkills.length / jobSkillsLower.length) * 40);
            score += skillScore;
            breakdown.skills = {
                required: jobSkillsLower.length,
                matched: matchedSkills.length,
                score: skillScore
            };
        }

        // experience 20 points max
        if (job.experiences?.min !== undefined && job.experiences?.max !== undefined) {
            const { min, max } = job.experiences;
            let expScore = 0;
            if (userTotalExpYears >= min && userTotalExpYears <= max) {
                expScore = 20;
            } else if (userTotalExpYears > max) {
                expScore = 15;
            } else if (userTotalExpYears > 0) {
                expScore = Math.round((userTotalExpYears / min) * 20);
            }
            score += expScore;
            breakdown.experience = {
                requiredMin: min,
                requiredMax: max,
                userHas: userTotalExpYears,
                score: expScore
            };
        }

        // qualifications 15 points max
        if (job.qualifications?.length > 0) {
            const jobDegrees = job.qualifications.map(q => q.degree.toLowerCase());
            const hasMatch = jobDegrees.some(d => userDegrees.includes(d));
            const qualScore = hasMatch ? 15 : 0;
            score += qualScore;
            breakdown.qualification = {
                required: jobDegrees,
                score: qualScore
            };
        }

        // location 15 points max
        if (job.location?.length > 0 && userCity) {
            const jobLocationsLower = job.location.map(l => l.toLowerCase());
            let locationScore = 0;
            if (jobLocationsLower.includes(userCity)) {
                locationScore = 15;
            } else if (job.workMode === "Remote") {
                locationScore = 10;
            } else if (jobLocationsLower.includes(user.address?.state?.toLowerCase())) {
                locationScore = 7;
            }
            score += locationScore;
            breakdown.location = {
                jobLocations: job.location,
                userCity,
                workMode: job.workMode,
                score: locationScore
            };
        }

        // projects 10 points max
        if (user.projects?.length > 0 && job.requiredSkills?.length > 0) {
            const jobSkillsLower = job.requiredSkills.map(s => s.toLowerCase());
            let matchedProjects = 0;
            user.projects.forEach(project => {
                const techLower = (project.technologies || []).map(t => t.toLowerCase());
                if (techLower.some(t => jobSkillsLower.includes(t))) {
                    matchedProjects++;
                }
            });
            const projectScore = Math.round((matchedProjects / user.projects.length) * 10);
            score += projectScore;
            breakdown.projects = {
                total: user.projects.length,
                matched: matchedProjects,
                score: projectScore
            };
        }

        return {
            job,
            matchScore: score,
            matchBreakdown: breakdown
        };
    });

    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    const rankedJobs = scoredJobs.map((item, index) => ({
        rank: index + 1,
        matchScore: item.matchScore,
        // matchBreakdown: item.matchBreakdown,
        ...item.job
    }));

    return res.status(200).json(
        new ApiResponse(200, {
            totalJobs: rankedJobs.length,
            jobs: rankedJobs
        }, "Jobs fetched and ranked successfully")
    );
});


export {
    createJob,
    deleteJob,
    getCompanyJobs,
    getAllJobsByAlgorithm
}