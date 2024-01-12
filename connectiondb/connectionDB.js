const mongoose = require("mongoose")

module.exports=()=>{
    mongoose.connect(process.env.url).then((result)=>{
        console.log(">>>successfully connected>>>");
    }).catch((error)=>{
        console.log(error,"error");
    })
}