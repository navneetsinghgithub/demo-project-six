const users_models = require("../model/users_models")
const jwt = require("jsonwebtoken")

module.exports = {
    tokengenerate: async (id) => {
        try {
            const secret_key = "123456"
            console.log(secret_key, "secret_key");
            const token = await jwt.sign({ _id: id }, secret_key)
            console.log(token, "token");
            const decode = await jwt.verify(token, secret_key)
            console.log(decode, "decode");
            const time = Math.floor(Date.now() / 1000);
            const Time = await users_models.findByIdAndUpdate({
                _id: decode._id
            }, { logintime: decode.iat, token: token },
                { new: true });
            return { token: token, time: time }

        } catch (error) {
            console.log(error, "error");
        }
    }
}