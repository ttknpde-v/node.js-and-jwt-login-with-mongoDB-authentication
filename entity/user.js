import mongoose from "mongoose"
// const Schema = mongoose.Schema // Schema is like a blueprint that shows how the database will be constructed.
const userSchema = new mongoose.Schema({
     _id : { // if don't specify it will set type object on document auto
         type:Number
     },
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        maxlength: 200,
        required: true,
    },
    role: {
        type: String,
        default: "normal", // The role field grants a default value (normal) that you can change if needed.
        required: true,
    }
},{
    versionKey: false // if you don't need it
})
// In the schema, the username will be unique, required, and will accept strings.
export const userEntity = mongoose.model("users",userSchema)
