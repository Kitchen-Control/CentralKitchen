import axiosClient from "./axiosClient";

const authApi = {
  login: (username, password) => {
    return axiosClient.post("/auth/login", {
      username,
      password,
    });
  },
};

export default authApi;