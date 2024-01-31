var express = require('express');
var router = express.Router();

const controller = require("../controller/users_controller");
const {auth} = require('../middleware/auth');

router.post("/signup",controller.signup)
router.post("/signin",controller.signin)
router.post("/socialLogin",controller.socialLogin)
router.get("/get_profile",auth,controller.get_profile)
router.put("/edit_profile/:id",controller.edit_profile)
router.post("/imageupload",controller.imageupload)
router.post("/forget_Password",controller.forget_Password)

router.post("/forgetUpdatePassword",controller.forgetUpdatePassword)
router.post("/changePassword", auth, controller.changePassword)
router.post("/verifyOtp",controller.verifyOtp)
router.post("/resend_otp",controller.resend_otp)
router.post("/multiImgUpload",controller.multiImgUpload)
router.post("/notification_status",auth,controller.notification_status)
router.post("/logout",auth ,controller.logout)



module.exports = router;
