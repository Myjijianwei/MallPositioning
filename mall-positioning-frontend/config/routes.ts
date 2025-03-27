// 路由配置
export default [
  // 用户认证相关路由
  {
    path: '/user',
    layout: false,
    routes: [
      { path: '/user/login', component: './User/Login' },
      { path: '/user/register', component: './User/Register' },
    ],
  },

  // 首页
  {
    path: '/welcome',
    icon: 'smile',
    component: './Welcome',
    name: '首页',
  },

  {
    path: '/real-time-monitoring',
    component: './Ward/LocationReporter',
    name: '上报位置',
    icon: 'compass',
    access: 'canWard',
  },
  {
    path: '/device/list',
    icon: 'mobile',
    name: '设备管理',
    access: 'canUser',
    component: './Device/List',
  },
  {
    path: '/device/detail/:id',
    component: './Device/Detail',
    name: '设备详情',
    hideInMenu: true,
  },


  {
    path: '/monitor/live/:deviceId',
    icon: 'home',
    name: '实时监控',
    access: 'canGuard',
    component: './Monitor/Live',

  },
  {
    path: '/fence',
    icon: 'home',
    name: '地理栅栏',
    access: 'canGuard',
    component: './Fence/index',

  },
  // 历史轨迹
  {
    path: '/history',
    icon: 'compass',
    name: '历史轨迹',
    access: 'canUser',
    routes: [
      {
        path: '/history/track/:deviceId',
        component: './History/Track',
        name: '轨迹回放',
        // hideInMenu: true,
      },
      {
        path: '/history/analysis',
        component: './History/Analysis',
        name: '轨迹分析',
      },
    ],
  },
  {
    path: '/application',
    name: '申请管理',
    icon: 'form', // 菜单图标
    routes: [
      {
        path: '/application/submit',
        name: '提交申请',
        component: './Application/SubmitForm', // 提交申请页面
      },
      {
        path: '/application/list',
        name: '申请记录',
        component: './Application/ApplicationList', // 申请记录页面
      },
    ],
  },
  {
    path: '/notification',
    name: '通知中心',
    icon: 'bell', // 菜单图标
    component: './Notification/NotificationList', // 通知中心页面
    hideInMenu: true,
  },
  // 系统管理（管理员权限）
  {
    path: '/admin',
    icon: 'crown',
    name: '系统管理',
    access: 'canAdmin',
    routes: [
      { path: '/admin', redirect: '/admin/user' },
      {
        icon: 'user',
        path: '/admin/user',
        component: './Admin/User',
        name: '用户管理'
      },
      {
        icon: 'setting',
        path: '/admin/system',
        component: './Admin/System',
        name: '系统设置',
      },
    ],
  },

  {
    path: '/personal', // 个人中心相关路由
    name: '个人中心',
    icon: 'user',
    hideInMenu: true, // 不在菜单中显示
    component: './User/Person', // 个人中心页面
  },

  // 默认路由
  { path: '/', redirect: '/welcome' },

  // 404页面
  { path: '*', layout: false, component: './404' },
];
