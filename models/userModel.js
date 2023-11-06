const mongoose=require('mongoose');
const validator=require('validator');
const bycrypt=require('bcryptjs');


const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'name is required']
    },
    email:{
        type:String,
        required:[true,'email is required'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'please provide valid email']
    },
    photo:{
        type:String,
        default:''
    },
    password:{
        type:String,
        required:[true,'password is required'],
        minlength:8,
        select:false
    },
    passwordConfirm:{
        type:String,
        required:[true,'passwordConfirm is required'],
        validate:{
            validator:function(el){
                return el===this.password
            },
            message:'password and passwordConfirm must be the same'
        }
    }
});


//we use pre middleware to make password encryption
userSchema.pre('save',async function(next){
    //password is not changed
    //run this function if password is modified

    if(!this.isModified('password')) return next();
    console.log('user document midleware pre');
    this.password=await bycrypt.hash(this.password,12);
    
    //delete password confirm field
    this.passwordConfirm=undefined;

    next();
});

//instance method
userSchema.methods.correctPassword=async function(candidatePassword,userPassword){
    //return true or false
    return await bycrypt.compare(candidatePassword,userPassword);
}

const User=mongoose.model('User',userSchema);

module.exports=User;