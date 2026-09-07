import Joi from 'joi';

export const baseEnvSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  MQ_URI: Joi.string().uri().required(),
});
