const ErrorClass = require("../ErrorHandler/ErrorClass");
const User = require("../models/userModel");

const filterObj=(obj,...allowedFields)=>{
  const newObj={};
  Object.keys(obj).forEach(el=>{
    if(allowedFields.includes(el)) newObj[el]=obj[el]
  });

  return newObj;
}

exports.getAllUsers = async(req, res) => {

  const users= await User.find();

  res.status(200).json({
    success:'success',
    data:users
  });
  // res.status(500).json({
  //   status: 'error',
  //   message: 'This route is not yet defined!'
  // });
};
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.updateMe= async (req,res,next)=>{
  try {
    //1- create error if user try to update password
    if(req.body.password || req.body.passwordConfirm) throw new ErrorClass('this route not for password update',400);

    //2-update user document
    const filteredBody=filterObj(req.body,'name','email');

    const updatedUser= await User.findByIdAndUpdate(req.user.id,
      filteredBody,
      {
        new:true,
        runValidators:true
      });

      res.status(200).json({
        status:'success',
        data:{
         user: updatedUser
        }
      });

  } catch (error) {
    res.status(error.status?error.status:400).json({
      success:'fail',
      error:error.message
  });
  }
}

exports.deleteMe=async(req,res,next)=>{
  try {
    await User.findByIdAndUpdate(req.user.id,{active:false});

    res.status(204).json({
      status:'success',
      data:null
    });
  } catch (error) {
    res.status(error.status?error.status:400).json({
      success:'fail',
      error:error.message
  });
  }
}

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
