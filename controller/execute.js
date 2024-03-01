import logging from "../log/logging.js"
import express from "express"
import {
    createUser,
    deleteUser,
    loginUser,
    updateUser,
    authAdmin,
    authAdminAndReads
} from "../crud/auth.user.js"

import configMgdb from "../configuration/config.mgdb.js"
import bodyParser from "body-parser"
/*
    To prevent unauthenticated users from accessing
    the private route, take the token from the cookie,
    verify the token, and redirect users based on role.
*/
// get the token from the client using a node package called cookie-parser.
import cookieParser from "cookie-parser"

// connect database
await configMgdb

const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cookieParser())


app.post("/api/auth/create", async (req, res) => {
    let {id, username, password} = req.body
    await createUser(id, username, password).then(
        (response) => {
            logging.debug('create(_id,username , password) returned ' + response) // returned objects. That you mapped with Schema mongoose
            // ***
            res.cookie(
                "jwt",
                response.token,
                {
                    httpOnly: true,
                    maxAge: response.maxAge * 1000 // 3hrs in ms
                }
            )
            res.json({
                data: response,
                status: ["201", "created"]
            })
            /*
            "data": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJtYXJrIiwicm9sZSI6Im5vcm1hbCIsImlhdCI6MTcwOTI3MDY5MiwiZXhwIjoxNzA5MjgxNDkyfQ.hkpolEO4ut7nRsJz2CQmkh3k7hCxuRvrIpO9UaWHhXA",
                "maxAge": 10800,
                "user": {
                    "_id": 4,
                    "username": "mark",
                    "password": "$2a$10$.l0/aRTOCuC15TWIl24cve..JdEAL.CvMBw5tLD0KGe6Vb6MGfRwK",
                    "role": "normal"
                }
            },
            "status": [
                "201",
                "created"
            ]
        */
        }).catch(
        (e) => {
            logging.debug('found error ' + e.toString())
            res.json({
                data: "user not successful created",
                status: ["200", "ok"]
            })
        })
})


app.post("/api/auth/login", async (req, res) => {
    let {username, password} = req.body
    await loginUser(username, password).then(
        (response) => {
            if (response.result) {
                res.cookie(
                    "jwt",
                    response.token,
                    {
                        httpOnly: true,
                        maxAge: response.maxAge * 1000 // 3hrs in ms
                    }
                )
                res.json({
                    data: response,
                    status: ["202", "accepted"]
                })
            } else {
                res.json({
                    data: response,
                    status: ["401", "unauthorized"]
                })
            }
        }).catch(
        (e) => {
            logging.debug('found error ' + e.toString())
            res.json({
                data: "user not successful logged in",
                status: ["200", "ok"]
            });
        })
})


app.get("/api/auth/admin", async (req, res) => {
    const token = req.cookies.jwt // it passed cookie auto in Headers block POSTMAN look at Cookie(Key)
    await authAdmin(token).then(
        (response) => {
            /*  response.decodedToken returns
                "decodedToken": {
                    "id": 2,
                    "username": "peter",
                    "role": "admin",
                    "iat": 1709273179,
                    "exp": 1709283979
                }
                */
            if (response.result) {
                /*if (response.decodedToken.role !== "admin") {
                    res.json({
                        data: response.decodedToken.role,
                        status: ["401", "unauthorized"]
                    })
                } else {*/
                // if it is an admin
                res.json({
                    data: response.decodedToken.role,
                    status: ["202", "accepted"]
                })
                /*}*/

            } else {
                // if it returns false cause token == null
                res.json({
                    data: response.decodedToken.role,
                    status: ["405", "method not allowed"]
                })
            }
        })
})


app.get("/api/auth/admin/reads", async (req, res) => {
    const token = req.cookies.jwt // it passed cookie auto in Headers block POSTMAN look at Cookie(Key)
    await authAdminAndReads(token).then(
        (response) => {
            if (response.result) {
                // if role is admin i returned true
                res.json({
                    data: response.data,
                    status: ["202", "accepted"]
                })
            } else { // if it returns false cause token == null
                res.json({
                    data: response,
                    status: ["405", "method not allowed"]
                })
            }
        }).catch(
        (e) => {
            logging.debug('found error ' + e.toString())
            res.json({
                data: "user not successful accessed data",
                status: ["200", "ok"]
            });
        })
})


app.get("/api/auth/logout", async (req, res) => {
    res.cookie("jwt", "", {maxAge: 1}) // this line is working for deleting Cookie(Key) in Headers block
    // The code snippet replaced the JWT token with an empty string and gave it a lifespan of 1 second.
    res.json({
        status: ["200", "ok"]
    })
})


app.put("/api/auth/update", async (req, res) => {
    let {role, id} = req.body
    await updateUser(role, id).then(
        (response) => {
            // logging.debug(response)
            if (response) {
                res.json({
                    data: response,
                    status: ["202", "accepted"]
                })
            } else {
                res.json({
                    data: response,
                    status: ["400", "bad request"]
                })
            }
        }).catch(
        (e) => {
            logging.debug('found error ' + e.toString())
            res.json({
                data: "user not successful updated",
                status: ["200", "ok"]
            });
        })
})


app.delete("/api/auth/delete", async (req, res) => {
    let id = req.body.id
    // logging.debug(id)
    await deleteUser(id).then(
        (response) => {
            if (response) {
                res.json({
                    data: response,
                    status: ["202", "accepted"]
                })
            } else { // another case is not false use else {} that's good
                res.json({
                    data: response,
                    status: ["400", "bad request"]
                })
            }
        }).catch(
        (e) => {
            logging.debug('found error ' + e.toString())
            res.json({
                data: "user not successful deleted",
                status: ["200", "ok"]
            })
        })
})


const PORT = 5000
app.listen(PORT, () => logging.info(`Server Connected to port ${PORT}`))
