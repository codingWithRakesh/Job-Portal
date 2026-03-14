import {Schema, model} from "mongoose";

const appliedJobSchema = new Schema({
    job: {
        type: Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    applicant: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Shortlisted", "Rejected"],
        default: "Pending"
    }
}, { timestamps: true });

const AppliedJob = model("AppliedJob", appliedJobSchema);

export default AppliedJob;