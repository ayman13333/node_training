const express = require('express');
const morgan = require('morgan');
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
/////////////////////////////////
const mongoSanatize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');
////////////////////////////////

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
//set security http
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//rate limiter
const limiter=rateLimit({
  max:100,
  windowMs:60*60*1000,
  message:'Too many requests from this IP'
});
//limit requests from the same ip
app.use('/api',limiter);
//body parser (read data from req.body)
app.use(express.json());

//data sanitize against nosql injection
app.use(mongoSanatize());

//data sanatize against xss (against html injection)
app.use(xss());

//prevent parameter pollution
app.use(hpp({
  whitelist:['duration']
}));

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
