import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    username: string;
    password: string;
    
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  /** 刷新token接口返回值 */
  export interface RefreshTokenResult {
    accessToken: string;
  }

  /**用户基础信息接口返回值 */
  export interface UserMe {
    username: string;
  }

  /**用户详细信息接口返回值 */
  export interface UserInfo {
    Username: string,
    Password: string,
    Nikename: string,
    Roles: string[],
  }

  /**用户列表查询参数 */
  export interface UserListParams {
    username?: string;
    page?: number;
    page_size?: number;
  }

  /**用户列表个体 */
  export interface UserListItem {
    id: number;
    Username: string;
    Nickname: string;
    Remark: string;
    Status: number;
    Roles: string[];
  }

  /**创建用户参数 */
  export interface CreateUserParams {
    username: string;
    password: string;
    nickname?: string;
    remark?: string;
    roles?: string[];
  }

  /**更新用户参数 */
  export interface UpdateUserParams {
    password?: string; 
    nickname?: string; 
    remark?: string; 
    status?: number; 
    roles?: string[] 
  }
}

/**
 * 登录
 */
export function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 退出登录
 */
export function logoutApi() {
  return requestClient.post<null>('/auth/logout', {
    withCredentials: true,
  });
}


/**
 * 刷新accessToken
 */
export function refreshTokenApi() {
  return requestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/** 当前用户基础信息 GET /auth/me */
export function getAuthMe() {
  return requestClient.get<AuthApi.UserMe>('/auth/me');
}

/** 当前用户详细信息 GET /auth/userinfo */
export function getAuthUserinfo() {
  return requestClient.get<AuthApi.UserInfo>('/auth/userinfo');
}


/** 用户列表（未传分页返回全部，需 auth 角色） GET /auth/users */
export function getAuthUsers(params: AuthApi.UserListParams){
  return requestClient.get<AuthApi.UserListItem[]>('/auth/users',{params});
}
  

/** 创建用户（需要 auth 角色） POST /auth/users */
export function createAuthUsers(data: AuthApi.CreateUserParams) {
    return requestClient.post<{id: number}>('/auth/users',data);
  }
  
/** 更新用户（需要 auth 角色） PUT /auth/users/${param0} */
export function updateAuthUsers(id: number, data: AuthApi.UpdateUserParams){
  return requestClient.put<null>(`/auth/users/${id}`,data);
}
  

/** 删除用户（需要 auth 角色） DELETE /auth/users/${param0} */
export function deleteAuthUsers(id: number){
  return requestClient.delete<null>(`/auth/users/${id}`);
}

