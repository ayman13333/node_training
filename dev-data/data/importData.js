/* eslint-disable prettier/prettier */
const fs=require('fs');
const mongoose=require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');



dotenv.config({ path: '../../config.env' });

const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB,{
  useNewUrlParser:true,
  useCreateIndex:true,
  useFindAndModify:false
}).then(()=>console.log('DB connection successfully.....'));



const tours= JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`,'utf-8'));

const importData= async()=>{
    try {
        await Tour.create(tours);
        console.log('success');
        process.exit();
    } catch (error) {
        console.log(error);
    }
}

console.log(process.argv);

if(process.argv[2]=='--import')
importData();