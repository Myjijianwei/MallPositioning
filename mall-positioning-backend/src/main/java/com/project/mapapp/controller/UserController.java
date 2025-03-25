package com.project.mapapp.controller;

import cn.hutool.core.util.ReUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.alibaba.fastjson.JSON;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.plugins.pagination.PageDTO;
import com.project.mapapp.common.BaseResponse;
import com.project.mapapp.common.DeleteRequest;
import com.project.mapapp.common.ErrorCode;
import com.project.mapapp.common.ResultUtils;
import com.project.mapapp.exception.BusinessException;
import com.project.mapapp.mapper.UserMapper;
import com.project.mapapp.mapper.WardMapper;
import com.project.mapapp.model.dto.user.*;
import com.project.mapapp.model.entity.User;
import com.project.mapapp.model.entity.Ward;
import com.project.mapapp.model.vo.UserVO;
import com.project.mapapp.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.*;
import java.util.stream.Collectors;

import static jdk.nashorn.internal.runtime.regexp.joni.Config.log;

/**
 * 用户接口
 *
 * @author jjw
 */
@RestController
@RequestMapping("/user")
@Slf4j
public class UserController {

    @Resource
    private UserService userService;

    // region 登录相关

    /**
     * 用户注册
     *
     * @param userRegisterRequest
     * @return
     */
    private static final String AVATAR_API_URL = "https://cn.apihz.cn/api/img/apihzimgtx.php";
    private static final String USERNAME_API_URL = "https://cn.apihz.cn/api/zici/sjwm.php";
    private static final String API_ID = "88888888";
    private static final String API_KEY = "88888888";
    @Autowired
    private WardMapper wardMapper;
    @Autowired
    private UserMapper userMapper;


    @PostMapping("/register")
    public BaseResponse<Long> userRegister(@RequestBody UserRegisterRequest userRegisterRequest) {
        if (userRegisterRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String userAccount = userRegisterRequest.getUserAccount();
        String email = userRegisterRequest.getEmail();
        String userPassword = userRegisterRequest.getUserPassword();
        String checkPassword = userRegisterRequest.getCheckPassword();
        String code = userRegisterRequest.getCode();
        String userRole = userRegisterRequest.getUserRole();

        if (!ReUtil.isMatch("^[A-Za-z0-9+_.-]+@(.+)$", email)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "邮箱格式不正确");
        }

        if (StringUtils.isAnyBlank(userAccount, userPassword, checkPassword, email, code)) {
            return null;
        }

        // 构建头像请求参数
        Map<String, Object> avatarParams = new HashMap<>();
        avatarParams.put("id", API_ID);
        avatarParams.put("key", API_KEY);
        avatarParams.put("type", 1);
        avatarParams.put("imgtype", 2);

        // 构建随机用户名请求参数
        Map<String, Object> usernameParams = new HashMap<>();
        usernameParams.put("id", API_ID);
        usernameParams.put("key", API_KEY);

        try {
            // 使用Hutool发送HTTP GET请求获取头像URL
            String avatarResponse = HttpUtil.get(AVATAR_API_URL, avatarParams);
            String avatarUrl = parseResponse(avatarResponse);
            log.info("avatarUrl:{}", avatarUrl);

            // 使用Hutool发送HTTP GET请求获取随机用户名
            String usernameResponse = HttpUtil.get(USERNAME_API_URL, usernameParams);
            String randomUsername = parseResponse(usernameResponse);
            log.info("randomUsername:{}", randomUsername);

            // 调用注册服务并传入头像URL和随机用户名
            long result = userService.userRegister(userAccount, userPassword, checkPassword, email, code, avatarUrl, randomUsername, userRole);
            return ResultUtils.success(result);
        } catch (Exception e) {
            log.error("获取头像或用户名失败，详细信息：", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "获取头像或用户名失败");
        }
    }

    // 解析响应结果的方法
    private String parseResponse(String response) {
        try {
            JSONObject jsonObject = JSONUtil.parseObj(response);
            return jsonObject.getStr("msg");
        } catch (Exception e) {
            log.error("解析响应结果失败，响应内容：{}", response, e);
            return response;
        }
    }

