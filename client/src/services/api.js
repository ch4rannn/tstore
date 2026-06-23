// RTK Query API Service
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Auto-refresh on 401
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = api.getState().auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await baseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        api.dispatch({
          type: 'auth/setTokens',
          payload: refreshResult.data,
        });
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: 'auth/logout' });
      }
    } else {
      api.dispatch({ type: 'auth/logout' });
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Products', 'Product', 'User', 'Chats', 'Messages', 'Wishlist', 'AdminProducts', 'AdminUsers', 'AdminPayments', 'AdminReports'],
  endpoints: (builder) => ({
    // ═══ Auth ═══
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    resendOtp: builder.mutation({
      query: (body) => ({ url: '/auth/resend-otp', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),

    // ═══ Products ═══
    getProducts: builder.query({
      query: (params) => ({ url: '/products', params }),
      providesTags: ['Products'],
    }),
    getFeaturedProducts: builder.query({
      query: () => '/products/featured',
      providesTags: ['Products'],
    }),
    searchProducts: builder.query({
      query: (q) => ({ url: '/products/search', params: { q } }),
    }),
    getProduct: builder.query({
      query: (slug) => `/products/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Products', 'Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Products'],
    }),
    getMyProducts: builder.query({
      query: (params) => ({ url: '/products/seller/my', params }),
      providesTags: ['Products'],
    }),

    // ═══ Users ═══
    getMe: builder.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({ url: '/users/me', method: 'PUT', body }),
      invalidatesTags: ['User'],
    }),
    getUserProfile: builder.query({
      query: (id) => `/users/${id}`,
    }),

    // ═══ Wishlist ═══
    getWishlist: builder.query({
      query: () => '/users/wishlist/all',
      providesTags: ['Wishlist'],
    }),
    toggleWishlist: builder.mutation({
      query: (productId) => ({ url: `/users/wishlist/${productId}`, method: 'POST' }),
      invalidatesTags: ['Wishlist', 'Product'],
    }),

    // ═══ Ratings ═══
    submitRating: builder.mutation({
      query: (body) => ({ url: '/users/ratings', method: 'POST', body }),
    }),

    // ═══ Reports ═══
    submitReport: builder.mutation({
      query: (body) => ({ url: '/users/reports', method: 'POST', body }),
    }),

    // ═══ Chat ═══
    getChats: builder.query({
      query: () => '/chats',
      providesTags: ['Chats'],
    }),
    createChat: builder.mutation({
      query: (body) => ({ url: '/chats', method: 'POST', body }),
      invalidatesTags: ['Chats'],
    }),
    getChatMessages: builder.query({
      query: ({ chatId, before }) => ({ url: `/chats/${chatId}/messages`, params: { before } }),
      providesTags: (result, error, { chatId }) => [{ type: 'Messages', id: chatId }],
    }),
    sendMessage: builder.mutation({
      query: ({ chatId, ...body }) => ({ url: `/chats/${chatId}/messages`, method: 'POST', body }),
      invalidatesTags: ['Chats'],
    }),

    // ═══ Payments ═══
    initiatePayment: builder.mutation({
      query: (body) => ({ url: '/payments/initiate', method: 'POST', body }),
    }),
    verifyPayment: builder.mutation({
      query: (body) => ({ url: '/payments/verify', method: 'POST', body }),
    }),
    checkPayment: builder.query({
      query: () => '/payments/check',
    }),
    getMyPayments: builder.query({
      query: () => '/payments/my',
    }),

    // ═══ Upload ═══
    getPresignedUrl: builder.mutation({
      query: (body) => ({ url: '/upload/presign', method: 'POST', body }),
    }),

    // ═══ Admin ═══
    getAdminDashboard: builder.query({
      query: () => '/admin/dashboard',
    }),
    getAdminProducts: builder.query({
      query: (params) => ({ url: '/admin/products', params }),
      providesTags: ['AdminProducts'],
    }),
    updateProductStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/products/${id}`, method: 'PUT', body }),
      invalidatesTags: ['AdminProducts'],
    }),
    getAdminUsers: builder.query({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['AdminUsers'],
    }),
    banUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}/ban`, method: 'PUT', body }),
      invalidatesTags: ['AdminUsers', 'AdminUserStats'],
    }),
    getAdminUserStats: builder.query({
      query: () => '/admin/users/stats',
      providesTags: ['AdminUserStats'],
    }),
    getAdminUserDetails: builder.query({
      query: (id) => `/admin/users/${id}/details`,
      providesTags: (result, error, id) => [{ type: 'AdminUsers', id }],
    }),
    adminResetPassword: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}/reset-password`, method: 'PUT' }),
    }),
    adminDeleteUser: builder.mutation({
      query: (id) => ({ url: `/admin/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AdminUsers', 'AdminUserStats'],
    }),
    getAdminPayments: builder.query({
      query: (params) => ({ url: '/admin/payments', params }),
      providesTags: ['AdminPayments'],
    }),
    confirmPayment: builder.mutation({
      query: (id) => ({ url: `/admin/payments/${id}/confirm`, method: 'PUT' }),
      invalidatesTags: ['AdminPayments'],
    }),
    getAdminReports: builder.query({
      query: (params) => ({ url: '/admin/reports', params }),
      providesTags: ['AdminReports'],
    }),
    updateReport: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/reports/${id}`, method: 'PUT', body }),
      invalidatesTags: ['AdminReports'],
    }),
  }),
});

export const {
  useRegisterMutation, useVerifyOtpMutation, useLoginMutation, useResendOtpMutation,
  useForgotPasswordMutation, useResetPasswordMutation,
  useGetProductsQuery, useGetFeaturedProductsQuery, useSearchProductsQuery,
  useGetProductQuery, useCreateProductMutation, useUpdateProductMutation,
  useDeleteProductMutation, useGetMyProductsQuery,
  useGetMeQuery, useUpdateProfileMutation, useGetUserProfileQuery,
  useGetWishlistQuery, useToggleWishlistMutation,
  useSubmitRatingMutation, useSubmitReportMutation,
  useGetChatsQuery, useCreateChatMutation, useGetChatMessagesQuery, useSendMessageMutation,
  useInitiatePaymentMutation, useVerifyPaymentMutation, useCheckPaymentQuery, useGetMyPaymentsQuery,
  useGetPresignedUrlMutation,
  useGetAdminDashboardQuery, useGetAdminProductsQuery, useUpdateProductStatusMutation,
  useGetAdminDashboardStatsQuery,
  useGetAdminUserStatsQuery,
  useGetAdminUsersQuery,
  useGetAdminUserDetailsQuery,
  useBanUserMutation,
  useAdminResetPasswordMutation,
  useAdminDeleteUserMutation,
  useGetAdminPaymentsQuery, useConfirmPaymentMutation,
  useGetAdminReportsQuery, useUpdateReportMutation,
} = api;
