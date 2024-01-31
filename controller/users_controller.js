const { tokengenerate } = require("../jwt/json_web_token");
const users_models = require("../model/users_models")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const { checkvalidation } = require("../helper/helper");
const { Validator } = require("node-input-validator")
const fileUpload = require("express-fileupload");
const { imageUpload } = require("../helper/helper");
const saltRound = 10

module.exports = {
    signup: async (req, res) => {
        try {
            const v = new Validator(req.body, {
                name: "required",
                email: "required"
            })
            let error_respons = await checkvalidation(v);
            console.log(error_respons, "error_response");
            if (error_respons) {
                return res.json(error_respons)
            }

            const signup1 = await users_models.findOne({
                email: req.body.email
            })

            if (signup1) {
                return res.json({
                    message: "email already exist",
                    status: 404,
                    body: {}
                })
            }

            const password = await bcrypt.hash(req.body.password, saltRound)


            if (req.files !== null && req.files.image != undefined) {
                var imagesArr = Array.isArray(req.files.image)
                    ? req.files.image
                    : [req.files.image];
                var newImagesArr = [];
                for (let i in imagesArr) {
                    var image = imageUpload(imagesArr[i], "resturantImage");
                    newImagesArr.push(image);
                }
                req.body.image = newImagesArr;
            }

            var otp = Math.floor(1000 + Math.random() * 1100);


            const signup = await users_models.create({
                name: req.body.name, email: req.body.email, phone_number: req.body.phone_number,
                country: req.body.country, city: req.body.city, town: req.body.town,
                image: newImagesArr, password: password, otp: otp, isVerified: req.body.isVerified
            })



            const token = await tokengenerate(signup._id)
            const updateresult = await users_models.findByIdAndUpdate({
                _id: signup._id
            }, { token: token.token, logintime: token.time }, { new: true })

            console.log(otp, "otp");
            // var transport = nodemailer.createTransport({
            //     host: "sandbox.smtp.mailtrap.io",
            //     port: 2525,
            //     auth: {
            //         user: "e593fe6d0474e3",
            //         pass: "d769e414fd2629"
            //     }
            // });
            // const info = await transport.sendMail({
            //     from: "nav123@gmail.com",
            //     to: req.body.email,
            //     subject: "forget password link",
            //     text: "this is your link",
            //     html: `${otp}`
            // })

            return res.json({
                message: "add user",
                status: 200,
                body: updateresult
            })


        } catch (error) {
            console.error("Error: ", error);
            return res.json({
                message: "error user not added",
                status: 400,
                body: {}
            });
        }
    },

    signin: async (req, res) => {
        try {
            const signin = await users_models.findOne({
                phone_number: req.body.phone_number
            })
            if (!signin) {
                return res.json({
                    message: "Data not found",
                    staus: 404,
                    body: {}
                })
            }

            else if (signin.isVerified === 0) {
                return res.json({
                    message: "Not verified!",
                    status: 400,
                    body: {}
                })
            }
            const token = await tokengenerate(signin._id)
            const updateresult = await users_models.findByIdAndUpdate({
                _id: signin._id
            }, { token: token.token, logintime: token.time }, { new: true })
            if (!signin) {
                return res.json({
                    message: "phone_number or password is not correct",
                    status: 404,
                    body: {}
                })
            } else {
                if (signin.phone_number == req.body.phone_number) {
                    const password = await bcrypt.compare(req.body.password, signin.password);

                    if (!password) {
                        return res.json({
                            message: "password wrong",
                            status: "404",
                            body: {}
                        })
                    } else {
                        return res.json({
                            message: "login success",
                            status: 200,
                            body: signin
                        })
                    }
                }
            }
        } catch (error) {
            console.log(error, "error");
        }
    },

    socialLogin: async (req, res) => {
        try {
            const data = await users_models.findOne({ email: req.body.email, socialId: req.body.socialId })
            if (!data) {
                let token;
                var signup = await users_models.create({
                    name: req.body.name, email: req.body.email, socialId: req.body.socialId, socialType: req.body.socialType
                })
                token = await generateToken(signup._id)
                const updatedResult = await users_models.findByIdAndUpdate({ _id: signup._id }, { token: token.token, loginTime: token.time }, { new: true })
                return res.json(updatedResult)
            } else {
                let token = await generateToken(data._id)
                const result1 = await users_models.findByIdAndUpdate({ _id: data._id }, {
                    name: req.body.name, email: req.body.email, socialId: req.body.socialId, socialType: req.body.socialType, token: token.token, loginTime: token.time
                }, { new: true })
                return res.json(result1)
            }
        } catch (error) {
            console.log(error)
        }
    },


    get_profile: async (req, res) => {
        try {

            const get_profile = await users_models.findById({
                _id: req.user._id
            })
            if (get_profile) {
                return res.json({
                    message: "get_profile_success",
                    status: 200,
                    body: get_profile
                })
            }

        } catch (error) {
            console.log(error, "error");
        }
    },

    edit_profile: async (req, res) => {
        try {
            const edit_profile = await users_models.findByIdAndUpdate({ _id: req.params.id },
                {
                    name: req.body.name, email: req.body.email, phone_number: req.body.phone_number,
                    country: req.body.country, city: req.body.city, town: req.body.town,
                    image: req.body.image, password: req.body.password,
                }, { new: true })
            return res.json({
                message: "updated user success",
                status: 200,
                body: edit_profile
            })
        } catch (error) {
            console.log(error, "error");
        }
    },

    imageupload: async (req, res) => {
        try {
            if (req.files && req.files.image) {
                const image = req.files.image

                if (image) {
                    const string_file_name = image.name
                    const string_file_array = string_file_name.split(".");
                    const file_Ext = string_file_array[string_file_array.length - 1];
                    const letter = "ASDFGHJ234YTREWXCVBNMNBFGHJHGFDS"
                    let result = ""
                    while (result.length < 29) {
                        const ran_int = Math.floor(Math.random() * 19 + 2)
                        const ran_chr = letter[ran_int];
                        if (result.substr(1, -1) !== ran_chr) result += ran_chr;
                    }
                    const resultExt = `${result}.${file_Ext}`;
                    const folder = "chatimage"
                    image.mv(`public/images/${folder}/${resultExt}`)

                    return res.json({
                        message: "image uploaded",
                        status: 200,
                        body: resultExt
                    })
                }
            }
        } catch (error) {
            console.log(error, "error");
        }
    },

    verifyOtp: async (req, res) => {
        try {
            const { userOtp } = req.body;
            console.log(userOtp, "userOtp");

            const user = await users_models.findOne({ email: req.body.email });
            console.log(user, "userssssssssssssss");
            if (!user) {
                return res.json({
                    status: 404,
                    success: false,
                    message: "User not found",
                    body: {}
                });
            }
            if (userOtp == user.otp) {
                await users_models.findOneAndUpdate({ email: req.body.email },
                    { otp: 0, isVerified: 1 }, { new: true })
                return res.json({
                    status: 200,
                    success: true,
                    message: "OTP verified successfully",
                    body: {}
                });
            } else {
                return res.json({
                    status: 401,
                    success: false,
                    message: "Invalid OTP",
                    body: {}
                });
            }
        } catch (error) {
            console.log(error, "error");
        }
    },

    forget_Password: async (req, res) => {
        try {

            const data = await users_models.findOne({ email: req.body.email })
            // console.log(data, "dfghjkjhhhhhhhhhhhh");
            var otp = Math.floor(Math.random() * 10000 + 1);
            const user = await users_models.findByIdAndUpdate(
                { _id: data._id, },
                { otp: otp }, { new: true }
            );
            var transport = nodemailer.createTransport({
                host: "sandbox.smtp.mailtrap.io",
                port: 2525,
                auth: {
                    user: "e593fe6d0474e3",
                    pass: "d769e414fd2629"
                }
            });

            let info = await transport.sendMail({
                from: '"hello" <foo@example.com>',
                to: req.body.email,
                subject: "OTP generate ✔",
                text: "Hello world?",
                html: `${otp}`
            });
            return res.json({
                message: "forget password success",
                status: 200,
                body: user
            })
        } catch (error) {
            return res.json({
                message: "error forget password",
                status: 404,
                body: {}
            })
        }
    },

    resend_otp: async (req, res) => {
        try {
            const otp = Math.floor(1000 + Math.random() * 1100);
            // console.log(otp, "tttttttt");
            const resend_otp = await users_models.findOneAndUpdate({ email: req.body.email }, { otp: otp })
            // console.log(resend_otp, "oooooooooooo");
            if (resend_otp) {
                return res.json({
                    message: "resend otp successful",
                    status: 200,
                    body: resend_otp
                })
            }
        } catch (error) {
            return res.json({
                message: "error otp unsuccessful",
                status: 404,
                body: {}
            })
        }
    },

    notification_status: async (req, res) => {
        try {
            const notification_status = await users_models.findByIdAndUpdate({
                _id: req.user._id
            }, { notification_status: req.body.notification_status }, { new: true })
            return res.json({
                message: "updated notification status",
                status: 200,
                body: notification_status
            })
        } catch (error) {
            console.log(error, "error");
        }
    },

    multiImgUpload: async (req, res) => {
        console.log("k")
        if (req.files !== null && req.files.image != undefined) {
            var imagesArr = Array.isArray(req.files.image)
                ? req.files.image
                : [req.files.image];
            var newImagesArr = [];
            for (let i in imagesArr) {
                var image = imageUpload(imagesArr[i], "resturantImage");
                newImagesArr.push(image);
            }
            req.body.image = newImagesArr;
        }

        return res.json({
            newImagesArr
        })
    },

    logout: async (req, res) => {
        try {
            const logout = await users_models.findByIdAndUpdate({
                _id: req.user._id
            },
                { logintime: 0 }, { new: true })
            if (!logout) {
                return res.json({
                    message: "you are already logout",
                    status: 400,
                    body: {}
                })
            }
            return res.json({
                message: "logout successfully",
                status: 200,
                body: logout
            })
        } catch (error) {

        }
    },

    forgetUpdatePassword: async (req, res) => {
        try {
            const userData = await users_models.findOne({ email: req.body.email })

            if (!userData) {
                return res.json({
                    message: "Incorrect email!",
                    status: 400,
                    body: {}
                })
            }

            if (userData.otp != req.body.otp) {
                return res.json({
                    message: "Incorrect otp!",
                    status: 400,
                    body: {}
                })
            }

            const hashPassword = await bcrypt.hash(req.body.password, saltRound)
            const updatedData = await users_models.findOneAndUpdate({ email: req.body.email },
                { password: hashPassword }, { new: true })
            return res.json({
                message: "Password updated successfully..",
                status: 400,
                body: updatedData
            })
        } catch (error) {
            console.log(error)
        }
    },

    changePassword: async (req, res) => {
        try {
            const data = await users_models.findOne({ _id: req.user._id })
            const dcryptPassword = await bcrypt.compare(req.body.newPassword, data.password)
            if (dcryptPassword == false) {
                return res.json({
                    message: "Password does not match!",
                    status: 400,
                    body: {}
                })
            }
            const encryptPassword = await bcrypt.hash(req.body.newPassword, saltRound)
            data.password = encryptPassword
            await data.save()
            return res.json({
                message: "Password updated successfuly..",
                status: 200,
                body: data
            })

        } catch (error) {
            console.log(error)
        }
    },



}