const { tokengenerate } = require("../jwt/json_web_token");
const users_models = require("../model/users_models")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const { checkvalidation } = require("../helper/helper");
const { Validator } = require("node-input-validator");
const fileUpload = require("express-fileupload");
const { imageUpload } = require("../helper/helper")
module.exports = {
    signup: async (req, res) => {
        try {

            const v = new Validator(req.body, {
                name: "required",
                email: "required"
            })
            let error_response = await checkvalidation(v);
            console.log(error_response, "error_response");
            if (error_response) {
                return res.json(error_response)
            }
            const saltround = 10;
            const password = await bcrypt.hash(req.body.password, saltround)


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

            const signup = await users_models.create({
                name: req.body.name, email: req.body.email, phone_number: req.body.phone_number,
                country: req.body.country, city: req.body.city, town: req.body.town,
                image: newImagesArr, password: password, otp: otp,
            })


            const token = await tokengenerate(signup._id)
            const updateresult = await users_models.findByIdAndUpdate({
                _id: signup._id
            }, { token: token.token, logintime: token.time }, { new: true })

            var otp = Math.floor(1000 + Math.random() * 1100);
            console.log(otp, "otp");
            var transport = nodemailer.createTransport({
                host: "sandbox.smtp.mailtrap.io",
                port: 2525,
                auth: {
                    user: "e593fe6d0474e3",
                    pass: "d769e414fd2629"
                }
            });
            const info = await transport.sendMail({
                from: "nav123@gmail.com",
                to: req.body.email,
                subject: "forget password link",
                text: "this is your link",
                html: `${otp}`
            })

            return res.json({
                message: "add user",
                status: 200,
                body: updateresult
            })

        } catch (error) {
            console.log(error, "error");
        }
    },
    signin: async (req, res) => {
        try {
            const signin = await users_models.findOne({
                phone_number: req.body.phone_number
            })
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
                            body: updateresult
                        })
                    }
                }
            }
        } catch (error) {
            console.log(error, "error");
        }
    },
    get_profile: async (req, res) => {
        try {

            const get_profile = await users_models.findById({
                _id: req.user._id
            })
            return res.json({
                message: "get_profile_success",
                status: 200,
                body: get_profile
            })
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
                message: "updated_user_success",
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
                await users_models.findOneAndUpdate({ email: req.body.email }, { otp: 0 }, { new: true })
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
            console.log(data, "dfghjkjhhhhhhhhhhhh");
            var otp = Math.floor(Math.random() * 10000 + 1);
            const user = await users_models.findByIdAndUpdate(
                {
                    _id: data._id,
                },
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
            console.log(error, "error");
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
    }

}