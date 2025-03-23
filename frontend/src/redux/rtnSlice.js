import { createSlice } from "@reduxjs/toolkit";

const rtnSlice = createSlice({
    name: 'realTimeNotification',
    initialState: {
        likeNotification: [],
    },
    reducers: {
        setLikeNotification: (state, action) => {
            console.log('action.payload: ', action.payload);
            if (action.payload.type === 'like') {
                // Check if notification already exists to prevent duplicates
                const exists = state.likeNotification.some(
                    notif => notif.userId === action.payload.userId && 
                            notif.postId === action.payload.postId
                );
                if (!exists) {
                    state.likeNotification.push(action.payload);
                }
            } else if (action.payload.type === 'dislike') {
                // Remove notification based on both userId and postId
                state.likeNotification = state.likeNotification.filter(
                    item => !(item.userId === action.payload.userId && 
                            item.postId === action.payload.postId)
                );
            }
        },
        clearNotifications: (state) => {
            state.likeNotification = [];
        }
    }
});
export const {setLikeNotification} = rtnSlice.actions;
export default rtnSlice.reducer;