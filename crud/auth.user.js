import {userEntity} from "../entity/user.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
// To create this token, you need to set a secret string
const jwtSecret = crypto.randomBytes(35).toString("hex")
// jwtSecret : 69b890b05ec6dbf89c3058845e164d35a34f25691791c6c535473cc6e2f37df8493168


const createUser = async (_id, username, passwordPlainText) => {
    const password = await bcrypt.hash(passwordPlainText, 10) // function promise has used await
    const maxAge = 3 * 60 * 60
    const user = await userEntity.create({_id, username, password}) // remember when you pass (arguments) you have to specify {p0,p1,...,pn}
    /*
                The code snippet created the token using JWT's sign function. This function takes in three parameters:
                the payload is the first parament that
                you'll pass to the function. This payload holds data concerning the user, and this data should not contain sensitive information like passwords;
                you passed your jwtSecret as the second parameter; and,
                how long the token will last as the third parameter.
                After passing all these arguments, JWT will generate a token. After the token is generated, send it as a cookie to the client.
    */
    const token = jwt.sign(
        {
            id: user._id,
            username,
            role: user.role
        },
        jwtSecret,
        {
            expiresIn: maxAge // 3 hrs in sec
        }
    )
    return {token: token, maxAge: maxAge, user: user}
}


const loginUser = async (username, password) => {
    const user = await userEntity.findOne({username})
    if (user) { // it returns object but ,you can check it is null or not by (object)
        const result = await bcrypt.compare(password, user.password) // hash password bcrypt uses compare(pain text,bcrypt)
        if (result) {
            const maxAge = 3 * 60 * 60
            const token = jwt.sign(
                {
                    id: user._id,
                    username,
                    role: user.role
                },
                jwtSecret,
                {
                    expiresIn: maxAge // 3 hrs in sec
                }
            )
            return {token: token, maxAge: maxAge, result: true}
        }
        // case for incorrect password
        return false
    }
    // case for user didn't exist
    return false
}


const updateUser = async (role, id) => {
    return await userEntity.findById(id).then(
        (user) => {
            if ("admin" !== user.role) {
                // if user exists and not an admin
                user.role = role
                /*
                **** error => MongooseError: Model.prototype.save() no longer accepts a callback
                user.save((err) => {
                    if (err) {
                        // err updated
                        console.log(err.toString())
                        process.exit(1)
                        return false
                    }
                    // update successful
                    // console.log(err)
                    return true
                })
                ***** solved => user.save()
                */
                return user.save().then(
                    (user) => { // save() it will update your doc it works like updateOne()
                        return "admin" === user.role
                    })
            } else {
                // if user exists and it is admin , user or other roles
                // fixed normal
                user.role = "normal"
                return user.save().then(
                    (user) => {
                        return "normal" === user.role
                    })
            }
        })
}


const authAdmin = async (token) => {
    if (token !== null) {
        /*
        The code snippet requests a token from the client,
        checks if a token is available, and verifies that token.
        JWT verifies your token with your jwtSecret and returns a callback function.
        This function returns status code 401 if the token fails the authentication test.
        When you've created the token, you passed a payload that contained the user's credentials.
        You'll get the role from the credentials and check if the user's role is admin.
        If the user is not an admin, you return status code 401, but you'll call the next function if the user is an admin.
        */
        return jwt.verify(token,
            jwtSecret,
            (err, decodedToken) => {
                if (err) {
                    return {result: false}
                } else {
                    // if nothing errors
                    // next step, Check role
                    if (decodedToken.role !== "admin") { // may normal , user , whatever case..
                        return {decodedToken: decodedToken, result: false}
                    } else {
                        // but it === "admin" ???
                        return {decodedToken: decodedToken, result: true}
                    }
                }
            })
    }
    // case token is null
    return false
}


const authAdminAndReads = async (token) => {
    return await authAdmin(token).then(
        (response) => {
            if (response.result) {
                const data = [
                    {
                        id: 1,
                        title: "Java + Spring boot 2019",
                        price: 290.0
                    },
                    {
                        id: 2,
                        title: "Node.js 2022",
                        price: 310.0
                    }
                ]
                return {data: data, result: true}
            } else {
                // case it is false
                return {result: false}
            }
        })
}


/*const authNormal = async (token) => {
    if (token !== null) {
        return jwt.verify(token, jwtSecret, (err, decodedToken) => {
            if (err) {
                return {result: false}
            } else { // if nothing errors
                // next step, Check role
                if (decodedToken.role !== "normal") {
                    return {decodedToken: decodedToken, result: false}
                } else {
                    return {decodedToken: decodedToken, result: true}
                }
            }
        })
    }
    return false
}*/


// ***
const deleteUser = async (id) => {
    return await userEntity.findById(id).then((user) => {
        return user.deleteOne().then(() => {
            return true
        })
    })
}


export {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    authAdmin, authAdminAndReads
    // authNormal
}