const secret_key = "123456"
const jwt = require("jsonwebtoken")
const users_models = require("../model/users_models")

module.exports = {
    auth: async (req, res, next) => {
        let token
        
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                console.log(token, "token");
                const decode = await jwt.verify(token, secret_key)
                console.log(decode, "decode");
                const user = await users_models.findByIdAndUpdate({
                    _id: decode._id, logintime: decode.iat
                }, { new: true })
                console.log(user, "user");
                if (user) {
                    req.user = user
                    next();
                }
                else {
                    return res.json({
                        message: "login first",
                    })
                }

            } catch (error) {
                console.log("invalid signature");
                return res.json({
                    message: "invalid token"
                })
            }
        }
    }

}