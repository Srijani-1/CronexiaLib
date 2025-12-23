import axios from "axios";
import { API_BASE_URL } from "../config/api";

export const communityAPI = {
    getDiscussions: (category?: string) =>
        axios.get(`${API_BASE_URL}/community/discussions/get`, {
            params: { category }
        }),

    createDiscussion: (data: {
        title: string;
        content: string;
        category: string;
        group_id?: number;
        tags?: string[];
    }) =>
        axios.post(`${API_BASE_URL}/community/discussions/create`, data),

    getGroups: () =>
        axios.get(`${API_BASE_URL}/community/groups/get`),

    joinGroup: (groupId: number) =>
        axios.post(`${API_BASE_URL}/community/groups/${groupId}/join`),

    getGroupDetails: (groupId: number) =>
        axios.get(`${API_BASE_URL}/community/groups/${groupId}`),

    addComment: (data: { discussion_id: number; content: string }) =>
        axios.post(`${API_BASE_URL}/community/comments`, data),
};
