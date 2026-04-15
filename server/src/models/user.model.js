import {Schema, model} from 'mongoose';

const addressSchema = new Schema({
    street: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    zip: {
        type: String,
        required: true,
        trim: true
    },
    country : {
        type: String,
        required: true,
        trim: true
    }
});

const qualificationSchema = new Schema({
    degree: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    institution: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    }
}, {_id: false});

const experienceSchema = new Schema({
    company: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
}, {_id: false});

const projectSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    technologies: [String],
    link: {
        type: String,
        trim: true
    }
}, {_id: false});

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        trim: true
    },
    profilePicture: {
        url : {
            type: String,
            trim: true
        },
        fileId : {
            type: String,
            trim: true
        }
    },
    address: {
        type: addressSchema,
        required: false
    },
    DOB : {
        type: Date,
        required: false
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: false
    },
    qualifications: [qualificationSchema],
    experiences: [experienceSchema],
    skills: [String],
    projects: [projectSchema],
    summary: {
        type: String,
        trim: true
    },
    resume:{
        url : {
            type: String,
            trim: true
        },
        fileId : {
            type: String,
            trim: true
        }
    },
    category: {
        type: String,
        enum: ['Fresher', 'Experienced'],
        required: false
    },
    languages: [String],
    achievements: [String]

}, {timestamps: true});

const User = model('User', userSchema);

export default User;