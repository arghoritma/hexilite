import HyperExpress from 'hyper-express';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  sessionId: string;
  deviceId: string;
}

declare global {
  namespace HyperExpress {
    interface Request {
      user?: UserPayload;
    }
  }
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  session: {
    id: string;
    deviceId: string;
    expiresAt: Date;
  };
}
