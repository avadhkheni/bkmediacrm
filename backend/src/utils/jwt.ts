import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: number, role: string, roleUpdatedAt?: Date) => {
  return jwt.sign(
    { 
      userId, 
      role,
      roleUpdatedAt: roleUpdatedAt || new Date() // Include role update timestamp for cache validation
    },
    process.env.JWT_SECRET as string, 
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any,
    }
  );
};

export const generateRefreshToken = (userId: number) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as any,
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string);
};
