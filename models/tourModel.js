const mongoose=require('mongoose');
const slugify=require('slugify');
const validator=require('validator');


const tourSchema=new mongoose.Schema({
    name:{
      type:String,
      required:[true,'name is required'],
      unique:true,
      trim:true,
     // validate:[validator.isAlpha,'tour name must only contain characters']
    },
    slug:String,
    ratingsAverage:{
      type:Number,
      default:4.5
    },
    price:{
      type:Number,
      required:[true,'price is required']
    },
    duration:{
      type:Number,
      required:[true,'durations is required']
    },
    maxGroupSize:{
      type:Number,
      required:[true,'maxGroupSize is required']
    },
    difficulty:{
      type:String,
      required:[true,'difficulty is required'],
      enum:{
        values:['easy','medium','hard'],
        message:'difficulity must be easy , medium , hard'
      }
    },
    ratingsQuantity:{
      type:Number,
      default:0
    },
    priceDiscount:{
      type:Number,
      validate:{
        validator:function(val){
          //this refers to current document in case of new document creation
          return val < this.price
        },
        message:`priceDiscount  must be less than price`
      }
    },
    summary:{
      type:String,
      trim:true,
      required:[true,'summary is required']
    },
    description:{
      type:String,
      trim:true
    },
    imageCover:{
      type:String,
      required:[true,'imageCover is required']
    },
    images:[String],
    createdAt:{
      type:Date,
      default:Date.now(),
      select:false
    },
    startDates:[Date],
    secretTour:{
      type:Boolean,
      default:false
    }
  },
  {
    toJSON:{ virtuals : true },
    toObject: { virtuals : true }
  });
  
//virtual properties
  tourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7;
  });

  //1-document middleware

  //this will run before action event
  tourSchema.pre('save',function(next){
   // console.log(this);
   //this.slug=slugify(this.name,{lower:true});
   next();
  });

  //this will run after save or create method
  tourSchema.post('save',function(doc,next){
    
    //  doc = doc.toJSON();
    //  doc.ayman = 'ayman';
     console.log(doc);
    next();
  });

  //2-query middleware
  //any query have find keyword
  //a)pre expresion 
  tourSchema.pre(/^find/,function(next){

    this.find({secretTour : {$ne:true}});
    this.start=Date.now();
    next();
  });

  //b)post expression
  tourSchema.post(/^find/,function(docs,next){
    console.log(`time ${Date.now() - this.start}`)
    next();
  });

  //3-aggregation middleware
  tourSchema.pre('aggregate',function(next){

    this.pipeline().unshift({ $match: { secretTour: { $ne: true} } });
    
    console.log(this.pipeline());
    next();
  })

  const Tour=mongoose.model('Tour',tourSchema);

  module.exports=Tour;