const User = require("../models/userModel");
const jwt=require('jsonwebtoken');

function singInToken(id) {
   return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
}

exports.signup= async(req,res,next)=>{

    try {
    const newUser= await User.create(req.body);

    const token=singInToken(newUser._id);

    res.status(201).json({
        status:'success',
        token,
        data:{
            user: newUser
        }
    });
    } catch (error) {
        res.status(400).json({
            success:'fail',
            message:error.message
        })
    }
    
}

exports.login=async(req,res,next)=>{
    try {
        const{email,password}=req.body;

        if(!email || !password){
            return res.status(400).json({
                success:'fail',
                message:'please send email and password'
            });
        } 

        const user=await User.findOne({email}).select('+password');
        //instance method from mongoose to check on password
        let correct= user? await user.correctPassword(password,user.password) : false;

        if(!user || !correct){
            return res.status(401).json({
                success:'fail',
                message:'Incorrect email or password'
            })
        }

        const token=singInToken(user._id);

        res.status(200).json({
            status:'success',
            statusCode:200,
            token
        })
        
    } catch (error) {
        res.status(400).json({
            status:'fail',
            message:error.message
        })
    }
    

}