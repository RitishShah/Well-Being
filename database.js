const mongoose = require("mongoose");
const url = "mongodb://localhost:27017/latestDb"
mongoose.connect(url, {useNewUrlParser: true,useUnifiedTopology:true}, (err)=> {
    if(err) console.log(err);

    else console.log("Database Connected");
})

module.exports = mongoose;