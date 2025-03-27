import { Dropdown } from 'antd';
// @ts-ignore
import type { DropDownProps, MenuProps } from 'antd/es/dropdown';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

export type HeaderDropdownProps = {
  overlayClassName?: string;
  menu: MenuProps;  // 修改为使用MenuProps类型
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topCenter' | 'topRight' | 'bottomCenter';
} & Omit<DropDownProps, 'overlay'>;  // 从排除列表中移除'overlay'

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
                                                         overlayClassName: cls,
                                                         menu,  // 接收menu属性
                                                         ...restProps
                                                       }) => (
  <Dropdown
    menu={menu}  // 使用menu属性替代overlay
    overlayClassName={classNames(styles.container, cls)}
    getPopupContainer={(target) => target.parentElement || document.body}
    {...restProps}
  />
);

export default HeaderDropdown;

