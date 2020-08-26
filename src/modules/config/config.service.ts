import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import { ObjectSchema, object } from 'joi';

import * as fs from 'fs';

export interface EnvConfig {
  [key: string]: string;
}

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  /**
   * 确保设置所有需要的变量，并返回经过验证的JavaScript对象
   * 包括应用的默认值。
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    console.log(envConfig);
    const envVarsSchema: ObjectSchema = object({
      IS_START: Joi.string().valid('yes', 'no'),
      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'provision')
        .default('development'),
      SERVER_PORT: Joi.number().default(3000),
    });
    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      envConfig,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    console.log(`validatedEnvConfig`, validatedEnvConfig);
    return validatedEnvConfig;
  }

  get port(): number {
    return Number(this.envConfig.SERVER_PORT);
  }
  get isStart(): string {
    return this.envConfig.IS_START;
  }
  set isStart(value: string) {
    this.envConfig.IS_START = value;
  }
}
