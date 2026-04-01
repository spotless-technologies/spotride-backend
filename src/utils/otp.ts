import { randomInt } from 'crypto';
export const generateOTP = () => randomInt(100000, 999999).toString();