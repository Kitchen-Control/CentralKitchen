import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://kitchencontrolbe.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;