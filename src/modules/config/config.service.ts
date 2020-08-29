import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as Joi from '@hapi/joi';
import { ObjectSchema, object } from '@hapi/joi';

import * as fs from 'fs';

export interface EnvConfig {
  [key: string]: any;
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
    console.log(envConfig, `envConfig1111`);
    const envVarsSchema: ObjectSchema = object({
      IS_START: Joi.boolean().valid(false, true),
      allowed: Joi.boolean().valid(false, true),
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

  get isStart(): boolean {
    return this.envConfig.IS_START;
  }
  set isStart(value: boolean) {
    this.envConfig.IS_START = value;
  }
  get allowed(): boolean {
    return this.envConfig.allowed;
  }
  set allowed(allowed: boolean) {
    this.envConfig.allowed = allowed;
  }
}
