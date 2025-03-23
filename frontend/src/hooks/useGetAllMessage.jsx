import { setMessages } from "@/redux/chatSlice";
import { setPosts } from "@/redux/postSlice";
import store from "@/redux/store";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const useGetAllMessage = () => {
  const dispatch = useDispatch();
  const { selectedUser } = useSelector((store) => store.auth);

  useEffect(() => {
    if (!selectedUser) return; // Prevent fetching when no user is selected
    const fetchAllMessage = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/v1/message/all/${selectedUser?._id}`,
          {
            withCredentials: true,
          }
        );
        if (res.data.success) {
          console.log("Fetched messages:", res.data.messages); // Debug messages
          dispatch(setMessages(res.data.messages));
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchAllMessage();
  }, [selectedUser, dispatch]);
};
export default useGetAllMessage;
