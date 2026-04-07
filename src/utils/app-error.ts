export type AppError = {
  message: string;
  statusCode: number;
  isOperational: boolean;
};

export const createAppError = (message: string, statusCode: number = 500): AppError => ({
  message,
  statusCode,
  isOperational: true,
});