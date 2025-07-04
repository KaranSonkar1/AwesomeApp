const Joi = require("joi");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(0).required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.string().required(),
    image: Joi.object({
      url: Joi.string().uri().required(),
    }).optional(),
  }).required(),
});

const reviewSchema = Joi.object({
  review: Joi.object({
    title: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required(),
  }).required(),
});

const bookingSchema = Joi.object({
  checkIn: Joi.date().required(),
  checkOut: Joi.date().greater(Joi.ref("checkIn")).required(),
  price: Joi.number().min(0).required(),
});

module.exports = { listingSchema, reviewSchema, bookingSchema };
