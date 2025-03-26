/**
 * @see https://umijs.org/zh-CN/plugins/plugin-access
 * */
export default function access(initialState: InitialState | undefined) {
  const { loginUser } = initialState ?? {};
  return {
    canUser: loginUser?.userRole === 'guardian' || loginUser?.userRole === 'ward' || !loginUser, // 未登录用户也可以访问普通用户路由
    canAdmin: loginUser?.userRole === 'admin',
    canGuard: loginUser?.userRole === 'guardian',
    canWard: loginUser?.userRole === 'ward',
  };
}
