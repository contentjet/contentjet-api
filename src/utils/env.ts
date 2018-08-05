import { get } from 'lodash';

export const getEnv = (name: string, required: boolean = false): string => {
  const value = get(process.env, name) as string;
  if (!value && required) throw new Error(`Missing environment variable. ${name} must be set`);
  return value;
};
