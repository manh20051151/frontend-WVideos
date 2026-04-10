import axiosClient from './axiosClient';

export interface SubscriptionRequest {
  channelId: string;
}

export interface SubscriptionResponse {
  id: string;
  subscriberId: string;
  channelId: string;
  subscriberCount: number;
  subscribed: boolean;
}

export const subscriptionApi = {
  subscribe: (channelId: string): Promise<SubscriptionResponse> => {
    return axiosClient.post('/subscriptions', { channelId });
  },

  unsubscribe: (channelId: string): Promise<SubscriptionResponse> => {
    return axiosClient.delete('/subscriptions', { data: { channelId } });
  },

  getSubscriberCount: (channelId: string): Promise<number> => {
    return axiosClient.get(`/subscriptions/count/${channelId}`);
  },

  checkSubscription: (channelId: string): Promise<boolean> => {
    return axiosClient.get(`/subscriptions/status/${channelId}`);
  },

  getMySubscriptions: (): Promise<string[]> => {
    return axiosClient.get('/subscriptions/my-subscriptions');
  },
};