const User = require("../models/userModel");
const jwt=require('jsonwebtoken');
const {promisify}=require('util');
const ErrorClass = require("../ErrorHandler/ErrorClass");



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

        if(!email || !password) throw new Error('please send email and password');

        const user=await User.findOne({email}).select('+password');
        //instance method from mongoose to check on password
        let correct= user? await user.correctPassword(password,user.password) : false;

        if(!user || !correct)  throw new Error('Incorrect email or password');
            

        const token=singInToken(user._id);

        res.status(200).json({
            status:'success',
            statusCode:200,
            token
        })
        
    } catch (error) {
        let status=400;
        if(error.message=='Incorrect email or password') status=401;

        res.status(status).json({
            status:'fail',
            message:error.message
        })
    }
}

exports.protect= async(req,res,next)=>{
    try {
        let token;

        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer') ){
             token=req.headers.authorization.split(' ')[1];
        }

        if(!token)   throw new ErrorClass("token is missing",401);

        //2-verify token
        const decoded=await  promisify(jwt.verify)(token,process.env.JWT_SECRET);
        if(!decoded) throw new ErrorClass("token is wrong",401);

        //3-check if user still exists
        const freshUser= await User.findById(decoded.id);
        if(!freshUser) throw new ErrorClass("the token user to this token is not exists",401);

        //4-check if the user changed the password after the token is generated
      if(freshUser.changesPasswordAfter(decoded.iat)) throw new ErrorClass("the password is changed please login again",401);

      //grant access to that protected route
      req.user=freshUser;
        next();
    } catch (error) {
        
        res.status(error.status ? error.status : 400).json({
            success:'fail',
            message:error.message
        });
    }
   
}

//autherization middleware
//this function will return middleware function
exports.restrictTo=(...roles)=>{
    return (req,res,next)=>{
        try {
            if(!roles.includes(req.user.role)) throw new ErrorClass("you dont have permission to perform this action",403);

            next();
        } catch (error) {
            res.status(error.status ? error.status : 400).json({
                success:'fail',
                message:error.message
            });
        }
       
    }
}

//forget password
exports.forgetPassword= async(req,res,next)=>{
    try {
        //1-get user email
        const user=await User.findOne({email:req.body.email});
        if(!user) throw new ErrorClass("there is no user with this email",404);
        //2-generate token
        const resetToken=user.createPasswordResetToken();

       // console.log(user);
        await user.save({validateBeforeSave:false});
        //res.status(200).send('xxxxxx');
        
        //3-send email to user


    } catch (error) {
        res.status(error.status?error.status:400).json({
            success:'fail',
            error:error.message
        });
    }
    
}

//reset password
exports.resetPassword=(req,res,next)=>{

}