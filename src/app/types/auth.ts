export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface IAuthLoginResponse {
  _id: string;
  username: string;
  email: string;
  token: string;
}