    /**
     * 用户登录
     *
     * @param userLoginRequest
     * @param request
     * @return
     */
    @PostMapping("/login")
    public BaseResponse<User> userLogin(@RequestBody UserLoginRequest userLoginRequest, HttpServletRequest request) {
        if (userLoginRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String userAccount = userLoginRequest.getUserAccount();
        String userPassword = userLoginRequest.getUserPassword();
        if (StringUtils.isAnyBlank(userAccount, userPassword)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = userService.userLogin(userAccount, userPassword, request);
        return ResultUtils.success(user);
    }

    @PostMapping("/loginByEmail")
    public BaseResponse<User> loginByEmail(@RequestBody UserLoginRequest user, HttpServletRequest request) {
        log.info("Received login request: email={}, code={}", user.getEmail(), user.getCode());
        try {
            String email = user.getEmail();
            String code = user.getCode();
            if (StrUtil.isEmpty(email) || StrUtil.isEmpty(code)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR);
            }
            User user1 = userService.loginByEmail(email, code, request);
            return ResultUtils.success(user1);
        } catch (Exception e) {
            log.error("Login failed: ", e);
            throw e;
        }
    }

    /**
     * 用户注销
     *
     * @param request
     * @return
     */
    @PostMapping("/logout")
    public BaseResponse<Boolean> userLogout(HttpServletRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        boolean result = userService.userLogout(request);
        return ResultUtils.success(result);
    }

    /**
     * 获取当前登录用户
     *
     * @param request
     * @return
     */
    @GetMapping("/get/login")
    public BaseResponse<UserVO> getLoginUser(HttpServletRequest request) {
        User user = userService.getLoginUser(request);
        UserVO userVO = new UserVO();
        BeanUtils.copyProperties(user, userVO);
        return ResultUtils.success(userVO);
    }

// endregion

// region 增删改查

    /**
     * 创建用户
     *
     * @param userAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    public BaseResponse<Long> addUser(@RequestBody UserAddRequest userAddRequest, HttpServletRequest request) {
        if (userAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = new User();
        BeanUtils.copyProperties(userAddRequest, user);
        boolean result = userService.save(user);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR);
        }
        return ResultUtils.success(user.getId());
    }

    /**
     * 删除用户
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteUser(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        boolean b = userService.removeById(deleteRequest.getId());
        return ResultUtils.success(b);
    }

    /**
     * 更新用户
     *
     * @param userUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    public BaseResponse<Boolean> updateUser(@RequestBody UserUpdateRequest userUpdateRequest, HttpServletRequest request) {
        if (userUpdateRequest == null || userUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "参数错误");
        }

        log.info("传来的数据：{}", userUpdateRequest);

        boolean result = userService.updateUser(userUpdateRequest);
        if (!result) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "更新失败");
        }

        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取用户
     *
     * @param id
     * @param request
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<UserVO> getUserById(int id, HttpServletRequest request) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        User user = userService.getById(id);
        UserVO userVO = new UserVO();
        BeanUtils.copyProperties(user, userVO);
        return ResultUtils.success(userVO);
    }

    /**
     * 获取用户列表
     *
     * @param userQueryRequest
     * @param request
     * @return
     */
    @GetMapping("/list")
    public BaseResponse<List<UserVO>> listUser(UserQueryRequest userQueryRequest, HttpServletRequest request) {
        User userQuery = new User();
        if (userQueryRequest != null) {
            BeanUtils.copyProperties(userQueryRequest, userQuery);
        }
        QueryWrapper<User> queryWrapper = new QueryWrapper<>(userQuery);
        List<User> userList = userService.list(queryWrapper);
        List<UserVO> userVOList = userList.stream().map(user -> {
            UserVO userVO = new UserVO();
            BeanUtils.copyProperties(user, userVO);
            return userVO;
        }).collect(Collectors.toList());
        return ResultUtils.success(userVOList);
    }

    /**
     * 分页获取用户列表
     *
     * @param userQueryRequest
     * @param request
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<UserVO>> listUserByPage(UserQueryRequest userQueryRequest, HttpServletRequest request) {
        long current = 1;
        long size = 10;
        User userQuery = new User();
        if (userQueryRequest != null) {
            BeanUtils.copyProperties(userQueryRequest, userQuery);
            current = userQueryRequest.getCurrent();
            size = userQueryRequest.getPageSize();
        }
        QueryWrapper<User> queryWrapper = new QueryWrapper<>(userQuery);
        Page<User> userPage = userService.page(new Page<>(current, size), queryWrapper);
        Page<UserVO> userVOPage = new PageDTO<>(userPage.getCurrent(), userPage.getSize(), userPage.getTotal());
        List<UserVO> userVOList = userPage.getRecords().stream().map(user -> {
            UserVO userVO = new UserVO();
            BeanUtils.copyProperties(user, userVO);
            return userVO;
        }).collect(Collectors.toList());
        userVOPage.setRecords(userVOList);
        return ResultUtils.success(userVOPage);
    }


    @PostMapping("getWardByGid")
    public BaseResponse<List<WardRequest>> getWardByGid(int guardianId,HttpServletRequest request) {
        log.info("传来的数据guardianId={}", guardianId);
        try {
            // 获取登录用户
            User loginUser = userService.getLoginUser(request);

            // 创建查询条件
            QueryWrapper<Ward> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("userId", loginUser.getId());

            // 查询监护信息
            List<Ward> wardList = wardMapper.selectList(queryWrapper);
            List<WardRequest> wardRequestList = new ArrayList<>();

            // 转换为WardRequest对象
            for (Ward ward : wardList) {
                WardRequest wardRequest = new WardRequest();
                BeanUtils.copyProperties(ward, wardRequest);
                User user = userMapper.selectById(ward.getId());
                if (user != null) {
                    wardRequest.setName(user.getUserName());
                }
                wardRequestList.add(wardRequest);
            }

            return ResultUtils.success(wardRequestList);
        } catch (Exception e) {
            log.error("获取监护信息失败", e);
            return ResultUtils.error(ErrorCode.OPERATION_ERROR, "获取监护信息失败");
        }
    }

}
