import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import AppliedJob from "../models/ApplyedJob.model.js";
import Job from "../models/job.model.js";
import mongoose from "mongoose";

const applyForJob = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const applicantId = req.user._id;

    if (!applicantId) {
        throw new ApiError(400, "Unauthorized: User not authenticated");
    }
    if(!mongoose.Types.ObjectId.isValid(jobId)) {
        throw new ApiError(400, "Invalid Job ID");
    }
    if (!jobId) {
        throw new ApiError(400, "Job ID is required");
    }

    const existingApplication = await AppliedJob.findOne({ job: jobId, applicant: applicantId });
    if (existingApplication) {
        throw new ApiError(400, "You have already applied for this job");
    }

    const application = await AppliedJob.create({
        job: jobId,
        applicant: applicantId
    });

    return res.status(201).json(new ApiResponse(201, application, "Application submitted successfully"));

});

const findAppliedJobsForUser = asyncHandler(async (req, res) => {
    const applicantId = req.user._id;

    if (!applicantId) {
        throw new ApiError(400, "Unauthorized: User not authenticated");
    }
    const applications = await AppliedJob.aggregate([
        {
            $match: {
                applicant: new mongoose.Types.ObjectId(applicantId)
            }
        },
        {
            $lookup: {
                from: "jobs",
                localField: "job",
                foreignField: "_id",
                as: "job"
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, applications, "Applied jobs fetched successfully"));

});

const findUsersByAlgorithm = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    const { jobId } = req.params;

    if (!companyId) {
        throw new ApiError(400, "Unauthorized: Company not authenticated");
    }
    if(!mongoose.Types.ObjectId.isValid(jobId)) {
        throw new ApiError(400, "Invalid Job ID");
    }
    if (!jobId) {
        throw new ApiError(400, "Job ID is required");
    }

    const job = await Job.findOne({ _id: jobId, company: companyId });
    if (!job) {
        throw new ApiError(404, "Job not found or does not belong to this company");
    }

    const applications = await AppliedJob.aggregate([
        {
            $match: {
                job: new mongoose.Types.ObjectId(jobId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "applicant",
                foreignField: "_id",
                as: "applicant"
            }
        },
        {
            $unwind: "$applicant"
        },
        {
            $project: {
                "applicant.password": 0,
                "applicant.refreshToken": 0
            }
        }
    ]);

    if (!applications.length) {
        return res.status(200).json(
            new ApiResponse(200, [], "No applicants found for this job")
        );
    }

    // Scoring algorithm (Total: 100 points)
    const scoredApplicants = applications.map((application) => {
        const user = application.applicant;
        let score = 0;
        const breakdown = {};

        //skill match (35 points max)
        if (job.requiredSkills?.length > 0 && user.skills?.length > 0) {
            const jobSkillsLower = job.requiredSkills.map(s => s.toLowerCase());
            const userSkillsLower = user.skills.map(s => s.toLowerCase());
            const matchedSkills = jobSkillsLower.filter(s => userSkillsLower.includes(s));
            const skillScore = Math.round((matchedSkills.length / jobSkillsLower.length) * 35);
            score += skillScore;
            breakdown.skills = {
                matched: matchedSkills.length,
                required: jobSkillsLower.length,
                score: skillScore
            };
        }

        // experience match (20 points max)
        if (job.experiences?.years !== undefined) {
            const requiredYears = job.experiences.years;

            let totalExperienceYears = 0;
            if (user.experiences?.length > 0) {
                user.experiences.forEach(exp => {
                    const start = new Date(exp.startDate);
                    const end = new Date(exp.endDate);
                    const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
                    totalExperienceYears += years;
                });
            }
            totalExperienceYears = Math.round(totalExperienceYears * 10) / 10;

            let expScore = 0;
            if (totalExperienceYears >= requiredYears) {
                expScore = 20;
            } else if (totalExperienceYears > 0) {
                expScore = Math.round((totalExperienceYears / requiredYears) * 20);
            }

            score += expScore;
            breakdown.experience = {
                required: requiredYears,
                userHas: totalExperienceYears,
                score: expScore
            };
        }

        //qualification match (15 points)
        if (job.qualifications?.length > 0 && user.qualifications?.length > 0) {
            const jobDegrees = job.qualifications.map(q => q.degree.toLowerCase());
            const userDegrees = user.qualifications.map(q => q.degree.toLowerCase());
            const hasQualification = jobDegrees.some(degree => userDegrees.includes(degree));
            const qualScore = hasQualification ? 15 : 0;
            score += qualScore;
            breakdown.qualification = {
                required: jobDegrees,
                score: qualScore
            };
        }

        // location match (10 points)
        if (job.location?.length > 0 && user.address?.city) {
            const jobLocationsLower = job.location.map(l => l.toLowerCase());
            const userCity = user.address.city.toLowerCase();
            const locationScore = jobLocationsLower.includes(userCity) ? 10 : 0;
            score += locationScore;
            breakdown.location = {
                jobLocations: job.location,
                userCity: user.address.city,
                score: locationScore
            };
        }

        // project match (10 points)
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

        // age match (5 points)
        if (job.ageLimit && user.DOB) {
            const today = new Date();
            const birthDate = new Date(user.DOB);
            const age = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 365));
            const ageScore = age <= job.ageLimit ? 5 : 0;
            score += ageScore;
            breakdown.age = {
                limit: job.ageLimit,
                userAge: age,
                score: ageScore
            };
        }

        // profile completeness (20 points max)
        let completenessScore = 0;
        if (user.summary) completenessScore += 1;
        if (user.resume?.url) completenessScore += 2;
        if (user.projects?.length > 0) completenessScore += 1;
        if (user.languages?.length > 0) completenessScore += 1;
        score += completenessScore;
        breakdown.profileCompleteness = { score: completenessScore };

        return {
            applicationId: application._id,
            status: application.status,
            appliedAt: application.createdAt,
            matchScore: score,
            // matchBreakdown: breakdown,
            applicant: user
        };
    });

    scoredApplicants.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json(
        new ApiResponse(200, {
            job: {
                id: job._id,
                title: job.title,
                totalApplicants: scoredApplicants.length
            },
            applicants: scoredApplicants
        }, "Applicants fetched and ranked successfully")
    );
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
    const companyId = req.company._id;
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!companyId) {
        throw new ApiError(400, "Unauthorized: Company not authenticated");
    }
    if (!applicationId) {
        throw new ApiError(400, "Application ID is required");
    }
    if(!mongoose.Types.ObjectId.isValid(applicationId)) {
        throw new ApiError(400, "Invalid Application ID");
    }
    if (!["Shortlisted", "Rejected"].includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    const [application] = await AppliedJob.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(applicationId)
            }
        },
        {
            $lookup: {
                from: "jobs",
                localField: "job",
                foreignField: "_id",
                as: "job"
            }
        },
        {
            $unwind: "$job"
        }
    ]);
    if (!application) {
        throw new ApiError(404, "Application not found");
    }

    if (application.job.company.toString() !== companyId.toString()) {
        throw new ApiError(403, "Forbidden: You can only update applications for your own jobs");
    }

    const updated = await AppliedJob.findByIdAndUpdate(
        applicationId,
        { status },
        { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
        throw new ApiError(500, "Failed to update application status");
    }

    return res.status(200).json(new ApiResponse(200, updated, "Application status updated successfully"));
});

export {
    applyForJob,
    findAppliedJobsForUser,
    findUsersByAlgorithm,
    updateApplicationStatus
}