const Joi = require("joi");

const urlSchema = Joi.object({
  originalUrl: Joi.string().uri().required()
});

const validateUrl = (req, res, next) => {
  const { error } = urlSchema.validate(req.body);

  if (error) {
    const err = new Error("Please provide a valid URL");
    err.statusCode = 400;
    return next(err);
  }

  next();
};

module.exports = validateUrl;