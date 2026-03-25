// export const generateOTP = (): string => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

import { randomInt } from 'crypto';
export const generateOTP = () => randomInt(100000, 999999).toString();