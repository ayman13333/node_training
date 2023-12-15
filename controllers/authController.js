const crypto=require('crypto');
const User = require("../models/userModel");
const jwt=require('jsonwebtoken');
const {promisify}=require('util');
const ErrorClass = require("../ErrorHandler/ErrorClass");
const sendEmail = require("../utils/email");



function singInToken(id) {
   return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
}

const createSendToken=(user,statusCode,res)=>{
    const token=singInToken(user._id);
    const cookieOptions={
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES *24*60*60*1000),
        httpOnly:true
    };
    if(process.env.NODE_ENV==='production') cookieOptions.secure=true;
    res.cookie('jwt',token,cookieOptions);
    user.password=undefined;
    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user: user
        }
    });
}

exports.signup= async(req,res,next)=>{

    try {
    const newUser= await User.create(req.body);

    const token=singInToken(newUser._id);

    createSendToken(newUser,201,res);
  
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
        
        createSendToken(user,200,res);
        
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

//forget password when not login
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
        const resetURL=`${req.protocol}:://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        const message=`forgot your password? submit patch request to this url ${resetURL} /n with password and password confirm`;

        try {
            await sendEmail({
                email:user.email,
                subject:'your password reset token valid for 10 min',
                message
            });
    
            res.status(200).json({
                status:'success',
                message:'Token sent to email!'
            });
        } catch (error) {
            user.createPasswordResetToken=undefined;
            user.passwordResetExpires=undefined;
            await user.save({validateBeforeSave:false});

            throw new ErrorClass('there is an error in sending email',500);
        }
       


    } catch (error) {
        res.status(error.status?error.status:400).json({
            success:'fail',
            error:error.message
        });
    }
    
}

//reset password by email
exports.resetPassword=async(req,res,next)=>{
    try {
        //1) get user based on token
    const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user=await User.findOne({passwordResetToken:hashedToken , passwordResetExpires:{$gt:Date.now()}});

    //2) if the token not expired and there is user set new pass
    if(!user) throw new ErrorClass("Token is invalid or has expired",400);

    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;

    //3)update changed password property for the user
    await user.save();

    //4)log in the user
    createSendToken(user,200,res);

    } catch (error) {
        res.status(error.status?error.status:400).json({
            success:'fail',
            error:error.message
        });
    }
    
}

//update password when login
exports.updatePassword= async(req,res,next)=>{
    try {
        //1-get user
        const user= await User.findById(req.user.id).select('+password');
        //2-check if password is correct
        if(!(await user.correctPassword(req.body.passwordCurrent,user.password)))
        {
            return new ErrorClass("your current password is wrong",401);
        }
        //3-if so update password
        user.password=req.body.password;
        user.passwordConfirm=req.body.passwordConfirm;

        await user.save();
        //4-log in user with new password
        createSendToken(user,200,res);
    } catch (error) {
        res.status(error.status?error.status:400).json({
            success:'fail',
            error:error.message
        });
    }
}