import { acceptHMRUpdate, defineStore } from 'pinia';


interface UserInfo {
  Username: string,
  Password: string,
  Nikename: string,
  Roles: string[],
}
// interface BasicUserInfo {
//   [key: string]: any;
//   /**
//    * 头像
//    */
//   avatar: string;
//   /**
//    * 用户昵称
//    */
//   realName: string;
//   /**
//    * 用户角色
//    */
//   roles?: string[];
//   /**
//    * 用户id
//    */
//   userId: string;
//   /**
//    * 用户名
//    */
//   username: string;
// }

interface AccessState {
  /**
   * 用户信息
   */
  userInfo: UserInfo | null;
  /**
   * 用户角色
   */
  userRoles: string[];
}

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore('core-user', {
  state: (): AccessState => ({
    userInfo: null,
    userRoles: [],
  }),
  actions: {
    setUserInfo(userInfo: UserInfo | null) {
      // 设置用户信息
      this.userInfo = userInfo;
      // 设置角色信息
      const roles = userInfo?.Roles ?? [];
      this.setUserRoles(roles);
    },
    setUserRoles(roles: string[]) {
      this.userRoles = roles;
    },
  }
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}
