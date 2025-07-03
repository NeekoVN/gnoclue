import axios from "axios";
import { ILoginRequest, IAuthLoginResponse, IRegisterRequest } from "../types/auth";

const BASE_URL = "http://localhost:6996/api/auth";

export const login = async (
  credentials: ILoginRequest
): Promise<IAuthLoginResponse> => {
  const res = await axios.post<IAuthLoginResponse>(`${BASE_URL}/login`, credentials);
  return res.data;
};

export const register = async (
  data: IRegisterRequest
): Promise<{ message: string }> => {
  const res = await axios.post<{ message: string }>(`${BASE_URL}/register`, data);
  return res.data;
};
