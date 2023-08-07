require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
mongoose.connect(process.env.MONGO_LINK,
{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>console.log('database connected'));
let schema = mongoose.Schema(
    {
        name:
        {
            type:String,
            required:true,
        },
        email:
        {
            type:String,
            unique:true,
            required:true,
        },
        password:
        {
            type:String,
            required:true
        },
        totalForms:
        {
            type:Number,
            default:0,
        }
        
    }
);
// schema.pre('save', async function (next) {
//     if (this.isModified('password')) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }
//     next();
// });
//compare password
schema.methods.comparepassword = async function (plaintext, savedpassword) {
    return await bcrypt.compare(plaintext, savedpassword);
}

const usermodel = mongoose.model("Collection", schema);
module.exports = usermodel;