import type { AuthApi } from '#/api/core';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

// import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

import { loginApi, logoutApi, getAuthUserinfo} from '#/api/core';


export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: AuthApi.LoginParams,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | AuthApi.UserInfo = null;
    try {
      loginLoading.value = true;
      const { accessToken } = await loginApi(params);

      // 如果成功获取到 accessToken
      if (accessToken) {
        accessStore.setAccessToken(accessToken);

        userInfo = await fetchUserInfo();
        if (!userInfo) {
          // 未获取到用户信息，清除 Token 并终止流程
          accessStore.setAccessToken(null);
          notification.error({
            message: $t('authentication.loginFail'),
            description: $t('authentication.loginFailNoUserInfo'),
            duration: 3,
          });
          return { userInfo: null }; // 直接返回，不执行后续跳转
        }
        const accessCodes = userInfo?.Roles ?? [];

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.Username) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.Username}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } catch (error) {
      console.error('登录异常：', error);
      notification.error({
        message: $t('authentication.loginFail'),
        description: $t('authentication.loginFailDesc'),
        duration: 3,
      });
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | AuthApi.UserInfo = null;
    try {
      userInfo = await getAuthUserinfo();
      userStore.setUserInfo(userInfo);
    } catch (error) {
      console.error('获取用户信息失败：', error);
      notification.error({
        message: $t('authentication.fetchUserInfoFail'),
        description: $t('authentication.fetchUserInfoFailDesc'),
        duration: 3,
      });
      userInfo = null; // 确保失败时返回 null
    }
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
